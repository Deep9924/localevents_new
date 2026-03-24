# Code Improvement Report: LocalEvents

This report outlines recommended changes to the **LocalEvents** codebase to improve its cleanliness, maintainability, and reusability. The analysis focused on architectural patterns, data management, and component design.

## 1. Architectural Improvements

### Modularize tRPC Routers
Currently, `src/server/routers.ts` contains all procedures for auth, events, organizers, and saved events. As the application grows, this file will become unmanageable.
- **Recommendation**: Split the root router into sub-routers (e.g., `event.router.ts`, `auth.router.ts`) and merge them in a central `root.ts`.
- **Benefit**: Better organization, easier testing, and reduced merge conflicts.

### Implement a Service Layer
Database logic is currently mixed with tRPC procedures or placed in a generic `db/index.ts`.
- **Recommendation**: Create a dedicated service layer (e.g., `src/server/services/event.service.ts`) to handle complex business logic and database interactions.
- **Benefit**: Decouples the transport layer (tRPC) from the business logic, making it easier to reuse logic in other parts of the app (like background jobs or CLI scripts).

## 2. Data Management & Cleanliness

### Move Static Data to the Database
`src/lib/events-data.ts` contains hardcoded arrays for `CITIES` and `CATEGORIES`.
- **Recommendation**: Create `cities` and `categories` tables in the database. Fetch this data via tRPC or Server Components.
- **Benefit**: Allows for dynamic updates without code changes, supports richer metadata for cities/categories, and enables proper database relationships.

### Server-Side Filtering
In `CityPage.tsx`, events are fetched in bulk and then filtered on the client using `useMemo`.
- **Recommendation**: Move filtering logic (search, date, category) to the tRPC procedures. Use SQL queries to filter data at the source.
- **Benefit**: Significantly improves performance for cities with many events and reduces the amount of data transferred over the network.

### Consolidate Duplicate Logic
- **Slug Generation**: Logic exists in both `src/lib/utils.ts` and `src/lib/events-data.ts`.
- **IP Geolocation**: Repeated in `CityPickerModal.tsx` and other places.
- **Recommendation**: Centralize these in `src/lib/utils.ts` or dedicated utility files.

## 3. Component Reusability

### Presentational vs. Container Components
Many components (e.g., `EventCard`, `CityPage`) are "Smart Components" that handle their own data fetching, auth state, and routing.
- **Recommendation**: Refactor these into "Dumb" (Presentational) components that only accept props and "Smart" (Container) components that handle logic.
- **Example**: `EventCard` should accept `onSave` and `onClick` callbacks instead of calling `trpc.savedEvents.save.useMutation()` and `router.push()` internally.

### Custom Hooks for Shared Logic
Logic for URL state synchronization and event filtering is currently embedded in `CityPage.tsx`.
- **Recommendation**: Extract this into a custom hook like `useEventFilters`.
- **Benefit**: Makes the logic reusable across different pages (e.g., a global search page or an organizer's dashboard).

## 4. Technical Debt & Typing

### Replace `any` Types
Several files (e.g., `AccountSaved.tsx`, `EventSection.tsx`) use `any` or `any[]`.
- **Recommendation**: Leverage Drizzle's `$inferSelect` or Zod schemas to define strict types for all data models.

### Standardize Error Handling
Error handling is inconsistent, with some components using `toast` and others having no explicit error states.
- **Recommendation**: Implement a global error boundary and a standardized way to handle tRPC errors using the `onError` callback.

---

## Summary of Action Items

| Category | Action Item | Priority |
| :--- | :--- | :--- |
| **Data** | Move `CITIES` and `CATEGORIES` to DB | High |
| **Performance** | Implement Server-Side Filtering | High |
| **Architecture** | Modularize tRPC Routers | Medium |
| **Reusability** | Refactor `EventCard` to be Presentational | Medium |
| **Cleanup** | Centralize Utility Functions (Slugs, Geo) | Low |
| **Typing** | Remove `any` usages and use Inferred Types | Low |
