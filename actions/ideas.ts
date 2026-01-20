'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { IdeaInsert, IdeaUpdate, IdeaStatus } from '@/lib/supabase/types'

export async function getIdeas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getIdea(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createIdea(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const tagsString = formData.get('tags') as string | null
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : null

  const idea: IdeaInsert = {
    user_id: user.id,
    title,
    description,
    tags,
    status: 'todo',
  }

  const { error } = await supabase.from('ideas').insert(idea)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdea(id: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const tagsString = formData.get('tags') as string | null
  const status = formData.get('status') as IdeaStatus
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : null

  const update: IdeaUpdate = {
    title,
    description,
    tags,
    status,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('ideas')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
  revalidatePath(`/ideas/${id}`)
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ideas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function deleteIdea(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdeaTags(id: string, tags: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ideas')
    .update({ tags, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdeaLinks(id: string, links: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ideas')
    .update({ links, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function getIdeasStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ideas')
    .select('status')

  if (error) throw new Error(error.message)

  return {
    total: data.length,
    todo: data.filter(i => i.status === 'todo').length,
    inProgress: data.filter(i => i.status === 'in-progress').length,
    done: data.filter(i => i.status === 'done').length,
  }
}

export async function exportIdeasCSV() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const headers = ['Title', 'Description', 'Tags', 'Status', 'Created At']
  const rows = data.map(idea => [
    idea.title,
    idea.description || '',
    (idea.tags || []).join('; '),
    idea.status,
    new Date(idea.created_at).toLocaleDateString(),
  ])

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  return csv
}
