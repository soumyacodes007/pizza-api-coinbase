import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4021),
  PIZZA_PAY_TO: z.string().min(1, 'PIZZA_PAY_TO is required'),
  PIZZA_PRICE_USD: z.string().default('0.01'),
  PUBLIC_BASE_URL: z.string().url().optional(),
  FACILITATOR_URL: z.string().url().default('https://x402.org/facilitator'),
  CDP_API_KEY_ID: z.string().optional(),
  CDP_API_KEY_SECRET: z.string().optional()
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
const facilitatorHost = new URL(env.FACILITATOR_URL).host

if (
  facilitatorHost === 'api.cdp.coinbase.com' &&
  (!env.CDP_API_KEY_ID || !env.CDP_API_KEY_SECRET)
) {
  console.error(
    'CDP facilitator selected, but CDP_API_KEY_ID/CDP_API_KEY_SECRET are missing.'
  )
  process.exit(1)
}

export const BASE_SEPOLIA = 'eip155:84532' as const
