import type { Product, Supplier } from "./types";

export const SUPPLIERS: Supplier[] = [
  {
    id: "s-manjunatha",
    name: "Sri Manjunatha Agencies",
    contact: "Prasanna · 98450 •• 214",
    upi: "manjunathaagencies@okhdfcbank",
    leadTimeDays: 2,
    usualPayment: 8500,
    categories: ["Biscuits & Snacks", "Beverages"],
  },
  {
    id: "s-annapoorna",
    name: "Annapoorna Wholesale Traders",
    contact: "Venkatesh · 99001 •• 873",
    upi: "annapoornatraders@oksbi",
    leadTimeDays: 1,
    usualPayment: 12400,
    categories: ["Staples"],
  },
  {
    id: "s-nandini",
    name: "Nandini Dairy Booth Supply",
    contact: "Route 14 · 080 •• 5521",
    upi: "nandiniroute14@canarabank",
    leadTimeDays: 1,
    usualPayment: 3200,
    categories: ["Dairy & Bakery"],
  },
  {
    id: "s-vijaya",
    name: "Vijaya FMCG Distributors",
    contact: "Ashok · 97411 •• 606",
    upi: "vijayafmcg@okicici",
    leadTimeDays: 3,
    usualPayment: 6800,
    categories: ["Home & Personal Care", "Beverages"],
  },
  {
    id: "s-karnataka-foods",
    name: "Karnataka Foods Distributors",
    contact: "Nagesh · 94480 •• 190",
    upi: "kfdistributors@ybl",
    leadTimeDays: 2,
    usualPayment: 4100,
    categories: ["Ready to Cook"],
  },
];

const p = (
  id: string,
  name: string,
  category: Product["category"],
  unit: string,
  price: number,
  cost: number,
  stock: number,
  dailyVelocity: number,
  supplierId: string,
  caseSize: number,
  trendPct: number,
  extra: Partial<Product> = {},
): Product => {
  const supplier = SUPPLIERS.find((s) => s.id === supplierId)!;
  return { id, name, category, unit, price, cost, stock, dailyVelocity, supplierId, caseSize, leadTimeDays: supplier.leadTimeDays, trendPct, ...extra };
};

// Stock and velocity are calibrated: exactly 3 products run out within 5 days (Parle-G, Fortune oil,
// Maggi), Aashirvaad Atta has been out of stock for 3 days, and 28 of 32 products are healthy (87%).
export const SEED_PRODUCTS: Product[] = [
  p("p-parleg", "Parle-G Biscuit", "Biscuits & Snacks", "250 g", 25, 21.5, 54, 18, "s-manjunatha", 48, 6),
  p("p-goodday", "Britannia Good Day Cashew", "Biscuits & Snacks", "100 g", 30, 25.5, 96, 9, "s-manjunatha", 48, 2),
  p("p-maggi", "Maggi 2-Minute Noodles", "Ready to Cook", "70 g", 15, 12.8, 110, 22, "s-manjunatha", 96, 4),
  p("p-atta", "Aashirvaad Atta", "Staples", "5 kg", 285, 248, 0, 4.5, "s-annapoorna", 10, -100, { outOfStockDays: 3 }),
  p("p-sona", "Sona Masoori Rice", "Staples", "25 kg", 1450, 1310, 14, 0.9, "s-annapoorna", 5, 1),
  p("p-oil", "Fortune Sunflower Oil", "Staples", "1 L", 155, 138, 24, 6, "s-annapoorna", 12, 3),
  p("p-toor", "Toor Dal", "Staples", "1 kg", 165, 146, 38, 3.2, "s-annapoorna", 20, -2),
  p("p-milk", "Nandini Toned Milk", "Dairy & Bakery", "500 ml", 26, 24.2, 180, 85, "s-nandini", 60, 1, { dailyReplenished: true }),
  p("p-curd", "Nandini Curd", "Dairy & Bakery", "500 g", 30, 27.4, 60, 26, "s-nandini", 30, 0, { dailyReplenished: true }),
  p("p-salt", "Tata Salt", "Staples", "1 kg", 28, 24, 60, 5, "s-annapoorna", 25, 0),
  p("p-sugar", "Sugar", "Staples", "1 kg", 48, 43, 75, 8, "s-annapoorna", 50, 1),
  p("p-tea", "Brooke Bond Red Label", "Beverages", "250 g", 145, 128, 30, 2.4, "s-vijaya", 24, -1),
  p("p-bru", "Bru Instant Coffee", "Beverages", "50 g", 120, 104, 22, 1.6, "s-vijaya", 24, 2),
  p("p-ragi", "Ragi Flour", "Staples", "1 kg", 75, 64, 40, 3, "s-annapoorna", 20, 5),
  p("p-idli", "MTR Rava Idli Mix", "Ready to Cook", "500 g", 130, 112, 18, 1.4, "s-karnataka-foods", 12, -9),
  p("p-sambar", "MTR Sambar Powder", "Ready to Cook", "100 g", 62, 53, 36, 2.2, "s-karnataka-foods", 24, 0),
  p("p-surf", "Surf Excel Easy Wash", "Home & Personal Care", "1 kg", 140, 123, 28, 2.1, "s-vijaya", 12, -1),
  p("p-vim", "Vim Bar", "Home & Personal Care", "200 g", 22, 18.5, 64, 4.5, "s-vijaya", 48, 0),
  p("p-colgate", "Colgate Strong Teeth", "Home & Personal Care", "100 g", 58, 50, 42, 2.6, "s-vijaya", 36, 1),
  p("p-lifebuoy", "Lifebuoy Soap", "Home & Personal Care", "125 g", 38, 32.5, 70, 5, "s-vijaya", 48, 0),
  p("p-coconut", "Parachute Coconut Oil", "Home & Personal Care", "250 ml", 115, 99, 26, 1.8, "s-vijaya", 24, 2),
  p("p-bhujia", "Haldiram's Bhujia", "Biscuits & Snacks", "200 g", 55, 46, 34, 2.8, "s-karnataka-foods", 24, -6),
  p("p-butter", "Amul Butter", "Dairy & Bakery", "100 g", 58, 52, 20, 2.5, "s-nandini", 20, 0),
  p("p-bread", "Britannia Bread", "Dairy & Bakery", "400 g", 45, 39, 24, 14, "s-nandini", 12, -3, { dailyReplenished: true }),
  p("p-eggs", "Farm Eggs (tray)", "Dairy & Bakery", "30 pcs", 210, 186, 12, 1.5, "s-nandini", 6, 2),
  p("p-jaggery", "Jaggery", "Staples", "1 kg", 70, 60, 30, 2, "s-annapoorna", 20, 0),
  p("p-kurkure", "Kurkure Masala Munch", "Biscuits & Snacks", "90 g", 20, 16.8, 80, 7, "s-manjunatha", 60, -12),
  p("p-coke", "Coca-Cola", "Beverages", "750 ml", 45, 38, 48, 4, "s-manjunatha", 24, -7),
  p("p-bisleri", "Bisleri Water", "Beverages", "1 L", 20, 15.5, 96, 9, "s-manjunatha", 12, 1),
  p("p-agarbatti", "Cycle Agarbatti", "Home & Personal Care", "Pack", 50, 41, 40, 2, "s-vijaya", 24, 0),
  p("p-dettol", "Dettol Soap", "Home & Personal Care", "125 g", 52, 45, 45, 2.5, "s-vijaya", 36, 1),
  p("p-poha", "Poha", "Staples", "500 g", 42, 36, 36, 3, "s-annapoorna", 30, 2),
];

export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id);
