"use client";

import { CalendarPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarButtonProps {
  event: {
    title: string;
    description?: string | null;
    date: string;
    time: string;
    venue: string;
  };
}

export default function CalendarButton({ event }: CalendarButtonProps) {
  const { title, description, date, time, venue } = event;
  
  // Parse date and time to ISO format for calendar links
  // This is a simplified version, in a real app you'd use a robust date library
  const startDate = new Date(`${date} ${time}`).toISOString().replace(/-|:|\.\d+/g, "");
  const endDate = new Date(new Date(`${date} ${time}`).getTime() + 2 * 60 * 60 * 1000)
    .toISOString()
    .replace(/-|:|\.\d+/g, "");

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
    description || ""
  )}&location=${encodeURIComponent(venue)}&sf=true&output=xml`;

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(
    title
  )}&startdt=${startDate}&enddt=${endDate}&body=${encodeURIComponent(
    description || ""
  )}&location=${encodeURIComponent(venue)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold h-10"
        >
          <CalendarPlus className="w-4 h-4 mr-2" />
          Add to Calendar
          <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            Outlook.com
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          // iCal download logic would go here
          window.open(`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0AURL:${encodeURIComponent(window.location.href)}%0ADTSTART:${startDate}%0ADTEND:${endDate}%0ASUMMARY:${encodeURIComponent(title)}%0ADESCRIPTION:${encodeURIComponent(description || "")}%0ALOCATION:${encodeURIComponent(venue)}%0AEND:VEVENT%0AEND:VCALENDAR`);
        }}>
          iCal / Apple Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
