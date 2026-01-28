'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { audioNotes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/server'

export async function createAudioNote(audioPath: string) {
  const user = await requireUser()

  const [data] = await db
    .insert(audioNotes)
    .values({
      userId: user.id,
      audioPath,
      status: 'pending',
    })
    .returning()

  revalidatePath('/voice-notes')
  return data
}

export async function getAudioNotes(limit: number = 10) {
  const user = await requireUser()

  const data = await db
    .select()
    .from(audioNotes)
    .where(eq(audioNotes.userId, user.id))
    .orderBy(desc(audioNotes.createdAt))
    .limit(limit)

  return data
}

export async function deleteAudioNote(id: string) {
  // Get audio_path for storage deletion
  const [note] = await db
    .select({ audioPath: audioNotes.audioPath })
    .from(audioNotes)
    .where(eq(audioNotes.id, id))
    .limit(1)

  // TODO: Delete file from Vercel Blob storage
  // if (note?.audioPath) {
  //   await del(note.audioPath)
  // }

  // Delete record from DB
  await db.delete(audioNotes).where(eq(audioNotes.id, id))

  revalidatePath('/voice-notes')
}
