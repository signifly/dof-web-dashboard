import { LoginForm } from "@/components/auth/login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            DOF Web Dashboard
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
