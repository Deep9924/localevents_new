# Implementation Guide: Refactoring for Cleanliness and Reusability

This guide details the changes made to the **LocalEvents** codebase to improve its architecture, data management, and component design.

## 1. Architectural Changes: Modular tRPC Routers

The monolithic `src/server/routers.ts` has been split into smaller, domain-specific routers.

- **`src/server/routers/auth.ts`**: Handles user authentication (signup, login, logout, me).
- **`src/server/routers/events.ts`**: Manages event-related operations (fetch by city, slug, featured, search, counts).
- **`src/server/routers/organizers.ts`**: Provides access to organizer details and their events.
- **`src/server/routers/savedEvents.ts`**: Handles user-saved events (save, unsave, list, isSaved).
- **`src/server/routers/root.ts`**: Combines all sub-routers into a single `appRouter`.

**Action Required**: Update any imports that previously relied on the monolithic `routers.ts` if they don't resolve correctly via the new `root.ts` export.

## 2. Technical Debt: Strict Typing

We've eliminated `any` usages in key components to leverage TypeScript's full power and ensure data integrity.

- **`src/components/AccountSaved.tsx`**: 
    - Replaced `any[]` with `SavedEventWithEvent[]` inferred from the tRPC router output.
    - Used a type guard (`item is SavedEventWithEvent & { event: NonNullable<SavedEventWithEvent["event"]> }`) to ensure the `event` property exists and is not null before accessing its properties.
    - This provides full auto-completion and compile-time safety for event data.

- **`src/components/EventSection.tsx`**:
    - Refactored the `category` prop to use a strict object type instead of `any`.
    - This ensures that category icons and labels are always available and correctly typed.

## 3. Database Portability Advice

While the current setup uses Drizzle with MySQL, the following best practices should be followed for future portability (e.g., to Oracle or PostgreSQL):

- **Avoid Native SQL**: Use Drizzle's query builder whenever possible to abstract away database-specific syntax.
- **Centralize Logic**: Continue using the service layer (like the `db/index.ts` functions) to encapsulate database interactions.
- **Standard Data Types**: Stick to standard SQL data types that have broad support across different databases.

## 4. Summary of Refactored Files

| File | Change Type | Description |
| :--- | :--- | :--- |
| `src/server/routers/*.ts` | Architectural | Modularized tRPC routers for better organization. |
| `src/components/AccountSaved.tsx` | Typing | Replaced `any` with strict Drizzle-inferred types. |
| `src/components/EventSection.tsx` | Typing | Refactored props for better type safety. |
| `IMPLEMENTATION_GUIDE.md` | Documentation | Detailed guide for the refactoring changes. |

By following these patterns, your codebase is now more modular, easier to maintain, and better prepared for future growth and potential database migrations.
