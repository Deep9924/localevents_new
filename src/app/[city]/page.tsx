import CityPage from "@/components/CityPage";

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return <CityPage citySlug={city} />;
}
