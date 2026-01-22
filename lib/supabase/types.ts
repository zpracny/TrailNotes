export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IdeaStatus = 'todo' | 'in-progress' | 'done'
export type DeploymentStatus = 'running' | 'stopped' | 'error'
export type Platform = 'AWS Lambda' | 'n8n' | 'Raspberry Pi' | 'Docker' | 'Vercel' | 'EC2'
export type Currency = 'CZK' | 'EUR' | 'USD'
export type Frequency = 'monthly' | 'yearly'
export type PaymentType = 'automatic' | 'manual'
export type Priority = 1 | 2 | 3
export type AudioNoteStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          tags: string[] | null
          links: string[] | null
          status: IdeaStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          tags?: string[] | null
          links?: string[] | null
          status?: IdeaStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          tags?: string[] | null
          links?: string[] | null
          status?: IdeaStatus
          created_at?: string
          updated_at?: string
        }
      }
      deployments: {
        Row: {
          id: string
          user_id: string
          name: string
          project: string
          platform: Platform | null
          url_ip: string | null
          status: DeploymentStatus
          last_ping: string | null
          description: string | null
          links: string[] | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          project: string
          platform?: Platform | null
          url_ip?: string | null
          status?: DeploymentStatus
          last_ping?: string | null
          description?: string | null
          links?: string[] | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          project?: string
          platform?: Platform | null
          url_ip?: string | null
          status?: DeploymentStatus
          last_ping?: string | null
          description?: string | null
          links?: string[] | null
          tags?: string[] | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          amount: number
          currency: Currency
          frequency: Frequency
          category: string | null
          next_billing_date: string | null
          payment_type: PaymentType
          priority: Priority
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          amount: number
          currency?: Currency
          frequency: Frequency
          category?: string | null
          next_billing_date?: string | null
          payment_type: PaymentType
          priority?: Priority
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          amount?: number
          currency?: Currency
          frequency?: Frequency
          category?: string | null
          next_billing_date?: string | null
          payment_type?: PaymentType
          priority?: Priority
          is_active?: boolean
        }
      }
      audio_notes: {
        Row: {
          id: string
          user_id: string
          created_at: string
          audio_path: string
          transcription: string | null
          status: AudioNoteStatus
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          audio_path: string
          transcription?: string | null
          status?: AudioNoteStatus
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          audio_path?: string
          transcription?: string | null
          status?: AudioNoteStatus
          error_message?: string | null
        }
      }
    }
    Views: {
      subscriptions_overview: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          amount: number
          currency: Currency
          frequency: Frequency
          category: string | null
          next_billing_date: string | null
          payment_type: PaymentType
          priority: Priority
          is_active: boolean
          monthly_cost_czk: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Idea = Database['public']['Tables']['ideas']['Row']
export type IdeaInsert = Database['public']['Tables']['ideas']['Insert']
export type IdeaUpdate = Database['public']['Tables']['ideas']['Update']

export type Deployment = Database['public']['Tables']['deployments']['Row']
export type DeploymentInsert = Database['public']['Tables']['deployments']['Insert']
export type DeploymentUpdate = Database['public']['Tables']['deployments']['Update']

export interface LinkCategory {
  id: string
  user_id: string
  name: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Link {
  id: string
  user_id: string
  category_id: string | null
  title: string
  url: string
  description: string | null
  tags: string[]
  created_at: string
}

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']
export type SubscriptionOverview = Database['public']['Views']['subscriptions_overview']['Row']

export type AudioNote = Database['public']['Tables']['audio_notes']['Row']
export type AudioNoteInsert = Database['public']['Tables']['audio_notes']['Insert']
export type AudioNoteUpdate = Database['public']['Tables']['audio_notes']['Update']
