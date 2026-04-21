import { serve } from '@hono/node-server'
import { HTTPException } from 'hono/http-exception'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { paymentMiddleware, x402ResourceServer } from '@x402/hono'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension
} from '@x402/extensions/bazaar'
import { z } from 'zod'
import { BASE_SEPOLIA, env } from './config.js'

const PizzaOtpRequest = z.object({
  orderId: z.string().min(1).default('PIZZA-DEMO-001'),
  pizza: z.string().min(1).default('Margherita'),
  deliveryArea: z.string().min(1).default('Downtown'),
  customerName: z.string().min(1).optional()
})

const app = new Hono()

app.use('*', logger())

const facilitatorClient = new HTTPFacilitatorClient({
  url: env.FACILITATOR_URL
})

const resourceServer = new x402ResourceServer(facilitatorClient)
resourceServer.register(BASE_SEPOLIA, new ExactEvmScheme())
resourceServer.registerExtension(bazaarResourceServerExtension)

app.use(
  paymentMiddleware(
    {
      'POST /api/pizza/otp': {
        accepts: [
          {
            scheme: 'exact',
            price: `$${env.PIZZA_PRICE_USD}`,
            network: BASE_SEPOLIA,
            payTo: env.PIZZA_PAY_TO
          }
        ],
        description:
          'Get a pizza delivery OTP plus rider details for a placed order.',
        mimeType: 'application/json',
        extensions: {
          ...declareDiscoveryExtension({
            input: {
              orderId: 'PIZZA-101',
              pizza: 'Margherita',
              deliveryArea: 'Sector 5',
              customerName: 'Soumy'
            },
            bodyType: 'json',
            inputSchema: {
              type: 'object',
              properties: {
                orderId: {
                  type: 'string',
                  description: 'Merchant order ID'
                },
                pizza: {
                  type: 'string',
                  description: 'Pizza variant ordered by the customer'
                },
                deliveryArea: {
                  type: 'string',
                  description: 'Delivery neighborhood or area'
                },
                customerName: {
                  type: 'string',
                  description: 'Customer display name'
                }
              },
              required: ['orderId', 'pizza', 'deliveryArea']
            },
            output: {
              example: {
                orderId: 'PIZZA-101',
                pizza: 'Margherita',
                deliveryArea: 'Sector 5',
                customerName: 'Soumy',
                otp: '482913',
                etaMinutes: 18,
                riderName: 'Aarav',
                riderPhoneMasked: '+91-98XXXX120',
                status: 'out_for_delivery',
                generatedAt: '2026-04-22T00:00:00.000Z'
              },
              schema: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  pizza: { type: 'string' },
                  deliveryArea: { type: 'string' },
                  customerName: { type: 'string' },
                  otp: { type: 'string' },
                  etaMinutes: { type: 'number' },
                  riderName: { type: 'string' },
                  riderPhoneMasked: { type: 'string' },
                  status: { type: 'string' },
                  generatedAt: { type: 'string' }
                },
                required: [
                  'orderId',
                  'pizza',
                  'deliveryArea',
                  'customerName',
                  'otp',
                  'etaMinutes',
                  'riderName',
                  'riderPhoneMasked',
                  'status',
                  'generatedAt'
                ]
              }
            }
          })
        }
      }
    },
    resourceServer
  )
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'pizza-api',
    network: BASE_SEPOLIA,
    priceUsd: env.PIZZA_PRICE_USD
  })
)

app.post('/api/pizza/otp', async (c) => {
  let rawBody: unknown = {}
  try {
    rawBody = await c.req.json()
  } catch {
    rawBody = {}
  }

  const parsed = PizzaOtpRequest.safeParse(rawBody)
  if (!parsed.success) {
    throw new HTTPException(422, {
      message: parsed.error.issues.map((issue) => issue.message).join('; ')
    })
  }

  const request = parsed.data
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const etaMinutes = 12 + Math.floor(Math.random() * 15)
  const riderNames = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan']
  const riderName = riderNames[Math.floor(Math.random() * riderNames.length)]

  return c.json({
    orderId: request.orderId,
    pizza: request.pizza,
    deliveryArea: request.deliveryArea,
    customerName: request.customerName ?? 'Guest',
    otp,
    etaMinutes,
    riderName,
    riderPhoneMasked: '+91-98XXXX120',
    status: 'out_for_delivery',
    generatedAt: new Date().toISOString()
  })
})

app.onError((err, c) => {
  console.error('[pizza-api error]', err)
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  return c.json({ error: 'Internal server error' }, 500)
})

serve({
  fetch: app.fetch,
  port: env.PORT
})

console.log(
  `Pizza OTP API listening on http://localhost:${env.PORT} using ${BASE_SEPOLIA}`
)
