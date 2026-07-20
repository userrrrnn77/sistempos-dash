# SistemPOS — Dashboard

Internal, role-based admin dashboard for the SistemPOS ecosystem. Covers
point-of-sale operations, inventory, staff and branch management, and
transaction auditing.

## Features

- **Point of Sale (POS)** — process in-person sales transactions.
- **Products & Categories** — manage product catalog and categories.
- **Fulfillment** — manage order fulfillment (Cashier, Owner, Developer).
- **Customers** — view and manage customer records (Cashier, Owner,
  Developer).
- **Employees & Branches** — manage staff accounts and physical branches
  (Owner, Developer only).
- **Transactions** — view transaction history; daily audit reconciliation
  (Owner, Developer only).
- **Audit Log** — system-wide activity log (Developer only).
- **Role-based access control** — routes and features are gated by role:
  `CASHIER`, `OWNER`, `DEVELOPER`.

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Framework  | React 19 + Vite                     |
| Routing    | React Router v7                     |
| Styling    | Tailwind CSS v4                     |
| Charts     | Recharts                            |
| HTTP       | Axios                               |
| Auth       | Supabase Auth                       |
| Icons      | Lucide React, React Icons           |
| Language   | TypeScript                          |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js + npm/pnpm)
- A running instance of the [SistemPOS backend](../backend)
- A Supabase project (for auth)

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

App runs at `http://localhost:5173` by default.

### Build

```bash
bun run build
```

### Preview production build

```bash
bun run preview
```

## Project Structure

```
src/
├── components/       # Shared UI (ui/ primitives, Toast, etc.)
├── context/          # Auth, Theme providers
├── layouts/            # DashboardLayout, RequireRole guard
├── pages/
│   ├── auth/            # Login
│   ├── dashboard/         # Overview
│   ├── pos/                # Point of Sale
│   ├── products/             # Product management
│   ├── categories/             # Category management
│   ├── fulfillment/               # Order fulfillment
│   ├── customers/                   # Customer records
│   ├── employees/                     # Employee list & detail
│   ├── branches/                        # Branch management
│   ├── transactions/                      # History + daily audit
│   └── audit/                               # System audit log
├── services/         # API clients (axios instances per resource)
└── types/            # Shared TypeScript types
```

## Routing & Access Control

| Route                      | Roles Required                     |
|------------------------------|-------------------------------------|
| `/login`                       | Public                              |
| `/dashboard`                     | Any authenticated user              |
| `/dashboard/pos`                   | Any authenticated user              |
| `/dashboard/products`                | Any authenticated user              |
| `/dashboard/categories`                | Any authenticated user              |
| `/dashboard/fulfillment`                 | Cashier, Owner, Developer           |
| `/dashboard/customers`                     | Cashier, Owner, Developer           |
| `/dashboard/employees`                       | Owner, Developer                    |
| `/dashboard/branches`                          | Owner, Developer                    |
| `/dashboard/transactions/history`                | Any authenticated user              |
| `/dashboard/transactions/audit`                    | Owner, Developer                    |
| `/dashboard/audit-log`                               | Developer                           |

## Deployment

Configured for [Vercel](https://vercel.com) with SPA rewrites
(`vercel.json`) — all routes fall back to `index.html`.

## License

Private project — not licensed for public use.