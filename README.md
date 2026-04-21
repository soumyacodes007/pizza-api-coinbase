# Pizza OTP API

A minimal x402 seller API that charges on Base Sepolia and returns a fake pizza delivery OTP.

This app follows the official x402 seller quickstart pattern:

- Quickstart for Sellers: https://docs.x402.org/getting-started/quickstart-for-sellers
- HTTP 402 flow: https://docs.x402.org/core-concepts/http-402
- Facilitator role: https://docs.cdp.coinbase.com/x402/core-concepts/facilitator

## What it does

- `GET /health` returns a simple health check.
- `POST /api/pizza/otp` is protected by x402.
- After payment, it returns:
  - a fake 6-digit OTP
  - an ETA
  - a rider name
  - echoed order details

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in `PIZZA_PAY_TO`.

3. Run locally:

```bash
npm run dev
```

4. Test the unpaid route:

```bash
curl -X POST http://localhost:4021/api/pizza/otp \
  -H "content-type: application/json" \
  -d '{"orderId":"PIZZA-101","pizza":"Margherita","deliveryArea":"Sector 5"}'
```

It should return `402 Payment Required`.

## Deploy

This app is a normal Node server, so it fits Railway / Render / Fly / a VM directly.

Set these env vars on your host:

- `PORT`
- `PIZZA_PAY_TO`
- `PIZZA_PRICE_USD`
- `FACILITATOR_URL`
- `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` if using the CDP facilitator

For Base Sepolia testing, keep:

- `FACILITATOR_URL=https://x402.org/facilitator`

If you want this route to appear in the **CDP Bazaar**, switch to the CDP facilitator:

- `FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402`
- `CDP_API_KEY_ID=...`
- `CDP_API_KEY_SECRET=...`

Then make sure at least one successful payment is settled through that same facilitator. CDP discovery only indexes resources it sees through the CDP facilitator; payments settled through `x402.org/facilitator` do not automatically appear in CDP search.

When `FACILITATOR_URL` points at CDP, this app generates short-lived Bearer JWTs for the facilitator `supported`, `verify`, and `settle` calls using `@coinbase/cdp-sdk/auth`.

## Notes

- This is a demo seller, so the OTP is generated in memory per request.
- It uses Bazaar metadata so it can be indexed by compatible discovery layers.
