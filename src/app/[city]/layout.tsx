import RootNavbar from "@/components/RootNavbar";

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
      <RootNavbar />
      {children}
    </>
  );
}
