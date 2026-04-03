// Design: Civic Warmth — Reusable event grid component
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];
import EventCard from "./EventCard";

interface EventGridProps {
  events: Event[];
  citySlug: string;
  columns?: number;
  maxItems?: number;
}

const colsClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
};

export default function EventGrid({ events, citySlug, columns = 4, maxItems }: EventGridProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  if (displayEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${colsClass[columns] ?? colsClass[4]}`}>
      {displayEvents.map((event) => (
        <EventCard key={event.id} event={event} citySlug={citySlug} />
      ))}
    </div>
  );
}