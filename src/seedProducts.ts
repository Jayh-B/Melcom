import { db } from './firebase';
import { collection, setDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Product } from './types';

const categories = [
  "Furniture",
  "Electronics & Appliances",
  "Mobiles & Computers",
  "Sports & Fitness",
  "Supermarket",
  "Toys & Entertainment"
];

const productTemplates: Record<string, string[]> = {
  "Furniture": ["L-Shape Sofa", "Office Desk", "Executive Chair", "King Size Bed", "Wardrobe", "Dining Table", "Coffee Table", "Bookshelf"],
  "Electronics & Appliances": ["Smart TV 55\"", "Split Air Conditioner", "Front Load Washing Machine", "Microwave Oven", "Double Door Refrigerator", "Electric Kettle", "Blender", "Iron"],
  "Mobiles & Computers": ["Smartphone", "Laptop", "Tablet", "Wireless Mouse", "Keyboard", "Headphones", "Power Bank", "Monitor"],
  "Sports & Fitness": ["Treadmill", "Dumbbells Set", "Yoga Mat", "Exercise Bike", "Football", "Basketball", "Tennis Racket", "Jump Rope"],
  "Supermarket": ["Basmati Rice 5kg", "Cooking Oil 5L", "Milk Powder", "Detergent Powder", "Hand Wash", "Body Lotion", "Fruit Juice", "Pasta"],
  "Toys & Entertainment": ["Lego Set", "Remote Control Car", "Board Game", "Doll House", "Puzzle", "Action Figure", "Soft Toy", "Building Blocks"]
};

const brands = ["Samsung", "LG", "Sony", "Hisense", "Philips", "Panasonic", "Midea", "Nasco", "Bruhm", "Akai", "Apple", "HP", "Dell", "Logitech", "Nike", "Adidas", "Puma", "Nestle", "Unilever", "P&G"];

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;

  for (let i = 0; i < 300; i++) {
    const category = categories[i % categories.length];
    const templates = productTemplates[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const name = `${brand} ${template}`;
    const id = `MLC-${idCounter.toString().padStart(4, '0')}`;
    const sku = `SKU-${idCounter.toString().padStart(4, '0')}`;
    
    let price = 0;
    if (category === "Furniture") price = Math.floor(Math.random() * 5000) + 500;
    else if (category === "Electronics & Appliances") price = Math.floor(Math.random() * 8000) + 200;
    else if (category === "Mobiles & Computers") price = Math.floor(Math.random() * 10000) + 100;
    else if (category === "Sports & Fitness") price = Math.floor(Math.random() * 3000) + 50;
    else if (category === "Supermarket") price = Math.floor(Math.random() * 500) + 10;
    else if (category === "Toys & Entertainment") price = Math.floor(Math.random() * 1000) + 20;

    const stock = Math.floor(Math.random() * 100) + 5;
    
    const variations = [];
    if (category === "Furniture" || category === "Electronics & Appliances") {
      variations.push({ name: "Color", options: ["Black", "Silver", "White", "Grey"] });
    } else if (category === "Supermarket") {
      variations.push({ name: "Size", options: ["Small", "Medium", "Large"] });
    } else if (category === "Mobiles & Computers") {
      variations.push({ name: "Storage", options: ["64GB", "128GB", "256GB", "512GB"] });
    }

    // Clean up keywords for better image matching
    const cleanTemplate = template.split(' ')[0].toLowerCase(); // Use the first word for better matching
    const imageKeyword = `${category.split(' ')[0].toLowerCase()},${cleanTemplate}`;
    
    products.push({
      id,
      sku,
      name,
      description: `High quality ${name} from Melcom Ghana. Perfect for your home and office needs. Durable and reliable.`,
      price,
      stock,
      category,
      image: `https://loremflickr.com/600/600/${imageKeyword}?lock=${idCounter}`,
      variations: variations.length > 0 ? variations : undefined
    });

    idCounter++;
  }

  return products;
};

export const clearProductsFromFirestore = async () => {
  const snapshot = await getDocs(collection(db, "products"));
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

export const seedProductsToFirestore = async () => {
  const products = generateProducts();
  console.log(`Starting to seed ${products.length} products...`);
  
  for (const product of products) {
    try {
      await setDoc(doc(db, "products", product.id), product);
      console.log(`Seeded: ${product.name}`);
    } catch (error) {
      console.error(`Error seeding ${product.name}:`, error);
    }
  }
  
  console.log("Seeding complete!");
};
