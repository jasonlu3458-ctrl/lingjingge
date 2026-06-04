import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    })

    if (subscriptions.data.length === 0) {
      await supabase
        .from('profiles')
        .update({ 
          role: 'free',
          subscription_status: 'inactive'
        })
        .eq('id', user.id)
      
      return NextResponse.json({ status: 'no_active_subscription' })
    }

    const activeSubscription = subscriptions.data[0] as Stripe.Subscription
    const price = activeSubscription.items.data[0].price
    
    let role = 'free'
    if (price.recurring?.interval === 'month') {
      role = 'monthly'
    } else if (price.recurring?.interval === 'year') {
      role = 'yearly'
    }

    await supabase
      .from('profiles')
      .update({ 
        role,
        stripe_subscription_id: activeSubscription.id,
        subscription_status: 'active',
        subscription_start: new Date(activeSubscription.created * 1000).toISOString(),
        subscription_end: new Date((activeSubscription as any).current_period_end * 1000).toISOString()
      })
      .eq('id', user.id)

    return NextResponse.json({
      role,
      subscriptionId: activeSubscription.id,
      status: activeSubscription.status,
      startDate: activeSubscription.created * 1000,
      endDate: (activeSubscription as any).current_period_end * 1000
    })
  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 })
  }
}