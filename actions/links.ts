'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { linkCategories, links } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/server'
import type { LinkCategory, Link } from '@/lib/db/schema'

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<LinkCategory[]> {
  const user = await requireUser()

  const data = await db
    .select()
    .from(linkCategories)
    .where(eq(linkCategories.userId, user.id))
    .orderBy(asc(linkCategories.sortOrder))

  return data
}

export async function createCategory(name: string, icon: string = '📁'): Promise<LinkCategory> {
  const user = await requireUser()

  // Get max sort_order
  const [maxOrderResult] = await db
    .select({ sortOrder: linkCategories.sortOrder })
    .from(linkCategories)
    .where(eq(linkCategories.userId, user.id))
    .orderBy(desc(linkCategories.sortOrder))
    .limit(1)

  const maxOrder = maxOrderResult?.sortOrder ?? -1

  try {
    const [data] = await db
      .insert(linkCategories)
      .values({
        userId: user.id,
        name,
        icon,
        sortOrder: maxOrder + 1,
      })
      .returning()

    revalidatePath('/links')
    return data
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      throw new Error('Kategorie s tímto názvem již existuje')
    }
    throw error
  }
}

export async function updateCategory(id: string, name: string, icon: string) {
  await db
    .update(linkCategories)
    .set({ name, icon })
    .where(eq(linkCategories.id, id))

  revalidatePath('/links')
}

export async function deleteCategory(id: string) {
  await db.delete(linkCategories).where(eq(linkCategories.id, id))

  revalidatePath('/links')
}

export async function reorderCategories(categoryIds: string[]) {
  // Update sort_order for each category
  for (let i = 0; i < categoryIds.length; i++) {
    await db
      .update(linkCategories)
      .set({ sortOrder: i })
      .where(eq(linkCategories.id, categoryIds[i]))
  }

  revalidatePath('/links')
}

// ============================================
// LINKS
// ============================================

export async function getLinks(categoryId?: string): Promise<Link[]> {
  const user = await requireUser()

  if (categoryId) {
    const data = await db
      .select()
      .from(links)
      .where(eq(links.categoryId, categoryId))
      .orderBy(desc(links.createdAt))
    return data
  }

  const data = await db
    .select()
    .from(links)
    .where(eq(links.userId, user.id))
    .orderBy(desc(links.createdAt))

  return data
}

export async function getAllLinks(): Promise<Link[]> {
  const user = await requireUser()

  const data = await db
    .select()
    .from(links)
    .where(eq(links.userId, user.id))
    .orderBy(desc(links.createdAt))

  return data
}

export async function createLink(
  title: string,
  url: string,
  categoryId: string | null,
  description?: string,
  tags?: string[]
): Promise<Link> {
  const user = await requireUser()

  // Ensure URL has protocol
  let finalUrl = url.trim()
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl
  }

  const [data] = await db
    .insert(links)
    .values({
      userId: user.id,
      title,
      url: finalUrl,
      categoryId,
      description: description || null,
      tags: tags || [],
    })
    .returning()

  revalidatePath('/links')
  return data
}

export async function updateLink(
  id: string,
  title: string,
  url: string,
  categoryId: string | null,
  description?: string,
  tags?: string[]
) {
  let finalUrl = url.trim()
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl
  }

  await db
    .update(links)
    .set({
      title,
      url: finalUrl,
      categoryId,
      description: description || null,
      tags: tags || [],
    })
    .where(eq(links.id, id))

  revalidatePath('/links')
}

export async function deleteLink(id: string) {
  await db.delete(links).where(eq(links.id, id))

  revalidatePath('/links')
}

export async function updateLinkTags(id: string, tags: string[]) {
  await db
    .update(links)
    .set({ tags })
    .where(eq(links.id, id))

  revalidatePath('/links')
}
