'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAudioNote, deleteAudioNote } from '@/actions/audio'
import type { AudioNote } from '@/lib/supabase/types'
import {
  Mic,
  Square,
  Loader2,
  FileAudio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MessageSquare,
} from 'lucide-react'

const STATUS_CONFIG = {
  pending: {
    label: 'Čeká na zpracování',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  processing: {
    label: 'Přepisuji...',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    animate: true,
  },
  done: {
    label: 'Hotovo',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  error: {
    label: 'Chyba',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
}

export default function VoiceNotesPage() {
  const [notes, setNotes] = useState<AudioNote[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch initial notes
  const fetchNotes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('audio_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotes(data)
  }, [])

  // Setup realtime subscription
  useEffect(() => {
    fetchNotes()

    const supabase = createClient()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('audio_notes_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_notes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as AudioNote, ...prev].slice(0, 10))
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev =>
              prev.map(note =>
                note.id === payload.new.id ? (payload.new as AudioNote) : note
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotes])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      })

      mediaRecorder.current = recorder
      chunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunks.current, { type: mimeType })
        await uploadAudio(blob, mimeType)
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Nepodařilo se získat přístup k mikrofonu. Povol přístup v nastavení prohlížeče.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  // Upload audio to Supabase
  const uploadAudio = async (blob: Blob, mimeType: string) => {
    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique filename
      const ext = mimeType.includes('webm') ? 'webm' : 'm4a'
      const filename = `${user.id}_${Date.now()}.${ext}`
      const path = `${user.id}/${filename}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(path, blob, {
          contentType: mimeType,
        })

      if (uploadError) throw uploadError

      // Create DB record
      await createAudioNote(path)

      setRecordingTime(0)
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Nepodařilo se nahrát audio. Zkus to znovu.')
    } finally {
      setIsUploading(false)
    }
  }

  // Delete note
  const handleDelete = async (id: string) => {
    if (!confirm('Smazat tuto poznámku?')) return

    try {
      await deleteAudioNote(id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const mins = date.getMinutes().toString().padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${mins}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-trail-text">Hlasové poznámky</h1>
        <p className="text-trail-muted">Nahrávej a automaticky přepisuj hlasové zprávy</p>
      </div>

      {/* Recorder */}
      <div className="bg-trail-card rounded-2xl p-8 border border-trail-border/50">
        <div className="flex flex-col items-center gap-6">
          {/* Recording button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : isUploading
                ? 'bg-trail-border cursor-not-allowed'
                : 'bg-trail-accent hover:bg-trail-accent/80'
            }`}
          >
            {/* Pulsing ring when recording */}
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
            )}

            {isUploading ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 text-white fill-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>

          {/* Status text */}
          <div className="text-center">
            {isUploading ? (
              <p className="text-trail-muted">Nahrávám na server...</p>
            ) : isRecording ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-2xl font-mono text-trail-text">
                  {formatTime(recordingTime)}
                </span>
              </div>
            ) : (
              <p className="text-trail-muted">
                Klikni pro zahájení nahrávání
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-trail-text flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Poslední poznámky
        </h2>

        {notes.length === 0 ? (
          <div className="bg-trail-card rounded-xl p-12 text-center border border-trail-border/50">
            <FileAudio className="w-12 h-12 text-trail-muted mx-auto mb-3" />
            <p className="text-trail-muted">Zatím nemáš žádné hlasové poznámky</p>
            <p className="text-trail-muted text-sm mt-1">
              Nahraj první kliknutím na mikrofon výše
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => {
              const status = STATUS_CONFIG[note.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = status.icon

              return (
                <div
                  key={note.id}
                  className="bg-trail-card rounded-xl p-4 border border-trail-border/50 transition-all hover:border-trail-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} mb-3`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${status.animate ? 'animate-spin' : ''}`} />
                        {status.label}
                      </div>

                      {/* Transcription or placeholder */}
                      {note.status === 'done' && note.transcription ? (
                        <p className="text-trail-text leading-relaxed">
                          {note.transcription}
                        </p>
                      ) : note.status === 'error' ? (
                        <p className="text-red-400 text-sm">
                          {note.error_message || 'Nastala chyba při přepisu'}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-trail-muted text-sm">
                          {note.status === 'processing' ? (
                            <>
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span>Whisper přepisuje...</span>
                            </>
                          ) : (
                            <span>Čeká ve frontě na zpracování</span>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-trail-muted text-xs mt-3">
                        {formatDate(note.created_at)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-trail-muted hover:text-red-400 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
