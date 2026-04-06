# Google Authentication Setup Guide

This guide explains how to set up Google OAuth for LocalEvents using NextAuth v5.

## Prerequisites

You need to have a Google Cloud project with OAuth 2.0 credentials configured. Follow these steps:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services > Library**
   - Search for "Google+ API"
   - Click **Enable**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Choose **Web application**
4. Add the following **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://eventprise.duckdns.org` (for production)

5. Add the following **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://eventprise.duckdns.org/api/auth/callback/google` (for production)

6. Copy your **Client ID** and **Client Secret**

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project (or update your existing `.env` file):

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/localevents

# JWT Secret for session management (generate a random string)
JWT_SECRET=your-random-secret-key-here

# NextAuth Configuration (generate a random string for AUTH_SECRET)
AUTH_SECRET=your-random-nextauth-secret-here
AUTH_URL=https://eventprise.duckdns.org

# Google OAuth Configuration (from Google Cloud Console)
AUTH_GOOGLE_ID=your-google-client-id-here
AUTH_GOOGLE_SECRET=your-google-client-secret-here

# Node Environment
NODE_ENV=production

# Trust Host (required for production behind proxy)
AUTH_TRUST_HOST=true

# Optional: Owner ID for admin role assignment
OWNER_OPEN_ID=your-google-account-id-for-admin-access
```

### 4. Generate Random Secrets

You can generate random secrets using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## How It Works

### Authentication Flow

1. **User clicks "Continue with Google"** in the AuthModal
2. **NextAuth redirects to Google** for authentication
3. **Google redirects back** to `/api/auth/callback/google` with authorization code
4. **NextAuth exchanges code for tokens** and user information
5. **User data is stored** in the database via the `upsertUser` callback
6. **Session is created** and stored in JWT cookie
7. **User is logged in** and redirected back to the application

### Key Components

- **`/src/app/api/auth/[...nextauth]/route.ts`**: NextAuth configuration and handlers
- **`/src/components/AuthModal.tsx`**: Frontend UI for Google sign-in button
- **`/src/server/context.ts`**: Extracts user from NextAuth session for tRPC
- **`/src/server/db/index.ts`**: `upsertUser` function that stores user data

## Troubleshooting

### "This page isn't working" Error

This typically indicates one of the following issues:

1. **Missing environment variables**: Ensure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.
2. **Incorrect redirect URIs**: Verify the redirect URIs in Google Cloud Console match your application URLs. For production, it must be `https://eventprise.duckdns.org/api/auth/callback/google`.
3. **Database connection issues**: Ensure `DATABASE_URL` is correct and the database is accessible.
4. **Missing `/login` page**: The app redirects to home page (`/`) on auth errors instead of `/login`.

### Session Not Persisting

- Check that `AUTH_SECRET` is set and consistent across deployments.
- Verify cookies are being sent with requests (check browser DevTools > Application > Cookies).
- Ensure `trustHost: true` is set in NextAuth configuration.

### User Data Not Saved

- Check database connection in `DATABASE_URL`.
- Verify the `users` table exists with the correct schema.
- Check server logs for database errors.

## Testing Locally

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open http://localhost:3000 in your browser

3. Click the "Continue with Google" button in the auth modal

4. You should be redirected to Google login

5. After successful authentication, you should be logged in

## Production Deployment

For production deployment:

1. Update `AUTH_URL` to your production domain (`https://eventprise.duckdns.org`).
2. Add your production domain to Google Cloud Console authorized origins and redirect URIs.
3. Use a strong, randomly generated `AUTH_SECRET`.
4. Ensure `NODE_ENV=production` is set.
5. Use a production database URL.
6. Ensure `AUTH_TRUST_HOST=true` is set in your environment.

## Security Considerations

- **Never commit `.env.local`** to version control.
- **Rotate `AUTH_SECRET`** periodically.
- **Use HTTPS** in production (required by Google OAuth).
- **Validate user input** on the backend.
- **Implement rate limiting** on auth endpoints.
- **Monitor authentication logs** for suspicious activity.

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth Google Provider](https://next-auth.js.org/providers/google)
