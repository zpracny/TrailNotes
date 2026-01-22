'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionInsert, SubscriptionUpdate, Currency, Frequency, PaymentType, Priority } from '@/lib/supabase/types'

export async function getSubscriptionsOverview() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions_overview')
    .select('*')
    .order('priority', { ascending: true })
    .order('monthly_cost_czk', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createSubscription(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const subscription: SubscriptionInsert = {
    user_id: user.id,
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: (formData.get('currency') as Currency) || 'CZK',
    frequency: formData.get('frequency') as Frequency,
    category: formData.get('category') as string || null,
    next_billing_date: formData.get('next_billing_date') as string || null,
    payment_type: formData.get('payment_type') as PaymentType,
    priority: parseInt(formData.get('priority') as string) as Priority,
    is_active: true,
  }

  const { error } = await supabase.from('subscriptions').insert(subscription)

  if (error) throw new Error(error.message)

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function updateSubscription(id: string, formData: FormData) {
  const supabase = await createClient()

  const update: SubscriptionUpdate = {
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as Currency,
    frequency: formData.get('frequency') as Frequency,
    category: formData.get('category') as string || null,
    next_billing_date: formData.get('next_billing_date') as string || null,
    payment_type: formData.get('payment_type') as PaymentType,
    priority: parseInt(formData.get('priority') as string) as Priority,
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function toggleSubscriptionActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function getSubscriptionsStats() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions_overview')
    .select('monthly_cost_czk, payment_type, is_active, priority')

  if (error) throw new Error(error.message)

  const active = data.filter(s => s.is_active)

  return {
    totalMonthly: active.reduce((sum, s) => sum + (s.monthly_cost_czk || 0), 0),
    automaticMonthly: active
      .filter(s => s.payment_type === 'automatic')
      .reduce((sum, s) => sum + (s.monthly_cost_czk || 0), 0),
    totalCount: data.length,
    activeCount: active.length,
    criticalCount: active.filter(s => s.priority === 1).length,
  }
}
