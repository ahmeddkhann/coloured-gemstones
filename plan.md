# Coloured Gemstones — Implementation Plan

This file is the source of truth while building the store. Follow it in order. Do not re-open locked decisions unless a later requirement forces it.

---

## 1. Product in one sentence

A public gemstone catalog where anyone can browse, add stones to a cart, and place an order. A single admin uploads stones and manages order status. Customers can also chat on WhatsApp. Product pages suggest similar stones via DeepSeek.

---

## 2. Current starting point

Fresh Next.js App Router project. Do not treat this like older Next.js.

| Item | Value |
| --- | --- |
| Next.js | 16.4.3 |
| React | 19.3.0 |
| Styling | Tailwind CSS 4 (`@import "tailwindcss"`) |
| Language | TypeScript, `@/*` path alias |
| Router | App Router only (`app/`). No `pages/` router. No `src/` folder. |
| Cache | `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` |
| Bundler | Turbopack by default |
| Auth / DB / mail | Not installed yet |

### Next.js 16 rules that apply to every feature

- Use `proxy.ts` at the project root. Do **not** create `middleware.ts`.
- `params`, `searchParams`, `cookies()`, and `headers()` are async. Always `await` them.
- Mutations go through Server Actions (`"use server"`). Verify admin session **inside** every admin action. Proxy redirects are optimistic only.
- Use Route Handlers (`app/api/.../route.ts`) for file upload and the DeepSeek recommendation endpoint.
- Mongo reads are request-time data. Wrap those UI trees in `<Suspense>` so Cache Components can stream them. Cache public catalog reads with `"use cache"` + `cacheLife` where freshness allows it.
- After admin create/update/delete, revalidate with `updateTag` / `revalidatePath`.
- Read Next.js docs from `node_modules/next/dist/docs/` before adding unfamiliar APIs.
- Heed deprecation notices. Do not copy Next 13/14/15 patterns from memory.

---

## 3. Locked product decisions

These are settled so implementation does not stall on product questions.

| Topic | Decision |
| --- | --- |
| Customer accounts | **None in v1.** Anyone can browse and order. |
| Admin accounts | **One admin.** Credentials live in env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Session is an HTTP-only signed cookie. |
| Cart | **Client-side.** `localStorage` + React context. No carts collection. |
| Checkout | Guest form: name, email, phone, address, optional notes. |
| Payment | **Cash on delivery / bank transfer request only.** No Stripe/PayPal in v1. |
| Currency | Configurable via `NEXT_PUBLIC_CURRENCY` and `NEXT_PUBLIC_CURRENCY_SYMBOL`. Default **PKR** / `Rs`. |
| Images | **Cloudinary.** Admin uploads go through a server Route Handler to Cloudinary. Mongo stores only `{ url, publicId }` per image. First image is the cover. Delivery uses Cloudinary `f_auto,q_auto` so browsers get WebP/AVIF automatically. Do **not** store image binaries in MongoDB. |
| Slugs | Generated from the gemstone name. Unique. Used in `/gemstones/[slug]`. |
| Stock | Each stone has `stock` (number). Cannot add more than available stock. `inStock` is derived (`stock > 0`). |
| Order numbers | Human-readable, e.g. `CG-20261024-0001`. |
| WhatsApp | Floating button on public pages. Opens `https://wa.me/<number>?text=...`. Number from `NEXT_PUBLIC_WHATSAPP_NUMBER`. |
| Recommendations | DeepSeek Chat API. Used on the gemstone detail page. Fallback: same type / similar price from Mongo. |
| Emails | Nodemailer. Customer order confirmation + admin new-order alert + customer status-change notice. |
| Language / locale | English UI. British spelling in copy (“coloured”). |

Out of scope for v1: customer login, reviews, wishlist, coupons, live card payments, multi-admin roles, blog, i18n.

**Rejected image options:** local `public/uploads` (lost on serverless deploys, no CDN) and storing WebP/GridFS binaries in Mongo (backs up slowly, every page view hits the database, no transforms). WebP is a delivery format, not a storage strategy — Cloudinary already serves WebP/AVIF to browsers that support it.

---

## 4. Visual direction

Luxury jewelry store, not a generic dashboard.

- Background: warm cream / off-white (`#F7F1E8`)
- Ink: near-black charcoal (`#1A1612`)
- Accent: antique gold (`#B8860B`) and deep jewel green (`#0F3D2E`)
- Headings: elegant serif (e.g. Playfair Display or similar via `next/font`)
- Body: existing Geist or a clean sans
- Cards: large stone photos, quiet metadata, gold hairline borders
- Admin: same palette, denser tables, no consumer hero imagery
- Mobile first. Desktop catalog is a 3–4 column grid.

Do not keep the create-next-app starter look.

---

## 5. Architecture

```
Browser
  public UI  → Server Components read Mongo
  cart       → localStorage (client only)
  checkout   → Server Action → orders collection → Nodemailer
  WhatsApp   → wa.me (no backend)
  recommend  → Route Handler → DeepSeek → fallback Mongo query

Admin browser
  login      → Server Action → signed HTTP-only cookie
  /admin/*   → proxy.ts redirects if cookie missing
  CRUD       → Server Actions (session checked again)
  images     → POST /api/upload → Cloudinary → { url, publicId } saved on gemstone
```

### Packages to add when the matching phase starts

- `mongoose` — MongoDB models and connection
- `cloudinary` — official Node SDK for signed server-side uploads and deletes
- `nodemailer` + `@types/nodemailer` — transactional email
- `jose` — signed admin session JWT in a cookie
- `zod` — form and API validation
- `slugify` — gemstone slugs

Do not add NextAuth, Redux, a UI kit, or an extra CSS framework.

---

## 6. Environment variables

Create `.env.local` (never commit it). Add `.env.example` with empty values.

```bash
# App
NEXT_PUBLIC_APP_NAME=Coloured Gemstones
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY=PKR
NEXT_PUBLIC_CURRENCY_SYMBOL=Rs
NEXT_PUBLIC_WHATSAPP_NUMBER=92XXXXXXXXXX

# Mongo
MONGODB_URI=mongodb://127.0.0.1:27017/coloured-gemstones

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=long-random-string-at-least-32-chars

# Nodemailer (Gmail app password or any SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Coloured Gemstones <no-reply@example.com>"
ADMIN_NOTIFY_EMAIL=admin@example.com

# DeepSeek
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=coloured-gemstones
```

`NEXT_PUBLIC_*` is the only prefix that may reach the browser. Secrets stay server-only.

---

## 7. MongoDB models

One shared connection helper in `lib/mongodb.ts` (cached on `globalThis` so hot reload does not open new pools).

### `Gemstone`

```ts
{
  name: string
  slug: string            // unique
  description: string
  type: string            // sapphire, ruby, emerald, tourmaline, ...
  color: string
  cut: string
  clarity: string
  origin: string
  carat: number
  price: number           // major currency units, e.g. 45000
  stock: number
  images: [{              // Cloudinary assets, first is cover
    url: string           // https://res.cloudinary.com/.../image/upload/...
    publicId: string      // needed to delete or replace
  }]
  featured: boolean
  createdAt, updatedAt
}
```

Indexes: unique `slug`. Text index on `name`, `type`, `color`, `origin` for later search.

### `Order`

```ts
{
  orderNumber: string     // unique, CG-YYYYMMDD-####
  customer: {
    name: string
    email: string
    phone: string
    address: string
    notes?: string
  }
  items: [{
    gemstoneId: ObjectId
    name: string          // snapshot
    slug: string
    price: number         // snapshot
    quantity: number
    image: string
  }]
  subtotal: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: "cod"
  statusHistory: [{ status, note?, at }]
  createdAt, updatedAt
}
```

When an order is created: decrement `stock` for each item. If a later cancellation happens and stock should return, add it back only from `cancelled` (and only once — track with a `stockRestored` flag).

### No other collections in v1

Admin is env-based. Cart is local. Recommendations are computed, not stored (optional later cache collection if DeepSeek cost becomes an issue).

---

## 8. Route map

### Public

| Path | Purpose |
| --- | --- |
| `/` | Hero, featured stones, full catalog grid, trust/contact strip |
| `/gemstones/[slug]` | Detail: gallery, specs, price, add to cart, recommendations, WhatsApp ask |
| `/cart` | Line items, qty, remove, subtotal, checkout CTA |
| `/checkout` | Guest details form, order summary, place order |
| `/order/success?order=CG-...` | Thank-you + order number. No auth wall. |

### Admin

| Path | Purpose |
| --- | --- |
| `/admin/login` | Email + password. Redirect if already signed in. |
| `/admin` | Counts: stones, pending orders, low stock |
| `/admin/gemstones` | Table + search |
| `/admin/gemstones/new` | Create form + multi-image upload |
| `/admin/gemstones/[id]/edit` | Update / delete |
| `/admin/orders` | Filter by status |
| `/admin/orders/[id]` | Detail + status dropdown + history |

### API

| Path | Purpose |
| --- | --- |
| `POST /api/upload` | Admin-only. Streams the file to Cloudinary. Returns `{ url, publicId }`. |
| `POST /api/recommendations` | Body: `{ slug }`. Returns recommended gemstone IDs + reason. |

404 via `app/not-found.tsx`. Admin and store get their own `loading.tsx` skeletons.

---

## 9. Target file structure

```
app/
  layout.tsx                 # fonts, metadata, public chrome
  globals.css                # Tailwind 4 tokens
  page.tsx                   # home catalog
  not-found.tsx
  gemstones/[slug]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  order/success/page.tsx
  admin/layout.tsx           # admin chrome, no public header
  admin/login/page.tsx
  admin/page.tsx
  admin/gemstones/page.tsx
  admin/gemstones/new/page.tsx
  admin/gemstones/[id]/edit/page.tsx
  admin/orders/page.tsx
  admin/orders/[id]/page.tsx
  api/upload/route.ts
  api/recommendations/route.ts
  actions/
    auth.ts
    gemstones.ts
    orders.ts
  _components/               # public UI
  admin/_components/         # admin UI

lib/
  mongodb.ts
  models/Gemstone.ts
  models/Order.ts
  auth.ts                    # sign, verify, getAdminSession
  mail.ts                    # nodemailer transport + templates
  recommendations.ts         # DeepSeek prompt + parse + fallback
  cloudinary.ts              # SDK config, upload, destroy, delivery URL helper
  currency.ts
  validations.ts             # zod schemas
  constants.ts               # types, statuses, gemstone types

proxy.ts                     # guard /admin/* except /admin/login
```

Keep server-only modules (`mongodb`, `auth` secrets, `mail`, DeepSeek key) out of client components. Import them only from Server Components, Server Actions, and Route Handlers.

---

## 10. Feature specs

### 10.1 Public catalog

- Home loads featured stones first, then the rest.
- Card: cover image, name, type, carat, formatted price, “View” link.
- Sold-out stones stay visible but cannot be added to cart.
- Detail page shows all images, full specs, description, quantity selector, Add to cart.
- Empty catalog state: “New stones are being sourced” — never a crash.

Cache: `getGemstones()` and `getGemstoneBySlug()` use `"use cache"` + `cacheLife("hours")` + `cacheTag("gemstones")`. Admin mutations call `updateTag("gemstones")`.

### 10.2 Cart

Client provider `CartProvider` in the public layout.

Item shape: `{ gemstoneId, slug, name, price, image, stock, quantity }`.

Rules:

- Add increments quantity up to `stock`.
- Persist to `localStorage` key `cg-cart`.
- Header shows a bag count.
- Cart page can change qty or remove lines.
- Checkout button disabled when cart is empty.

### 10.3 Checkout and orders

Server Action `placeOrder(formData)`:

1. Validate customer fields with zod.
2. Re-read each gemstone from Mongo (never trust client prices).
3. Recalculate subtotal. Reject if any item is missing or over stock.
4. Create `Order` with status `pending`. Decrement stock.
5. Send customer confirmation + admin notification.
6. `updateTag("gemstones")` and `updateTag("orders")`.
7. Redirect to `/order/success?order=CG-...`.

Client then clears the cart on the success page.

If mail fails, still keep the order. Log the mail error. Do not roll back the order.

### 10.4 Admin auth

- `login` action compares env email/password (constant-time email check + hashed or direct compare of env password is acceptable for the single-admin v1; prefer hashing the env password at rest in a comment that we compare with a simple equality only because the secret is not in the database — still use `jose` for the session).
- Session cookie: `cg_admin`, HTTP-only, `secure` in production, `sameSite=lax`, 7-day expiry, signed JWT `{ role: "admin" }`.
- `getAdminSession()` used by every admin action and admin layout.
- `proxy.ts` matcher: `/admin/:path*`. If path is not `/admin/login` and cookie is missing/invalid, redirect to `/admin/login`.
- Logout action deletes the cookie.

### 10.5 Admin gemstones

Form fields match the `Gemstone` model. Image upload (Cloudinary, never local disk, never Mongo binaries):

1. Client sends `FormData` files to `POST /api/upload`.
2. Handler checks admin session, accepts `image/jpeg|png|webp`, max ~8 MB each.
3. Server SDK uploads to Cloudinary folder `CLOUDINARY_FOLDER` with `resource_type: "image"`.
4. Returns `{ url, publicId }`. Form keeps an ordered list. User can remove or reorder.
5. Removing an image from the form (or deleting the gemstone) calls `cloudinary.uploader.destroy(publicId)` so unused assets do not linger.
6. Catalog and detail pages render with `next/image` using the stored `url`. Allow `res.cloudinary.com` in `next.config.ts` `images.remotePatterns`.
7. For thumbnails vs detail, prefer a helper in `lib/cloudinary.ts` that injects `f_auto,q_auto,w_600` (card) or `w_1200` (detail) into the delivery URL. That is how we get WebP — at request time from Cloudinary, not by storing a WebP blob.

Delete gemstone: allowed even if past orders exist, because orders store snapshots. Still destroy Cloudinary assets for that stone.

### 10.6 Admin orders

- List newest first. Filter chips for each status.
- Detail shows customer, items, subtotal, timeline.
- Status select calls `updateOrderStatus(id, status)`.
- Allowed transitions: any → any of the six statuses (keep it simple). Writing the same status is a no-op.
- On change: append `statusHistory`, optionally restore stock when moving to `cancelled`, email the customer.
- Do not let the public change status.

### 10.7 Emails (Nodemailer)

`lib/mail.ts` creates one transporter from SMTP env vars.

Templates (plain HTML, inline styles, no extra template engine):

1. **Order received (customer)** — order number, items, total, “we will contact you”.
2. **New order (admin)** — same plus customer contact details.
3. **Status update (customer)** — new status and a short sentence per status.

If SMTP env is missing in development, log the payload to the server console instead of throwing.

### 10.8 DeepSeek recommendations

Called from the detail page via `POST /api/recommendations` (or a cached server function if the key can stay server-side — prefer a **server function** in `lib/recommendations.ts` invoked from the Server Component so the API key never goes to the client). Only add the Route Handler if a client island must refresh recommendations.

Prompt rules:

- Send: current stone (`name, type, color, cut, origin, carat, price`) plus a compact catalog (`id, name, type, color, price`) excluding the current stone and sold-out items.
- Ask DeepSeek to return JSON only: `{ "ids": ["..."], "reason": "..." }` (3 items max).
- Parse strictly. Drop IDs that are not in the catalog.
- On timeout, bad JSON, or missing key: fallback query — same `type`, then similar `price` (±30%), limit 3.
- Cache successful results with `"use cache"` and `cacheLife("hours")` keyed by slug.

Never render raw model dumps. Show a short “You may also like” grid.

### 10.9 WhatsApp

Fixed bottom-right button on public layout (not on `/admin`).

- `https://wa.me/${NEXT_PUBLIC_WHATSAPP_NUMBER}?text=` URL-encoded greeting.
- On a detail page, prefill: `Hi, I am interested in <name> (Rs <price>).`
- Hide the button if the env number is empty.

---

## 11. Auth and security checklist

- Admin password and SMTP/DeepSeek keys never sent to the client.
- Cloudinary API secret stays server-only. Uploads are signed on the server. Never put `CLOUDINARY_API_SECRET` in a `NEXT_PUBLIC_*` var.
- Every admin Server Action and `/api/upload` calls `getAdminSession()` and returns/throws unauthorized if missing.
- Zod-validate all incoming FormData and JSON.
- Re-price and re-check stock on the server at checkout.
- Rate-limit is not required in v1, but do not expose Mongo errors to the client.
- `.env*` stays gitignored.

---

## 12. Build order

Implement in these phases. Finish and sanity-check a phase before starting the next. After any UI phase, verify in the browser: click through the real flow, not just a screenshot.

### Phase 0 — Foundation

- Design tokens and fonts in `app/globals.css` + `app/layout.tsx`.
- Public shell: header (logo, catalog, cart count placeholder), footer, WhatsApp placeholder.
- `lib/mongodb.ts`, models, `lib/constants.ts`, `lib/currency.ts`, `lib/validations.ts`.
- `.env.example` and local `.env.local`.
- Confirm Mongo connection with a tiny server-only log or a hidden health check.

### Phase 1 — Public catalog

- Gemstone seed script or a one-off admin-less insert for 4–6 sample stones (can be replaced once admin upload exists).
- Home grid + empty state.
- Detail page with gallery and specs.
- `next/image` with Cloudinary `remotePatterns`. Temporary sample stones may use existing Cloudinary URLs until admin upload exists.

### Phase 2 — Cart and checkout

- `CartProvider`, header count, cart page.
- Checkout form + `placeOrder`.
- Success page and cart clear.
- Stock decrement. Over-stock rejection.

### Phase 3 — Mail

- Nodemailer transport.
- Wire emails into `placeOrder`.
- Console fallback when SMTP is unset.

### Phase 4 — Admin auth and gemstone CRUD

- `lib/auth.ts`, login/logout, `proxy.ts`.
- Admin layout and dashboard counts.
- Gemstone list / create / edit / delete.
- `/api/upload` (Cloudinary) and image manager on the form. Destroy removed public IDs.
- Revalidate catalog tags after writes.
- Remove any temporary seed dependency.

### Phase 5 — Admin orders

- Orders list + filters.
- Order detail + status updates + history.
- Status-change email.
- Stock restore on cancel.

### Phase 6 — Recommendations and WhatsApp polish

- DeepSeek helper + fallback.
- “You may also like” on detail.
- WhatsApp button with context-aware message.
- Metadata, favicon, empty/error states, sold-out treatment.

### Phase 7 — Hardening

- 404 and error boundaries.
- Form errors via `useActionState`.
- Low-stock hint on admin dashboard (`stock <= 2`).
- Final desktop + mobile pass of every public and admin route.

---

## 13. Implementation notes for future-me

- Prefer Server Components. Add `"use client"` only for cart, image pickers, status dropdowns, and quantity controls.
- Do not fetch Mongo from Client Components.
- Format prices with `lib/currency.ts` — never scatter `Rs` strings.
- Gemstone `type` options live in `lib/constants.ts` so the admin select and filters stay in sync.
- Order status labels and badge colors also live in `lib/constants.ts`.
- When editing this plan during development, append a short “Decision log” entry instead of rewriting history.

---

## 14. Decision log

| Date | Decision |
| --- | --- |
| 2026-10-24 | v1 is guest checkout + single env-based admin. Cart is localStorage. Payments are COD only. Recommendations use DeepSeek with a Mongo fallback. |
| 2026-10-24 | Images: Cloudinary, not local disk and not Mongo binaries. Mongo stores `{ url, publicId }` only. WebP/AVIF comes from Cloudinary `f_auto,q_auto` on delivery. |

---

## 15. Definition of done

The app is done for v1 when all of the following work in the browser:

1. Admin can log in, upload a stone with images and price, and see it on the home page.
2. A guest can add two stones to the cart, check out, and land on a success page with an order number.
3. Admin can open that order and move it through pending → confirmed → delivered, and to cancelled.
4. Customer and admin receive (or, in dev without SMTP, the server logs) the matching emails.
5. Detail page shows three recommendations (DeepSeek or fallback).
6. WhatsApp button opens a chat with a prefilled message.
7. Sold-out stones cannot be ordered. Cancelled orders restore stock.
8. Public and admin layouts look like a jewelry store, not the Next.js starter.
