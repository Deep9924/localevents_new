// app/[city]/page.tsx
import { notFound } from "next/navigation";
import CityPage from "@/components/CityPage";
import { getCityBySlug } from "@/server/db";

export default async function Page({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  const cityRow = await getCityBySlug(city);
  if (!cityRow) {
    notFound(); // triggers 404 page
  }

  return <CityPage citySlug={city} />;
}