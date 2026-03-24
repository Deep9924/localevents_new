# LocalEvents Cleanup & Reusability Guide

This guide outlines the systematic approach taken to clean up the **LocalEvents** codebase, remove technical debt, and ensure maximum reusability across the platform.

## 1. Data-Driven Architecture (Reusability)

We have transitioned from static, hardcoded data to a fully database-driven model.

### Moving Static Data to Database
Previously, `CITIES` and `CATEGORIES` were hardcoded in `src/lib/events-data.ts`. This made it impossible to update them without a code deployment.
- **Change**: Created `cities` and `categories` tables in `src/server/db/schema.ts`.
- **Impact**: You can now add new cities or categories directly in the database. The UI automatically reflects these changes by fetching them via tRPC.
- **Seeding**: Use `scripts/seed-meta.mjs` to populate these tables.

### Server-Side Filtering (Performance & Reusability)
Filtering was previously done on the client after fetching all events.
- **Change**: Moved filtering logic (category, search, date) to the tRPC `events.getByCity` procedure.
- **Impact**: Faster page loads, reduced bandwidth, and the ability to reuse the same filtering logic in other parts of the app (like an API or mobile app).

## 2. Component Refactoring (Cleanliness)

We've applied the **Container/Presentational** pattern to separate logic from UI.

### Smart vs. Dumb Components
- **`EventCard.tsx`**: Now a "Dumb" (Presentational) component. It accepts optional callbacks for actions like bookmarking, allowing it to be used in different contexts (e.g., search results, saved events, or even a static list) without being hard-bound to specific tRPC mutations.
- **`CityPage.tsx`**: Refactored to be a "Smart" (Container) component. It orchestrates data fetching and state management but delegates filtering logic to a custom hook.

### Custom Hooks for Shared Logic
- **`useEventFilters.ts`**: Encapsulates the logic for managing URL-synced filter state. This hook can be dropped into any page that needs to filter events, ensuring consistent behavior across the app.

## 3. Removing Technical Debt (Cleanliness)

### Eliminating `any` Types
Strict typing has been enforced across the codebase to leverage TypeScript's safety.
- **Inferred Types**: Used `inferRouterOutputs<AppRouter>` to get precise types for data returned from tRPC.
- **Type Guards**: Implemented type guards (e.g., in `AccountSaved.tsx`) to safely handle potentially null relations.

### Modular tRPC Routers
The root router has been split into domain-specific files:
- `auth.ts`, `events.ts`, `organizers.ts`, `savedEvents.ts`.
- This prevents the root router from becoming a "God object" and makes it easier to maintain and test individual domains.

### Centralized Utilities
Consolidated redundant logic for:
- **Slug Generation**: Now centralized in `src/lib/utils.ts`.
- **IP Geolocation**: Moved to `src/lib/utils.ts` for global availability.
- **Distance Calculation**: Added a shared Haversine formula utility.

## 4. Summary of Improvements

| Category | Before | After |
| :--- | :--- | :--- |
| **Data** | Hardcoded in `.ts` files | Dynamic in SQL database |
| **Filtering** | Client-side (Slow) | Server-side (Fast, SQL-indexed) |
| **Components** | Tight coupling with logic | Loose coupling (Reusable) |
| **Types** | Frequent use of `any` | Strict, inferred types |
| **Architecture** | Monolithic routers | Modular, domain-driven routers |

By following these patterns, the **LocalEvents** codebase is now a professional-grade, maintainable, and scalable platform.
