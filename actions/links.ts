'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LinkCategory, Link } from '@/lib/supabase/types'

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<LinkCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('link_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createCategory(name: string, icon: string = '📁'): Promise<LinkCategory> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get max sort_order
  const { data: categories } = await supabase
    .from('link_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = categories?.[0]?.sort_order ?? -1

  const { data, error } = await supabase
    .from('link_categories')
    .insert({
      user_id: user.id,
      name,
      icon,
      sort_order: maxOrder + 1,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Kategorie s tímto názvem již existuje')
    }
    throw new Error(error.message)
  }

  revalidatePath('/links')
  return data
}

export async function updateCategory(id: string, name: string, icon: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('link_categories')
    .update({ name, icon })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/links')
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('link_categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/links')
}

export async function reorderCategories(categoryIds: string[]) {
  const supabase = await createClient()

  // Update sort_order for each category
  for (let i = 0; i < categoryIds.length; i++) {
    await supabase
      .from('link_categories')
      .update({ sort_order: i })
      .eq('id', categoryIds[i])
  }

  revalidatePath('/links')
}

// ============================================
// LINKS
// ============================================

export async function getLinks(categoryId?: string): Promise<Link[]> {
  const supabase = await createClient()

  let query = supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAllLinks(): Promise<Link[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createLink(
  title: string,
  url: string,
  categoryId: string | null,
  description?: string,
  tags?: string[]
): Promise<Link> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Ensure URL has protocol
  let finalUrl = url.trim()
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl
  }

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      title,
      url: finalUrl,
      category_id: categoryId,
      description: description || null,
      tags: tags || [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

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
  const supabase = await createClient()

  let finalUrl = url.trim()
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl
  }

  const { error } = await supabase
    .from('links')
    .update({
      title,
      url: finalUrl,
      category_id: categoryId,
      description: description || null,
      tags: tags || [],
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/links')
}

export async function deleteLink(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/links')
}

export async function updateLinkTags(id: string, tags: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('links')
    .update({ tags })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/links')
}
