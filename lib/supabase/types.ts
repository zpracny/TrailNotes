// Import types from Drizzle schema
import type {
  Idea,
  NewIdea,
  Deployment,
  NewDeployment,
  LinkCategory,
  NewLinkCategory,
  Link,
  NewLink,
  AppSetting,
  AllowedUser,
  Subscription,
  NewSubscription,
  AudioNote,
  NewAudioNote,
} from '@/lib/db/schema'

// Re-export types from Drizzle schema
// These types use camelCase to match Drizzle ORM output
export type {
  Idea,
  NewIdea,
  Deployment,
  NewDeployment,
  LinkCategory,
  NewLinkCategory,
  Link,
  NewLink,
  AppSetting,
  AllowedUser,
  Subscription,
  NewSubscription,
  AudioNote,
  NewAudioNote,
}

// Type aliases for backwards compatibility
export type IdeaStatus = 'todo' | 'in-progress' | 'done'
export type DeploymentStatus = 'running' | 'stopped' | 'error'
export type Platform = 'AWS Lambda' | 'n8n' | 'Raspberry Pi' | 'Docker' | 'Vercel' | 'EC2'
export type Currency = 'CZK' | 'EUR' | 'USD'
export type Frequency = 'monthly' | 'yearly'
export type PaymentType = 'automatic' | 'manual'
export type Priority = 1 | 2 | 3
export type AudioNoteStatus = 'pending' | 'processing' | 'done' | 'error'

// Insert/Update type aliases
export type IdeaInsert = NewIdea
export type IdeaUpdate = Partial<NewIdea>

export type DeploymentInsert = NewDeployment
export type DeploymentUpdate = Partial<NewDeployment>

export type SubscriptionInsert = NewSubscription
export type SubscriptionUpdate = Partial<NewSubscription>

export type AudioNoteInsert = NewAudioNote
export type AudioNoteUpdate = Partial<NewAudioNote>

// Subscription overview type (with calculated monthly_cost_czk)
export interface SubscriptionOverview extends Subscription {
  monthly_cost_czk: number
}
