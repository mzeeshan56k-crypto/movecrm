# Putting MoveCRM online — 100% free (no coding)

This puts your SaaS on the internet using **Vercel** (free hosting) and **Supabase**
(free permanent database — the same service your SpyWatch site already uses, so you
already have an account). No credit card needed. About 15 minutes.

---

## What you'll end up with

A web address like `https://movecrm.vercel.app` where:
- Any moving company can **create its own account** with a private workspace
- Each company gets a **public quote form link** — submissions become leads automatically
- Each company can connect a **phone number** — calls are recorded and become leads
- Data lives in Supabase **permanently** (free tier never deletes your database)

---

## Step 1 — Create the database on Supabase (5 min)

1. Go to **https://supabase.com** and log in (you already have an account from SpyWatch)
2. Click **New project**
   - Name: `movecrm`
   - Database password: click **Generate a password** → **copy it somewhere safe**
   - Click **Create new project** and wait ~2 minutes
3. When it's ready, click the **Connect** button (top of the page)
4. In the panel that opens, find **Transaction pooler** → copy that connection string.
   It looks like:
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
5. **Replace `[YOUR-PASSWORD]` in that string with the password from step 2.**
   Keep the final string handy — you'll paste it in Step 2.

---

## Step 2 — Deploy the app on Vercel (5 min)

1. Go to **https://vercel.com** → **Sign Up** → choose **Continue with GitHub** → Authorize
2. Click **Add New…** → **Project**
3. Find your **`movecrm`** repository → click **Import**
   - Don't see it? Click "Adjust GitHub App Permissions" and allow access to `movecrm`.
4. On the configure screen:
   - **Root Directory**: leave it as the repository root (`./`) — the app is at the top level of this repo.
   - Open **Environment Variables** and add these:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the connection string from Step 1 |
   | `JWT_SECRET` | type any long random sentence, e.g. `purple-elephants-dance-at-midnight-42` |
   | `OWNER_EMAIL` | **your** email — this account gets unlimited access, free forever |

5. Click **Deploy** and wait 2–3 minutes.

---

## Step 3 — Open it and create your account 🎉

1. Click **Visit** (or open your `https://….vercel.app` address)
2. Click **Create your company account** and fill it in
3. You're in. **Bookmark the address** — that's your live product.

### Test the SaaS part
Open an incognito window → sign up a second company → its data is completely separate.

### Test automatic lead capture
1. In the CRM: **Settings → Lead Capture & Phone** → copy **your quote form link**
2. Open it in an incognito window — that's what your customers see
3. Fill it in and submit → go back to the CRM → **Sales Pipeline** → the lead is there,
   created automatically with source "Website Form"

### Test phone capture & recording (optional, uses free Twilio trial)
Follow the 3 steps shown in **Settings → Lead Capture & Phone**. After connecting,
call your Twilio number: the CRM answers, records the voicemail, and a new lead +
recording appear in **Calls** — automatically.

---

## Make the public site reachable (fixes "refused to connect")

If your quote form shows **"refused to connect"** when embedded on a website, it's because
the link pointed at a **protected preview deployment**. Two things ensure it always works:

1. **Always copy embed/form links from Settings → Lead Capture & Phone on your real site
   address** (your production `…vercel.app` URL or your custom domain) — never a link
   containing a random hash like `spy-cq5xtn4wk-…vercel.app`.
2. In **Vercel → your project → Settings → Deployment Protection**, make sure protection
   is **off for Production** (set to "Only Preview Deployments" or "Disabled"). Production
   must be public so customers and embedded forms can reach it.

Optionally set `PUBLIC_BASE_URL` (env var) to your custom domain — then every embed link
the app generates uses that stable address automatically.

## Plans & turning on paid subscriptions

Pricing: **Starter $100/mo** (1 website), **Growth $200/mo** (5 websites),
**Pro $400/mo** (15 websites), **Enterprise** (contact sales). New companies get a
**14-day free trial**; the **platform owner (OWNER_EMAIL) is free, unlimited, forever**.

To start charging, connect Stripe later:

1. Create a free **Stripe** account; add three recurring products: $100, $200, $400/mo
2. In Vercel → **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | your Stripe secret key (`sk_live_…`) |
   | `STRIPE_PRICE_STARTER` | the $100 price ID (`price_…`) |
   | `STRIPE_PRICE_GROWTH` | the $200 price ID (`price_…`) |
   | `STRIPE_PRICE_PRO` | the $400 price ID (`price_…`) |
   | `STRIPE_WEBHOOK_SECRET` | from a Stripe webhook pointing at `/api/public/stripe-webhook` |
   | `SUPPORT_EMAIL` | where Enterprise "Contact sales" emails go (optional) |

3. Redeploy. The **Plans & Billing** buttons now take customers to Stripe checkout, and
   plans update automatically when they pay or cancel.

Tell me when you're ready and I'll walk you through the Stripe setup.

## Costs — honest summary

| Piece | Cost |
|---|---|
| Vercel hosting | Free (Hobby plan) |
| Supabase database | Free forever up to 500 MB (thousands of jobs) — pauses after 1 week of zero traffic, wakes on next visit |
| Twilio phone number | Free trial credit to test; ~$1.15/month + ~1¢/min when you go live |

When the product makes money: Vercel Pro ($20/mo) and Supabase Pro ($25/mo) remove all
limits — but you don't need them to launch and test.

---

## Updating the app later

Push new code to the branch → Vercel redeploys automatically. Nothing to click.

## If something goes wrong

Screenshot what you see and send it to me. Most common issues:
- **Wrong DATABASE_URL** → signup says "Could not create account"; re-copy the
  Transaction-pooler string and make sure your real password replaced `[YOUR-PASSWORD]`.
