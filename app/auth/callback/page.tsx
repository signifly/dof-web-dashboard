import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code: string }
}) {
  const supabase = createClient()

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(
      searchParams.code
    )

    if (!error) {
      redirect("/")
    }
  }

  // If there's an error or no code, redirect to login
  redirect("/auth/login")
}
