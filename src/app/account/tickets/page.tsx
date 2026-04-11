import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserByOpenId } from "@/server/db/users";
import { getUserTickets, type TicketFilter } from "@/server/db/tickets";
import AccountTicketsClient from "@/components/account/AccountTicketsClient";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await getUserByOpenId(session.user.id);

  if (!dbUser) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const rawFilter = params.filter;

  const filter: TicketFilter =
    rawFilter === "past" || rawFilter === "all" ? rawFilter : "upcoming";

  const userTickets = await getUserTickets(dbUser.id, filter);

  return (
    <AccountTicketsClient
      initialTickets={userTickets}
      initialFilter={filter}
    />
  );
}