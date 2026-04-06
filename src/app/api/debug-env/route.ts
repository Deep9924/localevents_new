import { NextResponse } from "next/server";

export async function GET() {
  // Only allow this in production for a short time to debug
  // You should delete this file after debugging
  const envs = {
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL, // Check if this is set
    HAS_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    HAS_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    HAS_AUTH_SECRET: !!process.env.AUTH_SECRET,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
  };

  return NextResponse.json(envs);
}
