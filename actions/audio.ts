'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AudioNoteInsert } from '@/lib/supabase/types'

export async function createAudioNote(audioPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const note: AudioNoteInsert = {
    user_id: user.id,
    audio_path: audioPath,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('audio_notes')
    .insert(note)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/voice-notes')
  return data
}

export async function getAudioNotes(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audio_notes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAudioNote(id: string) {
  const supabase = await createClient()

  // Získej audio_path pro smazání ze storage
  const { data: note } = await supabase
    .from('audio_notes')
    .select('audio_path')
    .eq('id', id)
    .single()

  // Smaž soubor ze storage (pokud existuje)
  if (note?.audio_path) {
    await supabase.storage
      .from('audio-uploads')
      .remove([note.audio_path])
  }

  // Smaž záznam z DB
  const { error } = await supabase
    .from('audio_notes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/voice-notes')
}
