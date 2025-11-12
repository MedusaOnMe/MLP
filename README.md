# MayhemPad

Launch tokens on pump.fun with Mayhem Mode enabled!

## Features

- Connect Solana wallet (Phantom, Solflare, etc.)
- Create tokens with Mayhem Mode (Token-2022 standard)
- Simple metadata URI input - no complex uploads
- Clean, modern UI
- No rate limits, no caching - just pure functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get a free Pinata API key:
   - Go to [https://pinata.cloud](https://pinata.cloud)
   - Sign up for free account
   - Go to API Keys section
   - Generate new API key
   - Copy the JWT token

3. Get a free Helius RPC (required for Solana transactions):
   - Go to [https://helius.dev](https://helius.dev)
   - Sign up for free (250k requests/day)
   - Create a new API key
   - Copy your RPC URL

4. Create `.env.local` file:
```bash
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```
   Note: The Pinata JWT is kept server-side only for security

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## What is Mayhem Mode?

Mayhem Mode is a new token launch feature on pump.fun that uses:
- **Token-2022**: Next-generation SPL token standard
- **Mayhem Protocol**: Enhanced bonding curve and fee distribution
- **create_v2 instruction**: New token creation method with `is_mayhem_mode` parameter

## How to Use

1. Connect your Solana wallet
2. Fill in token details:
   - **Name**: Your token name
   - **Symbol**: Token ticker (e.g., MAYHEM)
   - **Description**: What your token is about
   - **Image**: Upload image file (automatically uploaded to IPFS)
3. Toggle Mayhem Mode ON (enabled by default)
4. Click "Launch Token"
5. Approve the transaction in your wallet
6. Your token is live!

The app automatically:
- Uploads your image to IPFS via Pinata
- Creates metadata JSON and uploads it to IPFS
- Launches the token on-chain with Mayhem Mode

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Solana Web3.js
- Anchor Framework
- Solana Wallet Adapter

## License

MIT
