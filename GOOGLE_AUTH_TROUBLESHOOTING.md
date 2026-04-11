# Google Auth Troubleshooting Guide

If you are still experiencing issues with Google Authentication ("This page isn't working"), please follow these steps:

## 1. Google Cloud Console Configuration
Ensure your **OAuth 2.0 Client ID** is correctly configured in the [Google Cloud Console](https://console.cloud.google.com/):

*   **Authorized JavaScript origins**: `https://eventprise.duckdns.org`
*   **Authorized redirect URIs**: `https://eventprise.duckdns.org/api/auth/callback/google`

## 2. Environment Variables Check
Your `.env` file should contain the following (already provided in your message):

```env
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_SECRET=your-auth-secret
AUTH_URL=https://eventprise.duckdns.org
AUTH_TRUST_HOST=true
```

## 3. Common Issues & Solutions

### Redirect URI Mismatch
The most common cause of the "This page isn't working" error is a mismatch between the redirect URI configured in Google Cloud and the one used by NextAuth. Ensure the URI exactly matches `https://eventprise.duckdns.org/api/auth/callback/google`.

### AUTH_SECRET Missing or Invalid
NextAuth requires a secret to encrypt cookies. If `AUTH_SECRET` is missing or changed, existing sessions will break. You can generate a new one using:
`openssl rand -base64 32`

### Cookie Issues
Sometimes old cookies can cause redirect loops. Try clearing your browser's cookies for `eventprise.duckdns.org` or try in Incognito mode.

## 4. Debugging Logs
I've added detailed logging to the `signIn` and `jwt` callbacks in `src/app/api/auth/[...nextauth]/route.ts`. Check your server logs (e.g., Vercel or PM2 logs) for any error messages starting with `[Auth]`.
