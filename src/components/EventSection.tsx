// Design: Civic Warmth — horizontal scroll mobile, grid desktop
import { Event, EventCategory } from "@/lib/events-data";
import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";

interface EventSectionProps {
  title: string;
  events: Event[];
  category: EventCategory;
  cityName: string;
  citySlug: string;
  icon?: string;
}

export default function EventSection({
  title,
  events,
  category,
  cityName,
  citySlug,
  icon,
}: EventSectionProps) {
  if (events.length === 0) return null;

  return (
    <section className="py-2">
      <SectionHeader
        title={`${icon || ""} ${title} in ${cityName}`}
        viewAllLink="#"
      />

      {/* ── MOBILE: horizontal scroll ── */}
      <div className="flex sm:hidden gap-3 overflow-x-auto scrollbar-hide pb-2">
        {[...events].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)).map((event) => (
          <div key={event.id} className="shrink-0 w-[72vw]">
            <EventCard event={event} citySlug={citySlug} />
          </div>
        ))}
      </div>

      {/* ── DESKTOP: scroll with 4.5 cards visible ── */}
      <div className="hidden sm:flex gap-5 overflow-x-auto scrollbar-hide pb-2">
        {[...events].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)).map((event) => (
          <div key={event.id} className="shrink-0" style={{ width: "calc((100% - 60px) / 4.5)" }}>
            <EventCard event={event} citySlug={citySlug} />
          </div>
        ))}
      </div>
    </section>
  );
}