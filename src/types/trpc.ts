import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/server/routers/root";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Event = RouterOutputs["events"]["getByCity"][number];
export type City = RouterOutputs["events"]["getCities"][number];
export type Category = RouterOutputs["events"]["getCategories"][number];
