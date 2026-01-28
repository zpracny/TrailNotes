'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { deployments } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/server'

export type DeploymentStatus = 'running' | 'stopped' | 'error'
export type Platform = 'AWS Lambda' | 'n8n' | 'Raspberry Pi' | 'Docker' | 'Vercel' | 'EC2'

export async function getDeployments() {
  const user = await requireUser()

  const data = await db
    .select()
    .from(deployments)
    .where(eq(deployments.userId, user.id))
    .orderBy(desc(deployments.createdAt))

  return data
}

export async function getDeployment(id: string) {
  const [data] = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, id))
    .limit(1)

  if (!data) throw new Error('Deployment not found')
  return data
}

export async function createDeployment(formData: FormData) {
  const user = await requireUser()

  await db.insert(deployments).values({
    userId: user.id,
    name: formData.get('name') as string,
    project: formData.get('project') as string,
    platform: formData.get('platform') as Platform | null,
    urlIp: formData.get('url_ip') as string | null,
    description: formData.get('description') as string | null,
    status: 'running',
  })

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeployment(id: string, formData: FormData) {
  await db
    .update(deployments)
    .set({
      name: formData.get('name') as string,
      project: formData.get('project') as string,
      platform: formData.get('platform') as Platform | null,
      urlIp: formData.get('url_ip') as string | null,
      description: formData.get('description') as string | null,
      status: formData.get('status') as DeploymentStatus,
    })
    .where(eq(deployments.id, id))

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
  revalidatePath(`/deployments/${id}`)
}

export async function updateDeploymentStatus(id: string, status: DeploymentStatus) {
  await db
    .update(deployments)
    .set({ status })
    .where(eq(deployments.id, id))

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function deleteDeployment(id: string) {
  await db.delete(deployments).where(eq(deployments.id, id))

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeploymentTags(id: string, tags: string[]) {
  await db
    .update(deployments)
    .set({ tags })
    .where(eq(deployments.id, id))

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function updateDeploymentLinks(id: string, links: string[]) {
  await db
    .update(deployments)
    .set({ links })
    .where(eq(deployments.id, id))

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function pingDeployment(id: string) {
  await db
    .update(deployments)
    .set({ lastPing: new Date() })
    .where(eq(deployments.id, id))

  revalidatePath('/deployments')
}

export async function pingAllDeployments() {
  const user = await requireUser()

  await db
    .update(deployments)
    .set({ lastPing: new Date() })
    .where(
      and(
        eq(deployments.userId, user.id),
        eq(deployments.status, 'running')
      )
    )

  revalidatePath('/deployments')
  revalidatePath('/dashboard')
}

export async function getDeploymentsStats() {
  const user = await requireUser()

  const data = await db
    .select({ status: deployments.status })
    .from(deployments)
    .where(eq(deployments.userId, user.id))

  return {
    total: data.length,
    running: data.filter(d => d.status === 'running').length,
    stopped: data.filter(d => d.status === 'stopped').length,
    error: data.filter(d => d.status === 'error').length,
  }
}
