export type CalendarEventType = {
  title: string;
  description: string | null;
  date: string;
  time: string;
  venue: string;
};

export type Tier = {
  id: number;
  name: string;
  price: number | string;
  description?: string | null;
};