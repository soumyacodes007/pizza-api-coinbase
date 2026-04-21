import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4021),
  PIZZA_PAY_TO: z.string().min(1, 'PIZZA_PAY_TO is required'),
  PIZZA_PRICE_USD: z.string().default('0.01'),
  FACILITATOR_URL: z.string().url().default('https://x402.org/facilitator')
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables for pizza-api:')
  for (const [field, messages] of Object.entries(
    parsed.error.flatten().fieldErrors
  )) {
    console.error(`  ${field}: ${(messages ?? []).join(', ')}`)
  }
  process.exit(1)
}

export const env = parsed.data

export const BASE_SEPOLIA = 'eip155:84532' as const
