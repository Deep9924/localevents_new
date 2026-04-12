# Security and Performance Audit Report: Deep9924/localevents_new

This report provides a comprehensive analysis of the security posture and performance efficiency of the `localevents_new` repository. It identifies critical vulnerabilities, architectural inefficiencies, and actionable recommendations to enhance user security and optimize load times.

---

## 1. Security Audit

### 1.1. Critical: Dual Authentication & Fallback Secret
The application implements two separate authentication systems: **NextAuth (Google OAuth)** and a **Custom Email/Password** system.
*   **Vulnerability:** The custom authentication system (`src/server/routers/auth.ts`) uses a hardcoded fallback secret: `process.env.JWT_SECRET ?? "fallback-secret"`.
*   **Impact:** If the `JWT_SECRET` environment variable is not set or is misconfigured, the application defaults to a publicly known secret. An attacker could forge session tokens and gain full access to any user account.
*   **Recommendation:** Remove the fallback secret. Ensure the application throws an error during startup if `JWT_SECRET` is missing. Consolidate authentication into a single, unified system (preferably NextAuth) to reduce the attack surface.

### 1.2. High: Payment Webhook Race Conditions & Idempotency
The Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) processes `checkout.session.completed` events by updating ticket statuses and incrementing "sold" counts.
*   **Vulnerability:** The handler lacks **idempotency guards**. If Stripe retries a webhook (due to a timeout or network error), the "sold" count for ticket tiers will be incremented multiple times for a single purchase.
*   **Impact:** Inaccurate ticket inventory, potentially leading to overselling events.
*   **Recommendation:** Use a database transaction to update ticket status and tier counts atomically. Store the `stripeSessionId` in a unique column and check if it has already been processed before applying updates.

### 1.3. Medium: Synchronous Password Hashing
The custom auth router uses `bcrypt.hashSync` and `bcrypt.compareSync` on the main request path.
*   **Vulnerability:** Bcrypt is intentionally slow and CPU-intensive. Using synchronous versions blocks the Node.js event loop.
*   **Impact:** Under even moderate login load, the entire server will become unresponsive to other users, creating a self-inflicted Denial of Service (DoS) vector.
*   **Recommendation:** Switch to the asynchronous versions: `bcrypt.hash` and `bcrypt.compare`.

### 1.4. Medium: Sensitive Data Exposure in Logs
The database client (`src/server/db/client.ts`) catches connection errors and logs them to the console.
*   **Vulnerability:** Depending on the environment, these logs might include connection strings or internal network details.
*   **Impact:** Information disclosure that could assist an attacker in lateral movement.
*   **Recommendation:** Use a structured logging library and ensure sensitive connection details are redacted from error outputs.

---

## 2. Performance & Efficiency Audit

### 2.1. High: Redundant Geolocation Calls
The application performs IP-based geolocation in at least **four different places**:
1.  **Server-side:** `src/lib/detectCity.ts` (via root layout).
2.  **Client-side Utility:** `src/lib/geolocation.ts`.
3.  **Hero Component:** `src/components/HeroBanner.tsx`.
4.  **City Picker:** `src/components/CityPickerModal.tsx`.
*   **Issue:** Each of these triggers a separate request to `ipapi.co`. This adds significant latency (300ms–1s per call) and risks hitting rate limits.
*   **Impact:** Slower "Time to Interactive" (TTI) and inconsistent location detection across the UI.
*   **Recommendation:** Perform geolocation **once** on the server (in the root layout or middleware) and pass the detected city down via a React Context or a cookie. Remove all direct `fetch("https://ipapi.co/json/")` calls from client components.

### 2.2. High: Unoptimized Image Handling
The `EventCard` component (`src/components/EventCard.tsx`) uses standard `<img>` tags for event images.
*   **Issue:** Images are loaded at full resolution without optimization, lazy loading, or modern formats (like WebP).
*   **Impact:** Large page weight, high data usage for mobile users, and poor "Largest Contentful Paint" (LCP) scores.
*   **Recommendation:** Use the **Next.js `Image` component** (`next/image`). It provides automatic resizing, lazy loading, and format conversion, which can reduce image payload sizes by up to 80%.

### 2.3. Medium: Database Connection Overhead
The `getDb()` helper (`src/server/db/client.ts`) initializes a new Drizzle instance and connection pool if one doesn't exist.
*   **Issue:** While it uses a singleton pattern, the `connectionLimit` is set to a static `10`.
*   **Impact:** In a serverless environment (like Vercel), each function execution might create its own pool, quickly exhausting database connections.
*   **Recommendation:** For serverless deployments, use a connection-pooling proxy (like Prisma Accelerate or TiDB Cloud's built-in pooling) and reduce the `connectionLimit` to `1` or `2` per instance.

### 2.4. Medium: Client-Side Heavy Lifting
The `CityPage` component (`src/components/CityPage.tsx`) performs complex filtering and grouping of events in a `useMemo` hook.
*   **Issue:** As the number of events grows, this client-side processing will lag on lower-end devices.
*   **Impact:** UI "jank" and slow response to filter changes.
*   **Recommendation:** Move filtering and grouping logic to the **tRPC backend**. Let the database handle the heavy lifting and return only the data needed for the current view.

---

## 3. Summary of Action Plan

| Priority | Category | Action Item |
| :--- | :--- | :--- |
| **Critical** | Security | Remove `"fallback-secret"` and enforce `JWT_SECRET` env var. |
| **Critical** | Security | Implement idempotency in Stripe webhooks using DB transactions. |
| **High** | Performance | Consolidate geolocation to a single server-side call. |
| **High** | Performance | Replace `<img>` tags with `next/image` for all event assets. |
| **Medium** | Security | Switch to asynchronous `bcrypt` methods. |
| **Medium** | Performance | Move event filtering/grouping from client to tRPC/Database. |

By addressing these items, you will significantly improve the security of your users' data and provide a much faster, more professional experience for your visitors.
