#!/usr/bin/env node
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import schema using dynamic import
const { events } = await import("./drizzle/schema.ts", { assert: { type: "module" } });

// Static events data
const staticEventsData = [
  // Regina
  {
    id: "regina-rock-night",
    title: "Rock Night Live in Regina",
    description: "Join us for an unforgettable experience at Rock Night Live in Regina!",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop",
    date: "Mar 12",
    time: "08:00 PM",
    venue: "The Exchange",
    city: "Regina",
    citySlug: "regina",
    category: "concerts",
    price: "CAD 35",
    interested: 202,
    tags: JSON.stringify(["rock", "music", "live"]),
    slug: "rock-night-live-in-regina",
    isFeatured: 0,
  },
  {
    id: "regina-summer-festival",
    title: "Regina Summer Music Festival 2026",
    description: "Join us for an unforgettable experience at Regina Summer Music Festival 2026!",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop",
    date: "Mar 14",
    time: "06:00 PM",
    venue: "Regina Amphitheatre",
    city: "Regina",
    citySlug: "regina",
    category: "festivals",
    price: "CAD 45",
    interested: 342,
    tags: JSON.stringify(["music", "outdoor", "summer"]),
    slug: "regina-summer-music-festival-2026",
    isFeatured: 1,
  },
  // Toronto
  {
    id: "toronto-rock-night",
    title: "Rock Night Live in Toronto",
    description: "Join us for an unforgettable experience at Rock Night Live in Toronto!",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop",
    date: "Mar 12",
    time: "08:00 PM",
    venue: "The Exchange",
    city: "Toronto",
    citySlug: "toronto",
    category: "concerts",
    price: "CAD 35",
    interested: 202,
    tags: JSON.stringify(["rock", "music", "live"]),
    slug: "rock-night-live-in-toronto",
    isFeatured: 0,
  },
  {
    id: "toronto-summer-festival",
    title: "Toronto Summer Music Festival 2026",
    description: "Join us for an unforgettable experience at Toronto Summer Music Festival 2026!",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop",
    date: "Mar 14",
    time: "06:00 PM",
    venue: "Toronto Amphitheatre",
    city: "Toronto",
    citySlug: "toronto",
    category: "festivals",
    price: "CAD 45",
    interested: 342,
    tags: JSON.stringify(["music", "outdoor", "summer"]),
    slug: "toronto-summer-music-festival-2026",
    isFeatured: 1,
  },
  // Vancouver
  {
    id: "vancouver-rock-night",
    title: "Rock Night Live in Vancouver",
    description: "Join us for an unforgettable experience at Rock Night Live in Vancouver!",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop",
    date: "Mar 12",
    time: "08:00 PM",
    venue: "The Exchange",
    city: "Vancouver",
    citySlug: "vancouver",
    category: "concerts",
    price: "CAD 35",
    interested: 202,
    tags: JSON.stringify(["rock", "music", "live"]),
    slug: "rock-night-live-in-vancouver",
    isFeatured: 0,
  },
  {
    id: "vancouver-summer-festival",
    title: "Vancouver Summer Music Festival 2026",
    description: "Join us for an unforgettable experience at Vancouver Summer Music Festival 2026!",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop",
    date: "Mar 14",
    time: "06:00 PM",
    venue: "Vancouver Amphitheatre",
    city: "Vancouver",
    citySlug: "vancouver",
    category: "festivals",
    price: "CAD 45",
    interested: 342,
    tags: JSON.stringify(["music", "outdoor", "summer"]),
    slug: "vancouver-summer-music-festival-2026",
    isFeatured: 1,
  },
  // New York
  {
    id: "newyork-rock-night",
    title: "Rock Night Live in New York",
    description: "Join us for an unforgettable experience at Rock Night Live in New York!",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop",
    date: "Mar 12",
    time: "08:00 PM",
    venue: "The Exchange",
    city: "New York",
    citySlug: "new-york",
    category: "concerts",
    price: "CAD 35",
    interested: 202,
    tags: JSON.stringify(["rock", "music", "live"]),
    slug: "rock-night-live-in-new-york",
    isFeatured: 0,
  },
  {
    id: "newyork-summer-festival",
    title: "New York Summer Music Festival 2026",
    description: "Join us for an unforgettable experience at New York Summer Music Festival 2026!",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop",
    date: "Mar 14",
    time: "06:00 PM",
    venue: "New York Amphitheatre",
    city: "New York",
    citySlug: "new-york",
    category: "festivals",
    price: "CAD 45",
    interested: 342,
    tags: JSON.stringify(["music", "outdoor", "summer"]),
    slug: "new-york-summer-music-festival-2026",
    isFeatured: 1,
  },
];

async function seedEvents() {
  try {
    console.log("Starting to seed events...");
    
    for (const event of staticEventsData) {
      await db.insert(events).values(event);
    }
    
    console.log(`✅ Successfully seeded ${staticEventsData.length} events!`);
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    await connection.end();
    process.exit(1);
  }
}

seedEvents();
