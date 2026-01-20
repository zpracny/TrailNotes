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
    }
    Views: {
      [_ in never]: never
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
