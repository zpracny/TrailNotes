import { redirect } from 'next/navigation'

// Login page now redirects to Neon Auth sign-in
export default function LoginPage() {
  redirect('/auth/sign-in')
}
