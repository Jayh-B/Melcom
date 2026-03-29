# Melcom Ghana E-Business Platform

A production-grade omnichannel retail platform for Melcom Ghana, built with React 19, Firebase, Paystack and Gemini AI.

## Features

- **Storefront** — Product catalogue, search with autocomplete, product detail pages, wishlist (persisted), cart, 3-step checkout
- **AI Recommendations** — Gemini-powered personalised homepage picks based on interaction history
- **Payments** — Paystack inline popup (MoMo, card) with server-side verification and webhook handling
- **Finance / Tax** — GRA-compliant tax calculation (VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID Levy 1%) + printable HTML VAT invoice with TIN/VAT reg
- **CRM** — Customer profiles synced at sign-in, loyalty points accrued per order
- **Order History** — Real-time order tracking with status stepper per customer
- **Admin Dashboard** — KPI cards, revenue chart, transaction table, inventory management with image upload, supplier CRUD, role management
- **Compliance** — Ghana Data Protection Act 2012 (Act 843) cookie banner, full privacy policy page, WCAG AA accessibility (skip link, ARIA labels, focus-visible)
- **Observability** — Sentry error monitoring (CDN), Firebase App Check (reCAPTCHA v3)
- **Email** — SendGrid order confirmation (console fallback in dev)

## Run Locally

**Prerequisites:** Node.js ≥ 20, npm

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your keys (see below)

# 3. Start the dev server
npm run dev
# → http://localhost:3000
# → Admin panel: http://localhost:3000/admin
```

## Environment Variables

Create `.env.local` in the project root (never commit this file):

| Variable | Where to get it |
|---|---|
| `VITE_PAYSTACK_PUBLIC_KEY` | [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys |
| `PAYSTACK_SECRET_KEY` | Same — server-side only |
| `VITE_RECAPTCHA_SITE_KEY` | [Firebase Console](https://console.firebase.google.com) → App Check → reCAPTCHA v3 |
| `VITE_SENTRY_DSN` | [Sentry.io](https://sentry.io) → Project → Settings → Client Keys |
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `SENDGRID_API_KEY` | [SendGrid](https://sendgrid.com) → Settings → API Keys |
| `FROM_EMAIL` | Your verified SendGrid sender address |

## Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Build for Production

```bash
npm run build
NODE_ENV=production node dist/server.js
```

## Project Structure

```
├── src/
│   ├── App.tsx               # Storefront — all customer-facing routes
│   ├── AdminApp.tsx          # Admin panel — dashboard, inventory, suppliers, roles
│   ├── main.tsx              # Entry point — Sentry init, error boundary, routing
│   ├── firebase.ts           # Firebase SDK init — App Check, Firestore, Auth
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── index.css             # Tailwind v4 + animations
│   ├── components/
│   │   ├── CookieBanner.tsx  # Ghana DPA 2012 compliant cookie consent
│   │   ├── InvoiceButton.tsx # Triggers server-side VAT invoice generation
│   │   ├── SearchAutocomplete.tsx
│   │   ├── Skeleton.tsx      # Loading skeleton components
│   │   └── Toast.tsx         # Toast notification UI
│   ├── context/
│   │   └── ToastContext.tsx  # Global toast state
│   ├── lib/
│   │   ├── utils.ts          # cn(), formatGHS(), debounce()
│   │   └── storage.ts        # Firebase Storage image upload helpers
│   └── pages/
│       ├── ProductDetail.tsx # Full product page with gallery, variants, related
│       ├── OrderHistory.tsx  # Customer order history with real-time tracking
│       └── PrivacyPolicy.tsx # Ghana DPA compliant privacy policy
├── server.ts                 # Express server — tax API, Paystack, invoice, email
├── firebase-applet-config.json
├── firebase-blueprint.json   # Firestore schema reference
├── firestore.rules           # Security rules — products, orders, customers, etc.
├── index.html                # Full SEO meta, OG tags, Sentry + Paystack CDN
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Tax Rates (Ghana Revenue Authority)

| Tax | Rate |
|---|---|
| Value Added Tax (VAT) | 15% |
| National Health Insurance Levy (NHIL) | 2.5% |
| Ghana Education Trust Fund (GETFund) | 2.5% |
| COVID-19 Health Recovery Levy | 1% |
| **Total** | **21%** |

All invoices include: TIN `C0003849284`, VAT Registration `V0013288X`.
