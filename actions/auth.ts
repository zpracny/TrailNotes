'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUser as getAuthUser } from '@/lib/auth/server'

export async function signOut() {
  // Neon Auth handles sign out on client side
  // This is just for server-side cleanup if needed
  revalidatePath('/', 'layout')
  redirect('/auth/sign-in')
}

export async function getUser() {
  return await getAuthUser()
}

export async function getUserId(): Promise<string | null> {
  const user = await getAuthUser()
  return user?.id ?? null
}
