# GolfGives — Golf Charity Subscription Platform

A full-stack subscription-based golf platform combining performance tracking, charity fundraising, and a monthly draw-based reward engine.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (new project)
- A [Stripe](https://stripe.com) account
- A [Vercel](https://vercel.com) account (new project)

---

## 📦 Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo>
cd golf-charity-platform
npm install
```

### 2. Supabase Setup
1. Create a **new** Supabase project at https://supabase.com
2. Go to **SQL Editor** → paste the contents of `lib/supabase/schema.sql` → Run
3. Go to **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → Settings** → Enable Email auth

### 3. Stripe Setup
1. Create a Stripe account and get your keys from https://dashboard.stripe.com/apikeys
2. Create two subscription products:
   - **Monthly Plan**: £19.99/month → copy the Price ID → `STRIPE_MONTHLY_PRICE_ID`
   - **Annual Plan**: £199.90/year → copy the Price ID → `STRIPE_YEARLY_PRICE_ID`
3. Set up a webhook:
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables
Copy `.env.example` to `.env.local` and fill in all values:
```bash
cp .env.example .env.local
```

### 5. Create Admin User
1. Sign up normally at `/signup`
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Run Locally
```bash
npm run dev
```
Visit http://localhost:3000

---

## 🌐 Deploy to Vercel

1. Push code to a GitHub repository
2. Go to https://vercel.com → **New Project** → Import your repo
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Deploy!

### After Deployment
- Update your Stripe webhook URL to the Vercel domain
- Update Supabase auth redirect URLs in **Authentication → URL Configuration**

---

## 🏗️ Architecture

```
golf-charity-platform/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login
│   │   └── signup/page.tsx       # Multi-step signup
│   ├── dashboard/
│   │   ├── page.tsx              # User dashboard
│   │   ├── draws/page.tsx        # Published draws
│   │   ├── winnings/page.tsx     # Winnings + proof upload
│   │   └── settings/page.tsx     # Account settings
│   ├── admin/
│   │   ├── page.tsx              # Admin overview
│   │   ├── users/page.tsx        # User management
│   │   ├── draws/page.tsx        # Draw management + engine
│   │   ├── winners/page.tsx      # Winner verification
│   │   ├── charities/page.tsx    # Charity management
│   │   └── reports/page.tsx      # Analytics
│   ├── charities/page.tsx        # Public charity directory
│   ├── subscription/
│   │   ├── checkout/page.tsx     # Stripe checkout
│   │   └── success/page.tsx      # Post-payment success
│   └── api/
│       └── stripe/
│           ├── create-checkout/  # Create Stripe session
│           ├── webhook/          # Stripe webhook handler
│           └── cancel/           # Cancel subscription
├── lib/
│   ├── draw-engine.ts            # Random & algorithmic draw logic
│   ├── stripe.ts                 # Stripe utilities
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       └── schema.sql            # Full database schema
├── types/index.ts                # TypeScript definitions
└── middleware.ts                 # Auth protection
```

---

## 🎮 Features

### User Features
- ✅ Multi-step signup with charity selection
- ✅ Stripe subscription (monthly & yearly)
- ✅ 5-score rolling system (1–45 Stableford)
- ✅ Monthly prize draw participation
- ✅ Charity contribution tracking
- ✅ Winner verification portal with proof submission
- ✅ Full account management

### Admin Features
- ✅ User management (view, edit, subscription control)
- ✅ Draw creation and configuration
- ✅ Simulation mode (preview before publishing)
- ✅ Random and algorithmic draw engines
- ✅ Jackpot rollover logic
- ✅ Winner verification workflow (Pending → Verified → Paid)
- ✅ Charity management (add, edit, feature, delete)
- ✅ Platform analytics and reports

### Technical
- ✅ Next.js 14 App Router
- ✅ Supabase (auth, database, RLS)
- ✅ Stripe (subscriptions, webhooks)
- ✅ TypeScript throughout
- ✅ Mobile-responsive design
- ✅ JWT authentication via Supabase
- ✅ Row Level Security policies
- ✅ Middleware-based route protection

---

## 🧪 Test Credentials (after setup)

After running the schema and creating users:
- **Admin**: Manually set via SQL (see step 5 above)
- **Test subscriber**: Sign up normally at `/signup`

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

---

## 📋 PRD Checklist

- [x] Subscription engine (monthly + yearly via Stripe)
- [x] Score entry (Stableford 1–45, rolling 5)
- [x] Draw engine (random + algorithmic)
- [x] Prize pool distribution (40/35/25)
- [x] Jackpot rollover
- [x] Charity selection + contribution percentage
- [x] Winner verification system
- [x] User dashboard (all modules)
- [x] Admin panel (full control)
- [x] Responsive design
- [x] Secure authentication
- [x] RLS data protection
- [x] Deployable to Vercel + Supabase
