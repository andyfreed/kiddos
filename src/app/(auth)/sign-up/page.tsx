import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignUpForm from '@/components/auth/SignUpForm'

export default async function SignUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/today')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-8">Sign Up for Kiddos</h1>
      <SignUpForm />
    </div>
  )
}
