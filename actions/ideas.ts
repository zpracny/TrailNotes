'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/server'

export type IdeaStatus = 'todo' | 'in-progress' | 'done'

export async function getIdeas() {
  const user = await requireUser()

  const data = await db
    .select()
    .from(ideas)
    .where(eq(ideas.userId, user.id))
    .orderBy(desc(ideas.createdAt))

  return data
}

export async function getIdea(id: string) {
  const [data] = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, id))
    .limit(1)

  if (!data) throw new Error('Idea not found')
  return data
}

export async function createIdea(formData: FormData) {
  const user = await requireUser()

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const tagsString = formData.get('tags') as string | null
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  await db.insert(ideas).values({
    userId: user.id,
    title,
    description,
    tags,
    status: 'todo',
  })

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdea(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const tagsString = formData.get('tags') as string | null
  const status = formData.get('status') as IdeaStatus
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  await db
    .update(ideas)
    .set({
      title,
      description,
      tags,
      status,
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, id))

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
  revalidatePath(`/ideas/${id}`)
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  await db
    .update(ideas)
    .set({ status, updatedAt: new Date() })
    .where(eq(ideas.id, id))

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function deleteIdea(id: string) {
  await db.delete(ideas).where(eq(ideas.id, id))

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdeaTags(id: string, tags: string[]) {
  await db
    .update(ideas)
    .set({ tags, updatedAt: new Date() })
    .where(eq(ideas.id, id))

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function updateIdeaLinks(id: string, links: string[]) {
  await db
    .update(ideas)
    .set({ links, updatedAt: new Date() })
    .where(eq(ideas.id, id))

  revalidatePath('/ideas')
  revalidatePath('/dashboard')
}

export async function getIdeasStats() {
  const user = await requireUser()

  const data = await db
    .select({ status: ideas.status })
    .from(ideas)
    .where(eq(ideas.userId, user.id))

  return {
    total: data.length,
    todo: data.filter(i => i.status === 'todo').length,
    inProgress: data.filter(i => i.status === 'in-progress').length,
    done: data.filter(i => i.status === 'done').length,
  }
}

export async function exportIdeasCSV() {
  const user = await requireUser()

  const data = await db
    .select()
    .from(ideas)
    .where(eq(ideas.userId, user.id))
    .orderBy(desc(ideas.createdAt))

  const headers = ['Title', 'Description', 'Tags', 'Status', 'Created At']
  const rows = data.map(idea => [
    idea.title,
    idea.description || '',
    (idea.tags || []).join('; '),
    idea.status,
    idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : '',
  ])

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  return csv
}
