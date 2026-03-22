import EventDetailPage from "@/components/EventDetailPage";

export default async function Page({ params }: { params: Promise<{ city: string; eventSlug: string }> }) {
  const { city, eventSlug } = await params;
  return <EventDetailPage citySlug={city} eventSlug={eventSlug} />;
}
