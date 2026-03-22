import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const cities = [
  { slug: "regina", name: "Regina" },
  { slug: "toronto", name: "Toronto" },
  { slug: "vancouver", name: "Vancouver" },
  { slug: "montreal", name: "Montreal" },
  { slug: "calgary", name: "Calgary" },
  { slug: "edmonton", name: "Edmonton" },
  { slug: "ottawa", name: "Ottawa" },
  { slug: "winnipeg", name: "Winnipeg" },
  { slug: "new-york", name: "New York" },
  { slug: "los-angeles", name: "Los Angeles" },
  { slug: "chicago", name: "Chicago" },
  { slug: "london", name: "London" },
];

const eventTemplates = [
  {
    title: "Jazz Night at the Local Club",
    category: "concerts",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop",
    price: "CAD 25",
    tags: ["jazz", "music", "live"],
    description: "Experience an evening of smooth jazz with local musicians.",
  },
  {
    title: "Summer Music Festival",
    category: "festivals",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop",
    price: "CAD 45",
    tags: ["music", "outdoor", "summer"],
    description: "Join thousands of music lovers for a day of live performances.",
  },
  {
    title: "Comedy Show Extravaganza",
    category: "comedy",
    image: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=600&q=80",
    price: "CAD 30",
    tags: ["comedy", "entertainment", "fun"],
    description: "Laugh out loud with top comedians from around the region.",
  },
  {
    title: "Art Exhibition Opening",
    category: "exhibitions",
    image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80",
    price: "Free",
    tags: ["art", "culture", "exhibition"],
    description: "Discover contemporary art from emerging local artists.",
  },
  {
    title: "Food & Wine Tasting",
    category: "food-drinks",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    price: "CAD 60",
    tags: ["food", "wine", "tasting"],
    description: "Indulge in gourmet cuisine paired with fine wines.",
  },
  {
    title: "Theatre Performance",
    category: "theatre",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",
    price: "CAD 40",
    tags: ["theatre", "drama", "performance"],
    description: "A captivating theatrical performance you won't forget.",
  },
  {
    title: "Yoga & Wellness Retreat",
    category: "health-wellness",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    price: "CAD 35",
    tags: ["yoga", "wellness", "health"],
    description: "Find inner peace and rejuvenate your mind and body.",
  },
  {
    title: "Sports Tournament",
    category: "sports",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",
    price: "CAD 20",
    tags: ["sports", "tournament", "competition"],
    description: "Watch thrilling matches and cheer for your favorite teams.",
  },
  {
    title: "Kids Fun Day",
    category: "kids",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    price: "CAD 15",
    tags: ["kids", "family", "fun"],
    description: "A day full of games, activities, and entertainment for children.",
  },
  {
    title: "Business Networking Event",
    category: "business",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
    price: "CAD 50",
    tags: ["business", "networking", "professional"],
    description: "Connect with industry leaders and expand your professional network.",
  },
  {
    title: "Dance Party Night",
    category: "parties",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80",
    price: "CAD 20",
    tags: ["dance", "party", "music"],
    description: "Dance the night away with DJ and live music performances.",
  },
  {
    title: "Educational Workshop",
    category: "education",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
    price: "CAD 40",
    tags: ["education", "workshop", "learning"],
    description: "Learn new skills from industry experts in an interactive setting.",
  },
];

const venues = [
  "The Grand Hall",
  "City Center Arena",
  "Downtown Theatre",
  "Riverside Park",
  "Convention Center",
  "Music Venue",
  "Community Center",
  "Amphitheatre",
  "Cultural Center",
  "Sports Complex",
];

const times = ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 AM", "02:00 PM"];

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function seedEvents() {
  try {
    console.log("Starting comprehensive event seeding...");

    // Clear existing events
    await connection.execute("DELETE FROM events");
    console.log("✓ Cleared existing events");

    const allEvents = [];
    let eventId = 1;

    // Generate events for each city
    for (const city of cities) {
      console.log(`\nGenerating events for ${city.name}...`);

      // Generate 8-10 events per city
      const eventsPerCity = 8 + Math.floor(Math.random() * 3);

      for (let i = 0; i < eventsPerCity; i++) {
        const template = eventTemplates[i % eventTemplates.length];
        const venue = venues[Math.floor(Math.random() * venues.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        const daysFromNow = Math.floor(Math.random() * 30) + 1;
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        const dateStr = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        const title = `${template.title} in ${city.name}`;
        const slug = `${city.slug}-${generateSlug(template.title)}-${i}`;
        const id = `${city.slug}-event-${i}`;

        const event = {
          id,
          title,
          description: template.description,
          image: template.image,
          date: dateStr,
          time,
          venue: `${venue} - ${city.name}`,
          city: city.name,
          citySlug: city.slug,
          category: template.category,
          price: template.price,
          interested: Math.floor(Math.random() * 500) + 50,
          tags: JSON.stringify(template.tags),
          slug,
          isFeatured: i === 0 ? 1 : 0,
        };

        allEvents.push(event);
      }
    }

    // Insert all events
    console.log(`\nInserting ${allEvents.length} events into database...`);

    for (const event of allEvents) {
      await connection.execute(
        `INSERT INTO events (id, title, description, image, date, time, venue, city, citySlug, category, price, interested, tags, slug, isFeatured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.title,
          event.description,
          event.image,
          event.date,
          event.time,
          event.venue,
          event.city,
          event.citySlug,
          event.category,
          event.price,
          event.interested,
          event.tags,
          event.slug,
          event.isFeatured,
        ]
      );
    }

    console.log(`\n✅ Successfully seeded ${allEvents.length} events!`);

    // Show summary by city
    const [summary] = await connection.execute(
      "SELECT city, COUNT(*) as count FROM events GROUP BY city ORDER BY city"
    );
    console.log("\nEvents by city:");
    summary.forEach((row) => {
      console.log(`  ${row.city}: ${row.count} events`);
    });
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

await seedEvents();
