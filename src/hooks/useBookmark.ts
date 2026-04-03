import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

export function useBookmark(event: Event) {
  const { user } = useAuth();

  const { data: isSavedInitial = false, refetch } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event.id },
    { enabled: !!user }
  );

  const [isSaved, setIsSaved] = useState(isSavedInitial);

  useEffect(() => {
    setIsSaved(isSavedInitial);
  }, [isSavedInitial]);

  const saveEventMutation = trpc.savedEvents.save.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success("Event saved!");
      refetch();
    },
    onError: () => {
      toast.error("Failed to save event");
    },
  });

  const unsaveEventMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => {
      setIsSaved(false);
      toast.success("Removed from saved events");
      refetch();
    },
    onError: () => {
      toast.error("Failed to remove event");
    },
  });

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast.error("Please sign in to save events");
      return;
    }

    if (isSaved) {
      await unsaveEventMutation.mutateAsync({ eventId: event.id });
    } else {
      await saveEventMutation.mutateAsync({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventCity: event.citySlug, // Assuming citySlug is available on event
      });
    }
  };

  return { isSaved, handleBookmarkToggle };
}
