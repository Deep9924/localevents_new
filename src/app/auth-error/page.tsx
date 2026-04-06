"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          {error === "Configuration" && "There is a problem with the server configuration. Please check your environment variables."}
          {error === "AccessDenied" && "Access was denied. You may not have permission to sign in."}
          {error === "Verification" && "The verification link has expired or has already been used."}
          {!error && "An unknown error occurred during authentication."}
          {error && error !== "Configuration" && error !== "AccessDenied" && error !== "Verification" && `Error: ${error}`}
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            If you are the site owner, please check the server logs for more details.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
