# AI Agent Rules - TripAlfa Project

## ⚠️ CRITICAL: Tech Stack Enforcement

**This project uses the following tech stack:**
- **Runtime:** Node.js
- **Backend Framework:** Express.js
- **Frontend Framework:** React.js
- **Build Tool:** Vite
- **Language:** TypeScript

### Mandatory Rules for All AI Agents:

1. **ALWAYS use TypeScript (.ts/.tsx) files** - Never create `.js` or `.jsx` files in this project. All JavaScript/JSX code MUST be written in TypeScript/TSX.

2. **File Extensions:**
   - TypeScript files: `.ts`
   - TypeScript React files: `.tsx`
   - TypeScript declaration files: `.d.ts`
   - Configuration files can use `.ts` (e.g., `eslint.config.ts`, `vite.config.ts`)

3. **Import statements:**
   - Use ES modules with `import`/`export` syntax
   - Do NOT use CommonJS (`require`/`module.exports`) unless absolutely necessary

4. **Type Safety:**
   - Always define proper TypeScript types for function parameters and return values
   - Avoid using `any` type when possible
   - Use interfaces and types for structured data

## Checking for JavaScript Files

Before completing any task, verify that no `.js` or `.jsx` files have been accidentally created. Run:

```bash
find . -name "*.js" -o -name "*.jsx" | grep -v node_modules
```

If any `.js` files are found, convert them to TypeScript immediately.

## Exceptions

The only acceptable `.js` files are:
- `.eslintrc.js` (if absolutely required by eslint)
- `.prettierrc.js` (if absolutely required by prettier)
- Legacy third-party libraries in `node_modules`

**All project source code must be TypeScript.**

## ⚠️ Database Architecture Rules

To ensure performance, data integrity, and cost-efficiency, all AI agents MUST follow these strict database separation rules:

### 1. Static Reference Data (Local PostgreSQL)
- **Database**: `staticdatabase` (Local PostgreSQL)
- **Schema**: `shared`, `hotel`, `flight`
- **Content**: All data that is read-only or updated via batch imports (Airports, Airlines, Cities, Hotel Types, Amenities, IATA Codes, Countries, Currencies, Languages, etc.).
- **Access Pattern**: Use direct `pg` pool connections (e.g., `staticDbPool`) for high-performance lookups.
- **CRITICAL**: **NEVER** save or migrate static data to the Neon production database.

### 2. Application & Transactional Data (Neon DB)
- **Database**: Neon (Production)
- **Schema**: `public` (as managed by Prisma)
- **Content**: All dynamic, user-generated, and transactional data (Users, Bookings, Wallets, Transactions, Offline Requests, Documents, Disputes, etc.).
- **Access Pattern**: Managed via Prisma Client (`@tripalfa/shared-database`).
- **CRITICAL**: This database is for high-value transactional data only. Do not pollute it with millions of rows of static reference data.

### 3. Data Flow
- Services requiring static data should connect to the local `staticdatabase`.
- Services requiring transactional consistency (e.g., creating a booking) must use Neon.
- Avoid join queries across these two databases; instead, fetch reference IDs from the static DB and use them in transactional records in Neon.

---

*Last updated: 2026-03-08 based on explicit architectural directives.*
