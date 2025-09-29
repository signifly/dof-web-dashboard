import { z } from 'zod'

interface AuthUser {
  email: string
  password: string
}

const envSchema = z.object({
  // Supabase Configuration (for data only, not auth)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anonymous key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Environment-Based Authentication
  ALLOWED_USERS: z
    .string()
    .min(1, 'At least one allowed user must be specified')
    .transform((val): AuthUser[] => {
      // Split by comma, then parse each email:password pair
      const userPairs = val.split(',').map(pair => pair.trim())

      const users: AuthUser[] = []
      const emailSchema = z.string().email()

      userPairs.forEach((pair, index) => {
        const [email, password] = pair.split(':')

        if (!email || !password) {
          throw new Error(`Invalid user format at position ${index + 1}. Expected "email:password", got "${pair}"`)
        }

        const trimmedEmail = email.trim().toLowerCase()
        const trimmedPassword = password.trim()

        // Validate email format
        try {
          emailSchema.parse(trimmedEmail)
        } catch {
          throw new Error(`Invalid email format at position ${index + 1}: ${trimmedEmail}`)
        }

        // Validate password is not empty
        if (trimmedPassword.length === 0) {
          throw new Error(`Empty password for user at position ${index + 1}: ${trimmedEmail}`)
        }

        users.push({
          email: trimmedEmail,
          password: trimmedPassword
        })
      })

      // Check for duplicate emails
      const emails = users.map(u => u.email)
      const uniqueEmails = new Set(emails)
      if (emails.length !== uniqueEmails.size) {
        throw new Error('Duplicate email addresses found in ALLOWED_USERS')
      }

      return users
    }),

  // Session Configuration
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters long for security')
})

// Validate environment variables at module load time
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Environment variable validation failed:')
  console.error(parsed.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

export type Env = typeof env
export type { AuthUser }