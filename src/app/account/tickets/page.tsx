import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getUserTickets, type TicketFilter } from "@/server/db/tickets";
import AccountTicketsClient from "@/components/account/AccountTicketsClient";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function AccountTicketsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const params = (await searchParams) ?? {};
  const rawFilter = params.filter;
  const filter: TicketFilter =
    rawFilter === "past" || rawFilter === "all" ? rawFilter : "upcoming";

  const tickets = await getUserTickets(Number(session.user.id), filter);

  return <AccountTicketsClient initialTickets={tickets} initialFilter={filter} />;
}
