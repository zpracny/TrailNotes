'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { appSettings, allowedUsers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getUser } from '@/lib/auth/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function isAdmin(email: string | undefined): Promise<boolean> {
  return email === ADMIN_EMAIL
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getUser()
  return user?.email || null
}

export async function checkIsAdmin(): Promise<boolean> {
  const email = await getCurrentUserEmail()
  return isAdmin(email ?? undefined)
}

export async function getAccessMode(): Promise<'all' | 'whitelist'> {
  const [data] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, 'access_mode'))
    .limit(1)

  return (data?.value as 'all' | 'whitelist') || 'all'
}

export async function setAccessMode(mode: 'all' | 'whitelist') {
  if (!await checkIsAdmin()) {
    throw new Error('Unauthorized')
  }

  // Upsert - update if exists, insert if not
  const [existing] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, 'access_mode'))
    .limit(1)

  if (existing) {
    await db
      .update(appSettings)
      .set({ value: mode, updatedAt: new Date() })
      .where(eq(appSettings.key, 'access_mode'))
  } else {
    await db.insert(appSettings).values({
      key: 'access_mode',
      value: mode,
    })
  }

  revalidatePath('/admin')
}

export async function getAllowedUsers() {
  const data = await db
    .select()
    .from(allowedUsers)
    .orderBy(desc(allowedUsers.createdAt))

  return data
}

export async function addAllowedUser(email: string) {
  if (!await checkIsAdmin()) {
    throw new Error('Unauthorized')
  }

  const adminEmail = await getCurrentUserEmail()

  try {
    await db.insert(allowedUsers).values({
      email: email.toLowerCase(),
      addedBy: adminEmail,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      throw new Error('Tento email už je v seznamu')
    }
    throw error
  }

  revalidatePath('/admin')
}

export async function removeAllowedUser(id: string) {
  if (!await checkIsAdmin()) {
    throw new Error('Unauthorized')
  }

  await db.delete(allowedUsers).where(eq(allowedUsers.id, id))

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
  const [data] = await db
    .select({ id: allowedUsers.id })
    .from(allowedUsers)
    .where(eq(allowedUsers.email, email.toLowerCase()))
    .limit(1)

  return !!data
}
