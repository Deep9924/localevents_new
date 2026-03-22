// Design: Civic Warmth — Warm modernism, deep indigo primary, amber accent
// This file contains mock event data for demonstration purposes

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  date: string;
  time: string;
  venue: string;
  city: string;
  citySlug: string;
  category: string;
  image?: string | null;
  price?: string | null;
  interested?: number | null;
  isFeatured?: number | null;
  tags?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventCategory =
  | "all"
  | "music"
  | "concerts"
  | "parties"
  | "comedy"
  | "performances"
  | "exhibitions"
  | "food-drinks"
  | "art"
  | "theatre"
  | "health-wellness"
  | "education"
  | "festivals"
  | "sports"
  | "kids"
  | "business"
  | "entertainment";

export interface City {
  slug: string;
  name: string;
  province: string;
  country: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { slug: "regina", name: "Regina", province: "Saskatchewan", country: "Canada", lat: 50.4452, lng: -104.6189 },
  { slug: "toronto", name: "Toronto", province: "Ontario", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { slug: "vancouver", name: "Vancouver", province: "British Columbia", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { slug: "montreal", name: "Montreal", province: "Quebec", country: "Canada", lat: 45.5017, lng: -73.5673 },
  { slug: "calgary", name: "Calgary", province: "Alberta", country: "Canada", lat: 51.0447, lng: -114.0719 },
  { slug: "edmonton", name: "Edmonton", province: "Alberta", country: "Canada", lat: 53.5461, lng: -113.4938 },
  { slug: "ottawa", name: "Ottawa", province: "Ontario", country: "Canada", lat: 45.4215, lng: -75.6972 },
  { slug: "winnipeg", name: "Winnipeg", province: "Manitoba", country: "Canada", lat: 49.8951, lng: -97.1384 },
  { slug: "new-york", name: "New York", province: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { slug: "los-angeles", name: "Los Angeles", province: "California", country: "USA", lat: 34.0522, lng: -118.2437 },
  { slug: "chicago", name: "Chicago", province: "Illinois", country: "USA", lat: 41.8781, lng: -87.6298 },
  { slug: "london", name: "London", province: "England", country: "UK", lat: 51.5074, lng: -0.1278 },
];

export const CATEGORIES = [
  { id: "all", label: "All Events", icon: "✨" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "concerts", label: "Concerts", icon: "🎸" },
  { id: "parties", label: "Parties", icon: "🎉" },
  { id: "comedy", label: "Comedy", icon: "😂" },
  { id: "performances", label: "Performances", icon: "🎭" },
  { id: "exhibitions", label: "Exhibitions", icon: "🖼️" },
  { id: "food-drinks", label: "Food & Drinks", icon: "🍽️" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "theatre", label: "Theatre", icon: "🎬" },
  { id: "health-wellness", label: "Health & Wellness", icon: "🧘" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "festivals", label: "Festivals", icon: "🎪" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "kids", label: "Kids", icon: "🧸" },
  { id: "business", label: "Business", icon: "💼" },
];

const UNSPLASH_IMAGES = {
  concert1: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80",
  concert2: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  market1: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
  festival1: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  food1: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  art1: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80",
  theatre1: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",
  comedy1: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=600&q=80",
  sports1: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",
  kids1: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
  business1: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
  wellness1: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  exhibition1: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&q=80",
  party1: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80",
  dance1: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80",
};

// Generate events for a given city
export function generateEventsForCity(citySlug: string): Event[] {
  const city = CITIES.find((c) => c.slug === citySlug);
  const cityName = city?.name || citySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const now = new Date();
  const addDays = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };

  const fmt = (date: Date) =>
    date.toLocaleDateString("en-CA", { weekday: "short", day: "numeric", month: "short" });

  const slugify = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  return [
    // Featured / Editor's Pick
    {
      id: `${citySlug}-1`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Summer Music Festival 2026`,
      date: fmt(addDays(5)),
      time: "06:00 PM",
      venue: `${cityName} Amphitheatre`,
      address: `Downtown ${cityName}`,
      category: "concerts",
      subcategory: "Music Festival",
      image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/event-concert-M6egQNxvnP7XiWfnE7wZsB.webp",
      price: "CAD 45",
      interested: 342,
      isFeatured: true,
      isEditorsPick: true,
      tags: ["music", "outdoor", "summer"],
    },
    // Concerts
    {
      id: `${citySlug}-2`,
      slug: "", // Will be set after title is defined
      title: `Rock Night Live in ${cityName}`,
      date: fmt(addDays(3)),
      time: "08:00 PM",
      venue: "The Exchange",
      address: `1696 Scarth St, ${cityName}`,
      category: "concerts",
      subcategory: "Rock",
      image: UNSPLASH_IMAGES.concert1,
      price: "CAD 35",
      interested: 202,
      tags: ["rock", "live-music"],
    },
    {
      id: `${citySlug}-3`,
      slug: "", // Will be set after title is defined
      title: "Jazz & Blues Evening",
      date: fmt(addDays(8)),
      time: "07:30 PM",
      venue: "Conexus Arts Centre",
      address: `200 Lakeshore Dr, ${cityName}`,
      category: "concerts",
      subcategory: "Jazz",
      image: UNSPLASH_IMAGES.concert2,
      price: "CAD 28",
      interested: 156,
      tags: ["jazz", "blues"],
    },
    {
      id: `${citySlug}-4`,
      slug: "", // Will be set after title is defined
      title: "Symphony Orchestra Gala",
      date: fmt(addDays(12)),
      time: "07:00 PM",
      venue: "City Concert Hall",
      address: `${cityName} Arts District`,
      category: "concerts",
      subcategory: "Classical",
      image: UNSPLASH_IMAGES.dance1,
      price: "CAD 55",
      interested: 89,
      tags: ["classical", "orchestra"],
    },
    {
      id: `${citySlug}-5`,
      slug: "", // Will be set after title is defined
      title: "Indie Folk Night",
      date: fmt(addDays(15)),
      time: "08:30 PM",
      venue: "Revival Music Room",
      address: `2224 Dewdney Ave, ${cityName}`,
      category: "concerts",
      subcategory: "Folk",
      image: UNSPLASH_IMAGES.concert1,
      price: "CAD 20",
      interested: 78,
      tags: ["indie", "folk"],
    },
    // Parties
    {
      id: `${citySlug}-6`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Spring Gala 2026`,
      date: fmt(addDays(7)),
      time: "09:00 PM",
      venue: "DoubleTree by Hilton",
      address: `1975 Broad St, ${cityName}`,
      category: "parties",
      subcategory: "Gala",
      image: UNSPLASH_IMAGES.party1,
      price: "CAD 75",
      interested: 116,
      tags: ["gala", "formal"],
    },
    {
      id: `${citySlug}-7`,
      slug: "", // Will be set after title is defined
      title: "St. Patrick's Day Bash",
      date: fmt(addDays(4)),
      time: "07:00 PM",
      venue: "Shannon's Pub and Grill",
      address: `1434 11th Ave, ${cityName}`,
      category: "parties",
      subcategory: "Holiday",
      image: UNSPLASH_IMAGES.festival1,
      price: "Free",
      interested: 230,
      tags: ["st-patricks", "pub"],
    },
    {
      id: `${citySlug}-8`,
      slug: "", // Will be set after title is defined
      title: "80s & 90s Bingo Dance Party",
      date: fmt(addDays(2)),
      time: "07:00 PM",
      venue: "The Lobby",
      address: `2224 Dewdney Ave, ${cityName}`,
      category: "parties",
      subcategory: "Dance",
      image: UNSPLASH_IMAGES.party1,
      price: "CAD 15",
      interested: 30,
      tags: ["80s", "90s", "dance"],
    },
    {
      id: `${citySlug}-9`,
      slug: "", // Will be set after title is defined
      title: "Hispanic Gala Night",
      date: fmt(addDays(18)),
      time: "06:00 PM",
      venue: "G. Marconi Italian Club",
      address: `4646 Wascana Pkwy, ${cityName}`,
      category: "parties",
      subcategory: "Cultural",
      image: UNSPLASH_IMAGES.dance1,
      price: "CAD 40",
      interested: 8,
      tags: ["hispanic", "cultural"],
    },
    // Exhibitions
    {
      id: `${citySlug}-10`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Spring Home Show`,
      date: fmt(addDays(10)),
      time: "10:00 AM",
      venue: "Brandt Centre",
      address: `1700 Elphinstone St, ${cityName}`,
      category: "exhibitions",
      subcategory: "Home & Garden",
      image: UNSPLASH_IMAGES.exhibition1,
      price: "CAD 12",
      interested: 445,
      tags: ["home", "garden", "expo"],
    },
    {
      id: `${citySlug}-11`,
      slug: "", // Will be set after title is defined
      title: "Contemporary Art Exhibition",
      date: fmt(addDays(6)),
      time: "11:00 AM",
      venue: "MacKenzie Art Gallery",
      address: `3475 Albert St, ${cityName}`,
      category: "exhibitions",
      subcategory: "Art",
      image: UNSPLASH_IMAGES.art1,
      price: "Free",
      interested: 67,
      tags: ["art", "contemporary"],
    },
    {
      id: `${citySlug}-12`,
      slug: "", // Will be set after title is defined
      title: "Seniors Spring Expo 2026",
      date: fmt(addDays(14)),
      time: "09:00 AM",
      venue: "Victoria Square Mall",
      address: `2320 22nd Ave, ${cityName}`,
      category: "exhibitions",
      subcategory: "Community",
      image: UNSPLASH_IMAGES.exhibition1,
      price: "Free",
      interested: 34,
      tags: ["seniors", "community"],
    },
    {
      id: `${citySlug}-13`,
      slug: "", // Will be set after title is defined
      title: "Spring Craft & Tradeshow",
      date: fmt(addDays(9)),
      time: "10:00 AM",
      venue: "Turvey Centre",
      address: `3310 Eastgate Dr, ${cityName}`,
      category: "exhibitions",
      subcategory: "Craft",
      image: UNSPLASH_IMAGES.market1,
      price: "CAD 5",
      interested: 112,
      tags: ["craft", "trade"],
    },
    // Food & Drinks
    {
      id: `${citySlug}-14`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Food & Wine Festival`,
      date: fmt(addDays(20)),
      time: "12:00 PM",
      venue: "Wascana Park",
      address: `Wascana Pkwy, ${cityName}`,
      category: "food-drinks",
      subcategory: "Food Festival",
      image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/event-food-8dPN6QDQabJoGL5pdnaFbU.webp",
      price: "CAD 30",
      interested: 289,
      isFeatured: true,
      tags: ["food", "wine", "outdoor"],
    },
    {
      id: `${citySlug}-15`,
      slug: "", // Will be set after title is defined
      title: "Farm to Table Dinner",
      date: fmt(addDays(11)),
      time: "06:30 PM",
      venue: "The Willow on Wascana",
      address: `3000 Wascana Dr, ${cityName}`,
      category: "food-drinks",
      subcategory: "Dining",
      image: UNSPLASH_IMAGES.food1,
      price: "CAD 85",
      interested: 42,
      tags: ["farm-to-table", "dinner"],
    },
    // Festivals
    {
      id: `${citySlug}-16`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Cultural Festival`,
      date: fmt(addDays(25)),
      time: "11:00 AM",
      venue: "Victoria Park",
      address: `Broad St & 12th Ave, ${cityName}`,
      category: "festivals",
      subcategory: "Cultural",
      image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/event-festival-PnL9B2ufMQo2NodFpnxKyn.webp",
      price: "Free",
      interested: 567,
      isFeatured: true,
      tags: ["cultural", "outdoor", "family"],
    },
    {
      id: `${citySlug}-17`,
      slug: "", // Will be set after title is defined
      title: "Spring Gathering Market",
      date: fmt(addDays(16)),
      time: "09:00 AM",
      venue: "Holy Cross Parish Hall",
      address: `315 Douglas Ave E, ${cityName}`,
      category: "festivals",
      subcategory: "Market",
      image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/event-market-E5LJmu3kef6uWy6oxv8cke.webp",
      price: "Free",
      interested: 189,
      tags: ["market", "spring"],
    },
    // Performances
    {
      id: `${citySlug}-18`,
      slug: "", // Will be set after title is defined
      title: "Celtic Woman Live",
      date: fmt(addDays(22)),
      time: "07:30 PM",
      venue: "Conexus Arts Centre",
      address: `200 Lakeshore Dr, ${cityName}`,
      category: "performances",
      subcategory: "Music",
      image: UNSPLASH_IMAGES.theatre1,
      price: "CAD 65",
      interested: 234,
      tags: ["celtic", "music"],
    },
    {
      id: `${citySlug}-19`,
      slug: "", // Will be set after title is defined
      title: "Ballet Spring Showcase",
      date: fmt(addDays(19)),
      time: "07:00 PM",
      venue: "Globe Theatre",
      address: `1801 Scarth St, ${cityName}`,
      category: "performances",
      subcategory: "Dance",
      image: UNSPLASH_IMAGES.dance1,
      price: "CAD 38",
      interested: 91,
      tags: ["ballet", "dance"],
    },
    {
      id: `${citySlug}-20`,
      slug: "", // Will be set after title is defined
      title: "Stand-Up Comedy Night",
      date: fmt(addDays(1)),
      time: "08:00 PM",
      venue: "The Laugh Shop",
      address: `1801 Scarth St, ${cityName}`,
      category: "comedy",
      subcategory: "Stand-Up",
      image: UNSPLASH_IMAGES.comedy1,
      price: "CAD 25",
      interested: 143,
      tags: ["comedy", "stand-up"],
    },
    {
      id: `${citySlug}-21`,
      slug: "", // Will be set after title is defined
      title: "Improv Comedy Showcase",
      date: fmt(addDays(6)),
      time: "07:30 PM",
      venue: "The Artesian",
      address: `2627 13th Ave, ${cityName}`,
      category: "comedy",
      subcategory: "Improv",
      image: UNSPLASH_IMAGES.comedy1,
      price: "CAD 18",
      interested: 67,
      tags: ["improv", "comedy"],
    },
    // Kids
    {
      id: `${citySlug}-22`,
      slug: "", // Will be set after title is defined
      title: "The Kid Expo 2026",
      date: fmt(addDays(13)),
      time: "10:00 AM",
      venue: "Brandt Centre",
      address: `1700 Elphinstone St, ${cityName}`,
      category: "kids",
      subcategory: "Family",
      image: UNSPLASH_IMAGES.kids1,
      price: "CAD 10",
      interested: 321,
      tags: ["kids", "family", "expo"],
    },
    {
      id: `${citySlug}-23`,
      slug: "", // Will be set after title is defined
      title: "Easter Fun Camp",
      date: fmt(addDays(17)),
      time: "09:00 AM",
      venue: "Community Centre",
      address: `${cityName}`,
      category: "kids",
      subcategory: "Camp",
      image: UNSPLASH_IMAGES.kids1,
      price: "CAD 45",
      interested: 78,
      tags: ["easter", "kids", "camp"],
    },
    // Business
    {
      id: `${citySlug}-24`,
      slug: "", // Will be set after title is defined
      title: `${cityName} Business Innovation Summit`,
      date: fmt(addDays(30)),
      time: "09:00 AM",
      venue: "Delta Hotels by Marriott",
      address: `1919 Saskatchewan Dr, ${cityName}`,
      category: "business",
      subcategory: "Conference",
      image: UNSPLASH_IMAGES.business1,
      price: "CAD 199",
      interested: 456,
      isFeatured: true,
      tags: ["business", "innovation", "networking"],
    },
    {
      id: `${citySlug}-25`,
      slug: "", // Will be set after title is defined
      title: "Entrepreneurship Workshop",
      date: fmt(addDays(21)),
      time: "10:00 AM",
      venue: "Innovation Place",
      address: `114 Research Dr, ${cityName}`,
      category: "business",
      subcategory: "Workshop",
      image: UNSPLASH_IMAGES.business1,
      price: "CAD 50",
      interested: 89,
      tags: ["entrepreneurship", "workshop"],
    },
    // Sports
    {
      id: `${citySlug}-26`,
      slug: "", // Will be set after title is defined
      title: "City Marathon 2026",
      date: fmt(addDays(35)),
      time: "07:00 AM",
      venue: "Wascana Park",
      address: `${cityName}`,
      category: "sports",
      subcategory: "Running",
      image: UNSPLASH_IMAGES.sports1,
      price: "CAD 60",
      interested: 892,
      tags: ["marathon", "running"],
    },
    // Health & Wellness
    {
      id: `${citySlug}-27`,
      slug: "", // Will be set after title is defined
      title: "Sunrise Yoga in the Park",
      date: fmt(addDays(0)),
      time: "07:00 AM",
      venue: "Wascana Park",
      address: `${cityName}`,
      category: "health-wellness",
      subcategory: "Yoga",
      image: UNSPLASH_IMAGES.wellness1,
      price: "Free",
      interested: 145,
      tags: ["yoga", "wellness", "outdoor"],
    },
    // Art & Theatre
    {
      id: `${citySlug}-28`,
      slug: "", // Will be set after title is defined
      title: "Shakespeare in the Park",
      date: fmt(addDays(28)),
      time: "07:00 PM",
      venue: "Victoria Park Amphitheatre",
      address: `${cityName}`,
      category: "theatre",
      subcategory: "Shakespeare",
      image: UNSPLASH_IMAGES.theatre1,
      price: "Free",
      interested: 234,
      tags: ["shakespeare", "outdoor", "theatre"],
    },
    {
      id: `${citySlug}-29`,
      slug: "", // Will be set after title is defined
      title: "Local Artists Showcase",
      date: fmt(addDays(23)),
      time: "06:00 PM",
      venue: "Neutral Ground Gallery",
      address: `1856 McIntyre St, ${cityName}`,
      category: "art",
      subcategory: "Gallery",
      image: UNSPLASH_IMAGES.art1,
      price: "Free",
      interested: 56,
      tags: ["art", "local", "gallery"],
    },
    {
      id: `${citySlug}-30`,
      slug: "", // Will be set after title is defined
      title: "Photography Exhibition: Urban Life",
      date: fmt(addDays(26)),
      time: "10:00 AM",
      venue: "Dunlop Art Gallery",
      address: `2311 12th Ave, ${cityName}`,
      category: "art",
      subcategory: "Photography",
      image: UNSPLASH_IMAGES.exhibition1,
      price: "Free",
      interested: 43,
      tags: ["photography", "urban"],
    },
  ].map((event) => ({
    ...event,
    slug: slugify(event.title),
  })) as unknown as Event[];
}

export function getEventsByCategory(events: Event[], category: EventCategory): Event[] {
  if (category === "all") return events;
  return events.filter((e) => e.category === category);
}

export function getEventsByDate(events: Event[], filter: "today" | "tomorrow" | "weekend" | "week"): Event[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return events.filter((e) => {
    // Parse date from "Sat, 14 Mar" format
    const parts = e.date.split(", ");
    if (parts.length < 2) return false;
    const datePart = parts[1]; // "14 Mar"
    const [day, monthStr] = datePart.split(" ");
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = months[monthStr];
    if (month === undefined) return false;
    const year = now.getFullYear();
    const eventDate = new Date(year, month, parseInt(day));

    if (filter === "today") {
      return eventDate.getTime() === today.getTime();
    } else if (filter === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return eventDate.getTime() === tomorrow.getTime();
    } else if (filter === "weekend") {
      const dayOfWeek = today.getDay();
      const daysToSat = (6 - dayOfWeek + 7) % 7;
      const sat = new Date(today);
      sat.setDate(today.getDate() + daysToSat);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      return eventDate >= sat && eventDate <= sun;
    } else if (filter === "week") {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate <= weekEnd;
    }
    return true;
  });
}

export function getFeaturedEvents(events: Event[]): Event[] {
  return events.filter((e) => e.isFeatured);
}

export function getCategoryEvents(events: Event[], category: EventCategory, limit = 4): Event[] {
  return events.filter((e) => e.category === category).slice(0, limit);
}
