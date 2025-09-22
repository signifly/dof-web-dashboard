import { SimpleLoginForm } from "@/components/auth/simple-login-form"
import { getUser } from "@/lib/auth/json-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  // Simple check - don't redirect to avoid loops
  // Let the form handle the auth logic
  return <SimpleLoginForm />
}
