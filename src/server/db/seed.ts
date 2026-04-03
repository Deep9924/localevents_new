import { db } from "./index";
import { cities, categories } from "./schema";

async function seed() {
  console.log("🌱 Seeding cities...");
  await db.insert(cities).values([
    { slug: "regina", name: "Regina", province: "Saskatchewan", country: "Canada", lat: 50.4452, lng: -104.6189 },
    { slug: "saskatoon", name: "Saskatoon", province: "Saskatchewan", country: "Canada", lat: 52.1332, lng: -106.6700 },
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
  ]).onDuplicateKeyUpdate({ set: { name: cities.name } });

  console.log("🌱 Seeding categories...");
  await db.insert(categories).values([
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
  ]).onDuplicateKeyUpdate({ set: { label: categories.label } });

  console.log("✅ Seeding completed!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
