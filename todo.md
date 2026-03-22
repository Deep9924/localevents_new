# LocalEvents TODO

## Core Features
- [x] Dynamic city-based routing (/:city)
- [x] IP-based geolocation auto-detection and redirect
- [x] Event listings from database
- [x] Event detail pages (/:city/:event-slug)
- [x] Category tabs and filtering
- [x] Date filtering (Today, Tomorrow, This Weekend, This Week)
- [x] Google Maps integration on event detail pages
- [x] Mobile-responsive navbar
- [x] Civic Warmth design system (indigo + amber)
- [x] Cities landing page

## Authentication & User System
- [x] Manus OAuth integration
- [x] Sign in button with OAuth redirect
- [x] User account dashboard (/account/profile)
- [x] Saved events dashboard (/account/saved)
- [x] User profile management
- [x] Logout functionality
- [x] Navbar user profile menu with account links

## Saved Events
- [x] Database table for saved events
- [x] tRPC procedures (save, unsave, list, isSaved)
- [x] Save/unsave button on event cards
- [x] Saved events dashboard with filters

## Testing & Deployment
- [x] Unit tests for auth flow
- [x] Unit tests for saved events API
- [x] Unit tests for event fetching
- [x] Final testing and bug fixes
- [x] Performance optimization

## Navigation Refactoring
- [x] Move Navbar to App.tsx as persistent component
- [x] Remove duplicate Navbar imports from individual pages
- [x] Update all pages to remove Navbar rendering
- [x] Test navigation persistence across all routes

## Event Detail Page Navbar
- [x] Create custom navbar for event detail pages with locked city
- [x] Update App.tsx to show event-specific navbar on event detail routes
- [x] Test navbar city display on event detail pages

## Navbar Duplication Fix
- [x] Remove hardcoded navbar from EventDetailPage error states
- [x] Remove hardcoded navbar from CitiesLandingPage
- [x] Verify consistent navbar rendering across all pages

## Dummy Events for All Cities
- [x] Update seed script to generate events for all cities
- [x] Run seed script to populate database with city-specific events
- [x] Verify events display correctly for each city


## Advanced Search with Filters
- [ ] Create search component with price range, date, and distance filters
- [ ] Add tRPC procedure for advanced event search
- [ ] Integrate search into navbar and city pages
- [ ] Test search functionality across different filters

## Event Organizer Dashboard
- [ ] Create organizer dashboard page with event management
- [ ] Add ability to view event attendance and analytics
- [ ] Implement announcement/notification system for attendees
- [ ] Create organizer authentication and access control
- [ ] Test dashboard features and permissions

## Navbar Visibility Fix
- [x] Fix navbar not showing on London and other cities event detail pages
- [x] Simplify navbar visibility logic to work with all cities
- [x] Test navbar on all city pages (Toronto, London, Vancouver, etc.)
- [x] Test navbar on all event detail pages
- [x] Test navbar on account pages (profile, saved events)

## Saved Events Bug
- [ ] Fix saved events not appearing in saved events dashboard
- [ ] Debug event ID mismatch between frontend and database
- [ ] Verify save/unsave functionality works correctly
- [ ] Test saved events display with multiple events

## Login Functionality
- [x] OAuth login endpoint working correctly
- [x] Redirect to Manus OAuth provider
- [x] Session cookie creation
- [x] User authentication flow

## Simple Login/Sign-up System
- [x] Replace OAuth with simple email/password authentication
- [x] Create login modal/page with email and password fields
- [x] Create sign-up modal/page with email, password, and name fields
- [x] Implement session management with JWT tokens
- [x] Test login and sign-up flows
- [x] Add password strength requirements (8+ chars, uppercase, lowercase, numbers, special chars)
- [x] Add password strength indicator with real-time validation
- [x] Add confirm password field to sign-up form
- [x] Redesign AuthModal with tab-based interface (Sign In / Sign Up)
- [x] Implement IP-based geolocation for automatic city detection
- [x] Add localStorage to remember user's city selection
- [ ] Fix saved events functionality with new auth system


## Google Sign-In Integration
- [x] Add Google Sign-In button UI in AuthModal
- [x] Create placeholder for Google authentication flow
- [ ] Implement full Google OAuth configuration
- [ ] Implement Google authentication flow
- [ ] Test Google Sign-In login and account creation
- [ ] Handle Google user data mapping to local user table

## Location Detection Improvements
- [x] Make IP-based geolocation the primary method
- [x] Implement localStorage fallback when IP detection fails
- [x] Add error handling for geolocation API failures
- [x] Add 5-second timeout for IP detection API calls
- [x] Test location detection with various scenarios
