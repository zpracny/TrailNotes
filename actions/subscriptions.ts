'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/server'

export type Currency = 'CZK' | 'EUR' | 'USD'
export type Frequency = 'monthly' | 'yearly'
export type PaymentType = 'automatic' | 'manual'
export type Priority = 1 | 2 | 3

// Helper to calculate monthly cost in CZK
function calculateMonthlyCostCzk(amount: number, currency: string, frequency: string): number {
  const currencyMultiplier = currency === 'USD' ? 24 : currency === 'EUR' ? 25 : 1
  const frequencyDivisor = frequency === 'yearly' ? 12 : 1
  return Math.round((amount * currencyMultiplier) / frequencyDivisor)
}

export async function getSubscriptionsOverview() {
  const user = await requireUser()

  const data = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .orderBy(asc(subscriptions.priority), desc(subscriptions.amount))

  // Add monthly_cost_czk calculation
  return data.map(s => ({
    ...s,
    monthly_cost_czk: calculateMonthlyCostCzk(
      Number(s.amount),
      s.currency || 'CZK',
      s.frequency
    ),
  }))
}

export async function createSubscription(formData: FormData) {
  const user = await requireUser()

  await db.insert(subscriptions).values({
    userId: user.id,
    name: formData.get('name') as string,
    amount: formData.get('amount') as string,
    currency: (formData.get('currency') as Currency) || 'CZK',
    frequency: formData.get('frequency') as Frequency,
    category: formData.get('category') as string || null,
    nextBillingDate: formData.get('next_billing_date') as string || null,
    paymentType: formData.get('payment_type') as PaymentType,
    priority: parseInt(formData.get('priority') as string) as Priority,
    isActive: true,
  })

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function updateSubscription(id: string, formData: FormData) {
  await db
    .update(subscriptions)
    .set({
      name: formData.get('name') as string,
      amount: formData.get('amount') as string,
      currency: formData.get('currency') as Currency,
      frequency: formData.get('frequency') as Frequency,
      category: formData.get('category') as string || null,
      nextBillingDate: formData.get('next_billing_date') as string || null,
      paymentType: formData.get('payment_type') as PaymentType,
      priority: parseInt(formData.get('priority') as string) as Priority,
    })
    .where(eq(subscriptions.id, id))

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function toggleSubscriptionActive(id: string, isActive: boolean) {
  await db
    .update(subscriptions)
    .set({ isActive })
    .where(eq(subscriptions.id, id))

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function deleteSubscription(id: string) {
  await db.delete(subscriptions).where(eq(subscriptions.id, id))

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function getSubscriptionsStats() {
  const user = await requireUser()

  const data = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))

  const withCosts = data.map(s => ({
    ...s,
    monthly_cost_czk: calculateMonthlyCostCzk(
      Number(s.amount),
      s.currency || 'CZK',
      s.frequency
    ),
  }))

  const active = withCosts.filter(s => s.isActive)

  return {
    totalMonthly: active.reduce((sum, s) => sum + s.monthly_cost_czk, 0),
    automaticMonthly: active
      .filter(s => s.paymentType === 'automatic')
      .reduce((sum, s) => sum + s.monthly_cost_czk, 0),
    totalCount: data.length,
    activeCount: active.length,
    criticalCount: active.filter(s => s.priority === 1).length,
  }
}
