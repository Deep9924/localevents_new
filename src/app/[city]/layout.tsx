import { CityInitializer } from "@/components/CityInitializer";

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  return (
    <>
      <CityInitializer city={city} />
      {children}
    </>
  );
}