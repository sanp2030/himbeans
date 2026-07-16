/**
 * Seed — HimBean menu architecture (global standard).
 * Rules encoded here: descriptions ≤ 14 words, max one badge per item,
 * max 3 nudges across the whole menu.
 * Run: pnpm db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const admin = await db.user.upsert({
    where: { email: "admin@himbean.coffee" },
    update: {},
    create: {
      email: "admin@himbean.coffee",
      name: "Ava Sharma",
      role: "ADMIN",
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD ?? "change-me-now", 12),
    },
  });

  const categoryNames = ["Signature Collection", "Iced Signatures", "Espresso Classics", "Cold Brew & Nitro", "Matcha & Tea Lattes", "Pour Over & Filter", "Chocolate & Mocha", "Tea Collection", "Refreshers", "Milk & Wellness", "Frappé Collection", "Limited Reserve", "Bakery", "Retail Coffee"];
  const categories: Record<string, string> = {};
  for (const [i, name] of categoryNames.entries()) {
    const c = await db.category.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      update: { ordering: i },
      create: { slug: name.toLowerCase().replace(/\s+/g, "-"), name, ordering: i },
    });
    categories[name] = c.id;
  }

  type SeedProduct = {
    slug: string; name: string; description: string; price: number; calories: number;
    category: string; badge?: string; nudge?: string; isFeatured?: boolean; isSeasonal?: boolean;
    origin?: string; region?: string; altitudeM?: number; process?: string; variety?: string;
    roastLevel?: string; flavorNotes?: string[]; pairsWith?: string;
    ingredients: string[]; allergens: string[]; dietTags: string[];
  };

  const products: SeedProduct[] = [
    { slug: "altitude-8848", name: "Altitude 8848", price: 9.25, calories: 250, category: "Signature Collection", description: "The flagship — espresso, wild Himalayan honey, brown butter, pink salt, velvety milk. Honey • Caramel • Toasted Butter.", badge: "BEST_SELLER", pairsWith: "Signature Cheesecake", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "summit-latte", name: "Summit Latte", price: 6.95, calories: 220, category: "Signature Collection", description: "Espresso, mountain honey, silky microfoam. Floral • Sweet • Smooth.", badge: "BEST_SELLER", pairsWith: "Almond Croissant", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "himalayan-black", name: "Himalayan Black", price: 4.75, calories: 5, category: "Signature Collection", description: "Long black on Nepal single-origin espresso. Dark Chocolate • Citrus.", badge: "BARISTA_FAVORITE", pairsWith: "Sea Salt Butter Croissant", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "kathmandu-spice-mocha", name: "Kathmandu Spice Mocha", price: 6.75, calories: 290, category: "Signature Collection", description: "Espresso, dark chocolate, cinnamon, cardamom, nutmeg. Chocolate • Warm Spice.", pairsWith: "Cinnamon Roll", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "sherpa-white", name: "Sherpa White", price: 5.95, calories: 180, category: "Signature Collection", description: "Flat white on lightly roasted Nepal coffee. Sweet Milk • Toffee.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "alpine-honey-cappuccino", name: "Alpine Honey Cappuccino", price: 5.95, calories: 190, category: "Signature Collection", description: "Traditional cappuccino finished with a raw honey drizzle.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "silk-road-pistachio-latte", name: "Silk Road Pistachio Latte", price: 7.95, calories: 310, category: "Signature Collection", description: "Pistachio cream, espresso, saffron, steamed milk. The luxury signature.", badge: "BARISTA_FAVORITE", pairsWith: "Pistachio Danish", ingredients: [], allergens: ["dairy", "nuts"], dietTags: ["vegetarian"] },
    { slug: "everest-reserve-latte", name: "Everest Reserve Latte", price: 8.5, calories: 200, category: "Signature Collection", description: "Rotating monthly micro-lot coffee — different every month.", badge: "SEASONAL", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "yak-butter-caramel-latte", name: "Yak Butter Caramel Latte", price: 6.95, calories: 270, category: "Signature Collection", description: "Brown-butter caramel, espresso, steamed milk, sea salt — a nod to Himalayan butter tea, not a copy of it.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "himalayan-vanilla-bean-latte", name: "Himalayan Vanilla Bean Latte", price: 6.5, calories: 230, category: "Signature Collection", description: "Real vanilla bean, espresso, creamy milk. No artificial syrup.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "khumbu-cold-brew", name: "Khumbu Cold Brew", price: 5.95, calories: 25, category: "Iced Signatures", description: "20-hour cold brew, orange peel, chocolate finish.", badge: "BEST_SELLER", pairsWith: "Butter Croissant", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "himalayan-sea-salt-iced-latte", name: "Himalayan Sea Salt Iced Latte", price: 6.25, calories: 210, category: "Iced Signatures", description: "Espresso, cold milk, sea-salt cream, brown sugar.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "glacier-maple-latte", name: "Glacier Maple Latte", price: 6.95, calories: 240, category: "Iced Signatures", description: "Real maple, espresso, cold milk, a light smoked finish.", pairsWith: "Banana Bread", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "alpine-honey-iced-latte", name: "Alpine Honey Iced Latte", price: 6.25, calories: 200, category: "Iced Signatures", description: "Mountain honey, espresso, cold milk.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "sherpa-energy", name: "Sherpa Energy", price: 6.25, calories: 95, category: "Iced Signatures", description: "Espresso tonic with sea buckthorn, orange, sparkling water.", badge: "POPULAR", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "everest-nitro", name: "Everest Nitro", price: 6.75, calories: 140, category: "Iced Signatures", description: "Nitro cold brew, sweet cream, cocoa dust.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "himalayan-coconut-cold-brew", name: "Himalayan Coconut Cold Brew", price: 6.5, calories: 170, category: "Iced Signatures", description: "Cold brew, fresh coconut cream, palm sugar.", ingredients: [], allergens: ["coconut"], dietTags: ["vegan", "gluten-free"] },
    { slug: "yuzu-espresso-tonic", name: "Yuzu Espresso Tonic", price: 6.5, calories: 90, category: "Iced Signatures", description: "Japanese-inspired — espresso, yuzu, premium tonic.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "mango-passion-espresso", name: "Mango Passion Espresso", price: 6.75, calories: 130, category: "Iced Signatures", description: "Espresso, fresh mango, passionfruit, sparkling finish.", badge: "SEASONAL", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "berry-summit-fizz", name: "Berry Summit Fizz", price: 6.25, calories: 110, category: "Iced Signatures", description: "Espresso, mixed berries, lime, sparkling water.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "espresso", name: "Espresso", price: 3.25, calories: 5, category: "Espresso Classics", description: "Double-origin Nepal blend, 25-second pull.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "double-espresso", name: "Double Espresso", price: 3.95, calories: 10, category: "Espresso Classics", description: "Two shots, one cup.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "ristretto", name: "Ristretto", price: 3.5, calories: 5, category: "Espresso Classics", description: "Short, sweet, concentrated.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "lungo", name: "Lungo", price: 3.75, calories: 8, category: "Espresso Classics", description: "Longer pull, gentler body.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "americano", name: "Americano", price: 4.25, calories: 8, category: "Espresso Classics", description: "Espresso over hot water.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "long-black", name: "Long Black", price: 4.25, calories: 8, category: "Espresso Classics", description: "Hot water first, crema intact.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "macchiato", name: "Macchiato", price: 4.5, calories: 25, category: "Espresso Classics", description: "Espresso marked with foam.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "piccolo", name: "Piccolo", price: 4.75, calories: 60, category: "Espresso Classics", description: "A latte in miniature.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "cortado", name: "Cortado", price: 4.95, calories: 90, category: "Espresso Classics", description: "Equal parts espresso and warm milk.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "flat-white", name: "Flat White", price: 5.5, calories: 160, category: "Espresso Classics", description: "Double ristretto under velvet microfoam.", badge: "POPULAR", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "cappuccino", name: "Cappuccino", price: 5.25, calories: 150, category: "Espresso Classics", description: "Classic thirds — espresso, milk, foam.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "latte", name: "Latte", price: 5.5, calories: 190, category: "Espresso Classics", description: "Silky and mild.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "mocha", name: "Mocha", price: 6.0, calories: 260, category: "Espresso Classics", description: "Espresso and real chocolate.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "classic-cold-brew", name: "Classic Cold Brew", price: 5.25, calories: 15, category: "Cold Brew & Nitro", description: "Slow-steeped, naturally sweet.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "nitro-cold-brew", name: "Nitro Cold Brew", price: 5.95, calories: 15, category: "Cold Brew & Nitro", description: "Cascading, creamy, no dairy.", badge: "POPULAR", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "vanilla-bean-cold-brew", name: "Vanilla Bean Cold Brew", price: 5.95, calories: 60, category: "Cold Brew & Nitro", description: "Real Madagascar vanilla.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "orange-cold-brew", name: "Orange Cold Brew", price: 5.75, calories: 40, category: "Cold Brew & Nitro", description: "Orange peel oils, bright finish.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "honey-cold-brew", name: "Honey Cold Brew", price: 5.75, calories: 70, category: "Cold Brew & Nitro", description: "Wild mountain honey.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "coconut-cold-brew", name: "Coconut Cold Brew", price: 6.25, calories: 150, category: "Cold Brew & Nitro", description: "Fresh coconut cream.", ingredients: [], allergens: ["coconut"], dietTags: ["vegan", "gluten-free"] },
    { slug: "salted-caramel-cold-brew", name: "Salted Caramel Cold Brew", price: 6.25, calories: 140, category: "Cold Brew & Nitro", description: "House caramel, pinch of salt.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "mocha-cold-brew", name: "Mocha Cold Brew", price: 6.25, calories: 160, category: "Cold Brew & Nitro", description: "Cold brew meets dark cocoa.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "black-cherry-cold-brew", name: "Black Cherry Cold Brew", price: 6.5, calories: 90, category: "Cold Brew & Nitro", description: "Dark cherry, clean acidity.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "reserve-cold-brew", name: "Reserve Cold Brew", price: 7.5, calories: 15, category: "Cold Brew & Nitro", description: "This month's micro-lot, cold.", badge: "SEASONAL", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "ceremonial-matcha-latte", name: "Ceremonial Matcha Latte", price: 6.25, calories: 180, category: "Matcha & Tea Lattes", description: "Stone-ground ceremonial grade.", badge: "POPULAR", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "strawberry-matcha", name: "Strawberry Matcha", price: 6.75, calories: 210, category: "Matcha & Tea Lattes", description: "Fresh strawberry base, layered.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "mango-matcha", name: "Mango Matcha", price: 6.75, calories: 210, category: "Matcha & Tea Lattes", description: "Ripe mango under whisked matcha.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "honey-matcha", name: "Honey Matcha", price: 6.5, calories: 190, category: "Matcha & Tea Lattes", description: "Softened with mountain honey.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "dirty-matcha", name: "Dirty Matcha", price: 6.95, calories: 190, category: "Matcha & Tea Lattes", description: "A shot of espresso through the green.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "iced-matcha-latte", name: "Iced Matcha Latte", price: 6.25, calories: 170, category: "Matcha & Tea Lattes", description: "Cold, clean, vivid.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "hojicha-latte", name: "Hojicha Latte", price: 6.25, calories: 160, category: "Matcha & Tea Lattes", description: "Roasted tea — toasty, low caffeine.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "genmaicha-latte", name: "Genmaicha Latte", price: 6.0, calories: 150, category: "Matcha & Tea Lattes", description: "Toasted rice green tea.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "london-fog", name: "London Fog", price: 5.75, calories: 150, category: "Matcha & Tea Lattes", description: "Earl Grey, vanilla, steamed milk.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "chai-latte", name: "Chai Latte", price: 5.75, calories: 180, category: "Matcha & Tea Lattes", description: "House-brewed chai concentrate.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "masala-chai", name: "Masala Chai", price: 5.5, calories: 140, category: "Matcha & Tea Lattes", description: "South Asian spice, proper strength.", badge: "BARISTA_FAVORITE", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "golden-turmeric-latte", name: "Golden Turmeric Latte", price: 5.75, calories: 140, category: "Matcha & Tea Lattes", description: "Turmeric, ginger, cinnamon, black pepper.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "beetroot-latte", name: "Beetroot Latte", price: 5.95, calories: 140, category: "Matcha & Tea Lattes", description: "Earthy-sweet, caffeine-free, very pink.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "nepal-washed", name: "Nepal Washed", price: 6.5, calories: 5, category: "Pour Over & Filter", description: "Nuwakot — orange blossom, caramel, cacao. 1,850 m, washed.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "nepal-natural", name: "Nepal Natural", price: 6.75, calories: 5, category: "Pour Over & Filter", description: "Gulmi — strawberry, brown sugar, plum. 2,000 m, natural.", badge: "SEASONAL", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "ethiopia-yirgacheffe", name: "Ethiopia Yirgacheffe", price: 7.0, calories: 5, category: "Pour Over & Filter", description: "Jasmine, bergamot, apricot. 2,100 m, washed heirloom.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "kenya-aa", name: "Kenya AA", price: 7.25, calories: 5, category: "Pour Over & Filter", description: "Blackcurrant, tomato-sweet acidity. 1,800 m, SL28.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "colombia-pink-bourbon", name: "Colombia Pink Bourbon", price: 7.5, calories: 5, category: "Pour Over & Filter", description: "Huila — panela, peach, rose. 1,750 m.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "costa-rica-tarrazú", name: "Costa Rica Tarrazú", price: 7.0, calories: 5, category: "Pour Over & Filter", description: "Honey process — cane sugar, red apple. 1,900 m.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "panama-geisha", name: "Panama Geisha", price: 14.0, calories: 5, category: "Pour Over & Filter", description: "Reserve — jasmine, papaya, silk body. Limited daily pours.", badge: "BEST_SELLER", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "seasonal-guest-origin", name: "Seasonal Guest Origin", price: 7.5, calories: 5, category: "Pour Over & Filter", description: "A visiting roaster or lot — ask the bar what's on.", badge: "SEASONAL", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "classic-mocha", name: "Classic Mocha", price: 6.0, calories: 260, category: "Chocolate & Mocha", description: "Espresso, dark chocolate, milk.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "dark-chocolate-mocha", name: "Dark Chocolate Mocha", price: 6.25, calories: 270, category: "Chocolate & Mocha", description: "70% single-origin dark.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "white-chocolate-mocha", name: "White Chocolate Mocha", price: 6.25, calories: 290, category: "Chocolate & Mocha", description: "Creamy, not cloying.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "hazelnut-mocha", name: "Hazelnut Mocha", price: 6.5, calories: 300, category: "Chocolate & Mocha", description: "House praline.", ingredients: [], allergens: ["dairy", "nuts"], dietTags: ["vegetarian"] },
    { slug: "orange-mocha", name: "Orange Mocha", price: 6.5, calories: 270, category: "Chocolate & Mocha", description: "Candied orange peel.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "sea-salt-mocha", name: "Sea Salt Mocha", price: 6.5, calories: 270, category: "Chocolate & Mocha", description: "Salt sharpens the chocolate.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "mint-mocha", name: "Mint Mocha", price: 6.25, calories: 260, category: "Chocolate & Mocha", description: "Fresh mint, not syrupy.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "campfire-mocha", name: "Campfire Mocha", price: 6.75, calories: 310, category: "Chocolate & Mocha", description: "Smoked marshmallow finish.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "spiced-mocha", name: "Spiced Mocha", price: 6.5, calories: 270, category: "Chocolate & Mocha", description: "The Kathmandu masala blend.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "reserve-mocha", name: "Reserve Mocha", price: 7.25, calories: 270, category: "Chocolate & Mocha", description: "This month's micro-lot under chocolate.", badge: "SEASONAL", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "nepal-first-flush", name: "Nepal First Flush", price: 5.5, calories: 0, category: "Tea Collection", description: "Ilam spring pick — floral, alive.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "nepal-second-flush", name: "Nepal Second Flush", price: 5.25, calories: 0, category: "Tea Collection", description: "Rounder, honeyed.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "himalayan-oolong", name: "Himalayan Oolong", price: 5.75, calories: 0, category: "Tea Collection", description: "Hand-rolled, orchid nose.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "silver-needle-white-tea", name: "Silver Needle White Tea", price: 6.5, calories: 0, category: "Tea Collection", description: "Buds only — delicate.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "jasmine-green-tea", name: "Jasmine Green Tea", price: 4.95, calories: 0, category: "Tea Collection", description: "Scented seven times.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "sencha", name: "Sencha", price: 4.95, calories: 0, category: "Tea Collection", description: "Grassy, umami, clean.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "earl-grey", name: "Earl Grey", price: 4.5, calories: 0, category: "Tea Collection", description: "Proper bergamot.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "english-breakfast", name: "English Breakfast", price: 4.5, calories: 0, category: "Tea Collection", description: "Strong enough for milk.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "peppermint", name: "Peppermint", price: 4.25, calories: 0, category: "Tea Collection", description: "Caffeine-free, cooling.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "chamomile", name: "Chamomile", price: 4.25, calories: 0, category: "Tea Collection", description: "Evening cup.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "hibiscus", name: "Hibiscus", price: 4.5, calories: 0, category: "Tea Collection", description: "Tart, ruby red.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "lemongrass-ginger", name: "Lemongrass Ginger", price: 4.75, calories: 0, category: "Tea Collection", description: "Grown an hour from the café.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "rhododendron-spritz", name: "Rhododendron Spritz", price: 5.95, calories: 90, category: "Refreshers", description: "Nepal's national flower — sparkling rhododendron cordial, citrus, mint.", badge: "BARISTA_FAVORITE", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "yuzu-lemonade", name: "Yuzu Lemonade", price: 5.5, calories: 100, category: "Refreshers", description: "Japanese citrus, hand-pressed.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "himalayan-lemon-soda", name: "Himalayan Lemon Soda", price: 4.95, calories: 80, category: "Refreshers", description: "Pink salt rim optional.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "passionfruit-cooler", name: "Passionfruit Cooler", price: 5.5, calories: 110, category: "Refreshers", description: "Tart and tropical.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "mango-cooler", name: "Mango Cooler", price: 5.5, calories: 120, category: "Refreshers", description: "Ripe mango, lime.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "lychee-spritz", name: "Lychee Spritz", price: 5.75, calories: 110, category: "Refreshers", description: "Floral, sparkling.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "peach-iced-tea", name: "Peach Iced Tea", price: 5.25, calories: 90, category: "Refreshers", description: "House-brewed, real peach.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "berry-hibiscus", name: "Berry Hibiscus", price: 5.5, calories: 100, category: "Refreshers", description: "Ruby, tart, iced.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "cucumber-mint-sparkler", name: "Cucumber Mint Sparkler", price: 5.25, calories: 60, category: "Refreshers", description: "The quiet favorite.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "orange-blossom-soda", name: "Orange Blossom Soda", price: 5.5, calories: 90, category: "Refreshers", description: "Perfumed, light.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "apple-ginger-fizz", name: "Apple Ginger Fizz", price: 5.25, calories: 90, category: "Refreshers", description: "Fresh-pressed apple, ginger bite.", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "vanilla-steamer", name: "Vanilla Steamer", price: 4.5, calories: 180, category: "Milk & Wellness", description: "Warm milk, real vanilla.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "hot-chocolate", name: "Hot Chocolate", price: 5.25, calories: 280, category: "Milk & Wellness", description: "Belgian couverture.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "dark-drinking-chocolate", name: "Dark Drinking Chocolate", price: 6.25, calories: 320, category: "Milk & Wellness", description: "Thick, European style.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "honey-milk", name: "Honey Milk", price: 4.5, calories: 190, category: "Milk & Wellness", description: "Bedtime in a cup.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "turmeric-latte", name: "Turmeric Latte", price: 5.5, calories: 150, category: "Milk & Wellness", description: "Golden and warming.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "rose-latte", name: "Rose Latte", price: 5.75, calories: 170, category: "Milk & Wellness", description: "Damask rose, cardamom.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "lavender-latte", name: "Lavender Latte", price: 5.75, calories: 170, category: "Milk & Wellness", description: "Culinary lavender, light hand.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "black-sesame-latte", name: "Black Sesame Latte", price: 6.0, calories: 210, category: "Milk & Wellness", description: "Nutty, toasted, striking.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "sweet-corn-latte", name: "Sweet Corn Latte", price: 5.95, calories: 200, category: "Milk & Wellness", description: "Seasonal — sweeter than it sounds.", badge: "SEASONAL", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "banana-cinnamon-latte", name: "Banana Cinnamon Latte", price: 5.75, calories: 220, category: "Milk & Wellness", description: "Caramelized banana base.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "altitude-frappé", name: "Altitude Frappé", price: 7.25, calories: 340, category: "Frappé Collection", description: "The 8848 flavors, iced and blended.", badge: "BEST_SELLER", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "mocha-frappé", name: "Mocha Frappé", price: 6.75, calories: 360, category: "Frappé Collection", description: "Chocolate-forward.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "caramel-frappé", name: "Caramel Frappé", price: 6.75, calories: 350, category: "Frappé Collection", description: "House caramel.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "vanilla-bean-frappé", name: "Vanilla Bean Frappé", price: 6.75, calories: 330, category: "Frappé Collection", description: "Flecked with real bean.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "cookies-cream-frappé", name: "Cookies & Cream Frappé", price: 6.95, calories: 390, category: "Frappé Collection", description: "Crumbled house biscuits.", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "matcha-frappé", name: "Matcha Frappé", price: 7.25, calories: 320, category: "Frappé Collection", description: "Ceremonial grade, blended.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "chocolate-brownie-frappé", name: "Chocolate Brownie Frappé", price: 7.25, calories: 410, category: "Frappé Collection", description: "With actual brownie.", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "espresso-frappé", name: "Espresso Frappé", price: 6.5, calories: 280, category: "Frappé Collection", description: "Double shot, blended clean.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "salted-caramel-frappé", name: "Salted Caramel Frappé", price: 6.95, calories: 360, category: "Frappé Collection", description: "Sweet-salt balance.", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "pistachio-frappé", name: "Pistachio Frappé", price: 7.5, calories: 370, category: "Frappé Collection", description: "The Silk Road, frozen.", ingredients: [], allergens: ["dairy", "nuts"], dietTags: ["vegetarian"] },
    { slug: "sea-buckthorn-espresso-spritz", name: "Sea Buckthorn Espresso Spritz", price: 7.5, calories: 110, category: "Limited Reserve", description: "July release — Himalayan sea buckthorn, espresso, sparkling.", badge: "SEASONAL", ingredients: [], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "blueberry-lavender-latte", name: "Blueberry Lavender Latte", price: 7.25, calories: 230, category: "Limited Reserve", description: "July release — wild blueberry, culinary lavender.", badge: "SEASONAL", ingredients: [], allergens: ["dairy"], dietTags: ["vegetarian"] },
    { slug: "sea-salt-butter-croissant", name: "Sea Salt Butter Croissant", price: 4.25, calories: 340, category: "Bakery", description: "Laminated 27 times.", badge: "BEST_SELLER", pairsWith: "Himalayan Black", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "almond-croissant", name: "Almond Croissant", price: 4.5, calories: 420, category: "Bakery", description: "Twice-baked, frangipane heart.", pairsWith: "Summit Latte", ingredients: [], allergens: ["dairy", "nuts", "gluten"], dietTags: ["vegetarian"] },
    { slug: "cinnamon-roll", name: "Cinnamon Roll", price: 4.75, calories: 460, category: "Bakery", description: "Slow-proofed, glazed to order.", pairsWith: "Kathmandu Spice Mocha", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "banana-bread", name: "Banana Bread", price: 3.95, calories: 310, category: "Bakery", description: "Brown-butter crumb.", pairsWith: "Glacier Maple Latte", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "lemon-cake", name: "Lemon Cake", price: 4.5, calories: 380, category: "Bakery", description: "Bright glaze, dense crumb.", pairsWith: "Rift Valley pours", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "pistachio-danish", name: "Pistachio Danish", price: 5.25, calories: 440, category: "Bakery", description: "Laminated, pistachio cream center.", pairsWith: "Silk Road Pistachio Latte", ingredients: [], allergens: ["dairy", "nuts", "gluten"], dietTags: ["vegetarian"] },
    { slug: "chocolate-brownie", name: "Chocolate Brownie", price: 4.25, calories: 410, category: "Bakery", description: "Fudgy, sea-salt top.", pairsWith: "Andes-style cortado", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    { slug: "signature-cheesecake", name: "Signature Cheesecake", price: 5.75, calories: 480, category: "Bakery", description: "Honey-brûléed edge — built for Altitude 8848.", pairsWith: "Altitude 8848", ingredients: [], allergens: ["dairy", "gluten"], dietTags: ["vegetarian"] },
    // 🛍 RETAIL
    { slug: "retail-himalayan-espresso", name: "Himalayan Espresso · 250 g", price: 19.5, calories: 0, category: "Retail Coffee",
      description: "Built for milk — dark chocolate, toasted hazelnut, long finish.",
      origin: "Nepal", region: "Gulmi", altitudeM: 1800, roastLevel: "Medium",
      flavorNotes: ["Dark Chocolate", "Hazelnut"],
      ingredients: ["Roasted arabica"], allergens: [], dietTags: ["vegan", "gluten-free"] },
    { slug: "retail-nuwakot-washed", name: "Nuwakot Washed · 250 g", price: 18.0, calories: 0, category: "Retail Coffee",
      description: "Our most ordered filter, in whole-bean form.",
      badge: "BEST_SELLER",
      origin: "Nepal", region: "Nuwakot", altitudeM: 1650, process: "Washed", variety: "Bourbon",
      roastLevel: "Light-Medium", flavorNotes: ["Orange Blossom", "Caramel", "Cacao"],
      ingredients: ["Roasted arabica"], allergens: [], dietTags: ["vegan", "gluten-free"] },
  ];

  for (const p of products) {
    const { category, ...rest } = p;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, categoryId: categories[category] },
      create: { ...rest, categoryId: categories[category] },
    });
    await db.productOption.createMany({
      data: [
        { productId: product.id, name: "Size", values: [{ label: "Small", priceDelta: 0 }, { label: "Regular", priceDelta: 0.5 }, { label: "Large", priceDelta: 1.0 }] },
        { productId: product.id, name: "Milk", values: [{ label: "Whole", priceDelta: 0 }, { label: "Oat", priceDelta: 0.6 }, { label: "Almond", priceDelta: 0.6 }] },
      ],
      skipDuplicates: true,
    });
  }

  await db.location.upsert({
    where: { slug: "flagship" },
    update: { name: "HimBean — Kathmandu Flagship Roastery" },
    create: {
      slug: "flagship",
      name: "HimBean — Kathmandu Flagship Roastery",
      address: "12 Lantern Row", city: "Kathmandu",
      lat: 27.7172, lng: 85.324, phone: "+977-1-555-0142",
      hours: { mon: { open: "07:00", close: "21:00" }, sun: { open: "08:00", close: "20:00" } },
      parking: true,
      facilities: ["wifi", "outdoor seating", "power outlets", "wheelchair access"],
    },
  });

  // Tracked inventory for bakery + retail (drinks are made to order — untracked)
  const tracked: [string, string, number, number][] = [
    ["sea-salt-butter-croissant", "BAKE-CROIS", 24, 6],
    ["banana-bread", "BAKE-BANAN", 18, 5],
    ["retail-nuwakot-washed", "BEAN-NUWA-250", 40, 8],
    ["retail-himalayan-espresso", "BEAN-ESPR-250", 35, 8],
  ];
  for (const [slug, sku, stock, lowAlert] of tracked) {
    const prod = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (prod) {
      await db.inventoryItem.upsert({
        where: { sku },
        update: { stock },
        create: { productId: prod.id, sku, stock, lowAlert },
      });
    }
  }

  await db.giftCard.upsert({
    where: { code: "HB-GIFT-DEMO" },
    update: {},
    create: { code: "HB-GIFT-DEMO", balance: 25, initial: 25, message: "Seed demo gift card" },
  });

  await db.coupon.upsert({
    where: { code: "FIRSTPOUR" },
    update: {},
    create: { code: "FIRSTPOUR", type: "PERCENT", value: 15, maxUses: 1000 },
  });

  console.log("HimBean seed complete. Admin:", admin.email);
}

main().finally(() => db.$disconnect());
