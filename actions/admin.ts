'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function isAdmin(email: string | undefined): Promise<boolean> {
  return email === ADMIN_EMAIL
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

export async function checkIsAdmin(): Promise<boolean> {
  const email = await getCurrentUserEmail()
  return isAdmin(email ?? undefined)
}

export async function getAccessMode(): Promise<'all' | 'whitelist'> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'access_mode')
    .single()

  return (data?.value as 'all' | 'whitelist') || 'all'
}

export async function setAccessMode(mode: 'all' | 'whitelist') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'access_mode', value: mode, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}

export async function getAllowedUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('allowed_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function addAllowedUser(email: string) {
  const supabase = await createClient()
  const adminEmail = await getCurrentUserEmail()

  const { error } = await supabase
    .from('allowed_users')
    .insert({ email: email.toLowerCase(), added_by: adminEmail })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Tento email už je v seznamu')
    }
    throw new Error(error.message)
  }

  revalidatePath('/admin')
}

export async function removeAllowedUser(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('allowed_users')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}

export async function isUserAllowed(email: string | undefined): Promise<boolean> {
  if (!email) return false

  // Admin má vždy přístup
  if (await isAdmin(email)) return true

  const accessMode = await getAccessMode()

  // Pokud je režim "all", všichni mají přístup
  if (accessMode === 'all') return true

  // Jinak kontrola whitelistu
  const supabase = await createClient()
  const { data } = await supabase
    .from('allowed_users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  return !!data
}
