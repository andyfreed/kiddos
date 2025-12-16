import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignInForm from '@/components/auth/SignInForm'

export default async function SignInPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/today')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-8">Sign In to Kiddos</h1>
      <SignInForm />
    </div>
  )
}
