'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DeploymentInsert, DeploymentUpdate, DeploymentStatus, Platform } from '@/lib/supabase/types'

export async function getDeployments() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getDeployment(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createDeployment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const deployment: DeploymentInsert = {
    user_id: user.id,
    name: formData.get('name') as string,
    project: formData.get('project') as string,
    platform: formData.get('platform') as Platform | null,
    url_ip: formData.get('url_ip') as string | null,
    description: formData.get('description') as string | null,
    status: 'running',
  }

  const { error } = await supabase.from('deployments').insert(deployment)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeployment(id: string, formData: FormData) {
  const supabase = await createClient()

  const update: DeploymentUpdate = {
    name: formData.get('name') as string,
    project: formData.get('project') as string,
    platform: formData.get('platform') as Platform | null,
    url_ip: formData.get('url_ip') as string | null,
    description: formData.get('description') as string | null,
    status: formData.get('status') as DeploymentStatus,
  }

  const { error } = await supabase
    .from('deployments')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
  revalidatePath(`/deployments/${id}`)
}

export async function updateDeploymentStatus(id: string, status: DeploymentStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deployments')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function deleteDeployment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deployments')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeploymentTags(id: string, tags: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deployments')
    .update({ tags })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeploymentLinks(id: string, links: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deployments')
    .update({ links })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function pingDeployment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deployments')
    .update({ last_ping: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
}

export async function pingAllDeployments() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('deployments')
    .update({ last_ping: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'running')

  if (error) throw new Error(error.message)

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function getDeploymentsStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deployments')
    .select('status')

  if (error) throw new Error(error.message)

  return {
    total: data.length,
    running: data.filter(d => d.status === 'running').length,
    stopped: data.filter(d => d.status === 'stopped').length,
    error: data.filter(d => d.status === 'error').length,
  }
}
