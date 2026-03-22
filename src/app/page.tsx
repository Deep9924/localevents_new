// src/app/page.tsx
// Root redirects to /toronto by default (geolocation handled client-side)
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/toronto");
}
