import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Seed database with initial data
app.post("/", async (c) => {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // const allKeys = await kv.getByPrefix("");
    // await kv.mdel(allKeys.map((item: any) => item.key));
    
    // Seed Categories
    const categories = [
      {
        id: "cat-1",
        name: "Gorden Minimalis",
        slug: "gorden-minimalis",
        description: "Koleksi gorden dengan desain minimalis modern",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
        icon: "layout",
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cat-2",
        name: "Gorden Blackout",
        slug: "gorden-blackout",
        description: "Gorden anti cahaya untuk privasi maksimal",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        icon: "moon",
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cat-3",
        name: "Gorden Vitrase",
        slug: "gorden-vitrase",
        description: "Gorden tipis untuk pencahayaan natural",
        image: "https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=800",
        icon: "sun",
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cat-4",
        name: "Blind",
        slug: "blind",
        description: "Roller blind dan vertical blind modern",
        image: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800",
        icon: "columns",
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    for (const cat of categories) {
      await kv.set(`category:${cat.id}`, cat);
    }
    console.log(`✅ Seeded ${categories.length} categories`);
    
    // Seed Products
    const products = [
      {
        id: "prod-1",
        name: "Gorden Blackout Premium Solar Screw",
        slug: "gorden-blackout-premium-solar-screw",
        description: "Gorden blackout dengan teknologi Solar Screw yang dapat memblokir 99% cahaya. Material premium dengan ketahanan tinggi dan mudah dibersihkan. Cocok untuk kamar tidur, ruang home theater, atau ruangan yang membutuhkan privasi maksimal.",
        price: 223200,
        comparePrice: 280000,
        category: "cat-2",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200"],
        featured: true,
        inStock: true,
        stock: 50,
        sku: "GRD-BLK-001",
        specifications: {
          material: "Polyester Premium",
          width: "Custom (up to 3m)",
          lightBlocking: "99%",
          careInstructions: "Dry clean recommended",
        },
        colors: ["Hitam", "Abu-abu", "Krem", "Coklat"],
        sizes: ["Custom"],
        tags: ["blackout", "premium", "solar-screw"],
        views: 245,
        sales: 28,
        rating: 4.8,
        reviewCount: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-2",
        name: "Gorden Minimalis Linen Natural",
        slug: "gorden-minimalis-linen-natural",
        description: "Gorden minimalis dengan material linen alami yang memberikan kesan elegan dan natural. Tekstur lembut dengan ventilasi udara yang baik. Sempurna untuk ruang tamu atau ruang keluarga dengan konsep minimalis modern.",
        price: 156000,
        comparePrice: 195000,
        category: "cat-1",
        images: ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200"],
        featured: true,
        inStock: true,
        stock: 75,
        sku: "GRD-MIN-002",
        specifications: {
          material: "Linen Natural",
          width: "Custom (up to 2.5m)",
          lightBlocking: "40%",
          careInstructions: "Machine wash cold",
        },
        colors: ["Putih", "Krem", "Abu-abu Muda"],
        sizes: ["Custom"],
        tags: ["minimalis", "linen", "natural"],
        views: 189,
        sales: 42,
        rating: 4.9,
        reviewCount: 23,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-3",
        name: "Vitrase Sheer White Premium",
        slug: "vitrase-sheer-white-premium",
        description: "Vitrase premium dengan material sheer yang sangat halus dan transparan. Memberikan privasi tanpa menghalangi cahaya natural. Cocok dikombinasikan dengan gorden tebal untuk hasil maksimal.",
        price: 85000,
        comparePrice: 120000,
        category: "cat-3",
        images: ["https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=1200"],
        featured: false,
        inStock: true,
        stock: 100,
        sku: "GRD-VTR-003",
        specifications: {
          material: "Sheer Polyester",
          width: "Custom (up to 3m)",
          lightBlocking: "10%",
          careInstructions: "Hand wash gentle",
        },
        colors: ["Putih", "Broken White", "Cream"],
        sizes: ["Custom"],
        tags: ["vitrase", "sheer", "transparan"],
        views: 156,
        sales: 67,
        rating: 4.7,
        reviewCount: 34,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-4",
        name: "Roller Blind Blackout Modern",
        slug: "roller-blind-blackout-modern",
        description: "Roller blind dengan sistem blackout yang praktis dan modern. Mudah dioperasikan dengan sistem chain atau remote. Cocok untuk kantor, ruang meeting, atau bedroom dengan desain contemporary.",
        price: 195000,
        comparePrice: 250000,
        category: "cat-4",
        images: ["https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=1200"],
        featured: true,
        inStock: true,
        stock: 40,
        sku: "BLD-RLR-004",
        specifications: {
          material: "PVC Blackout",
          width: "Custom (up to 2m)",
          lightBlocking: "95%",
          operationSystem: "Chain / Remote",
        },
        colors: ["Putih", "Abu-abu", "Hitam", "Beige"],
        sizes: ["Custom"],
        tags: ["blind", "roller", "modern"],
        views: 201,
        sales: 35,
        rating: 4.6,
        reviewCount: 18,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    for (const prod of products) {
      await kv.set(`product:${prod.id}`, prod);
    }
    console.log(`✅ Seeded ${products.length} products`);
    
    // Seed Sample Calculator Lead
    const sampleLead = {
      id: "lead-sample-1",
      name: "Budi Santoso",
      phone: "081234567890",
      email: "budi@email.com",
      calculatorType: "Smokering",
      estimatedPrice: 2856000,
      calculation: {
        product: {
          name: "Gorden Blackout Premium Solar Screw",
          sku: "GRD-BLK-001",
          category: "Gorden Blackout"
        },
        dimensions: {
          width: 3,
          height: 2.5,
          area: 7.5
        },
        components: [
          {
            name: "Kain Gorden",
            type: "Premium Blackout Solar Screw",
            quantity: 7.5,
            unit: "m²",
            pricePerUnit: 223200,
            subtotal: 1674000
          },
          {
            name: "Rel Gorden",
            type: "Aluminium Single Track 3m",
            quantity: 1,
            unit: "set",
            pricePerUnit: 450000,
            subtotal: 450000
          },
          {
            name: "Tassel",
            type: "Tassel Premium Gold",
            quantity: 2,
            unit: "pcs",
            pricePerUnit: 125000,
            subtotal: 250000
          },
          {
            name: "Hook",
            type: "Hook Besi Premium",
            quantity: 30,
            unit: "pcs",
            pricePerUnit: 8000,
            subtotal: 240000
          }
        ],
        installation: {
          type: "Ukur & Pasang Teknisi",
          price: 350000
        },
        notes: "Mohon konfirmasi untuk jadwal pemasangan di weekend"
      },
      status: "new",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`calculator-lead:${sampleLead.id}`, sampleLead);
    console.log("✅ Seeded sample calculator lead");
    
    // Seed Sample Article
    const sampleArticle = {
      id: "article-1",
      title: "10 Tips Memilih Gorden yang Tepat untuk Rumah Minimalis",
      slug: "10-tips-memilih-gorden-rumah-minimalis",
      excerpt: "Rumah minimalis membutuhkan gorden yang tepat untuk menciptakan kesan elegan dan tidak berlebihan. Simak tips lengkapnya di sini.",
      content: `<p>Rumah minimalis kini menjadi pilihan banyak orang karena desainnya yang simpel namun elegan...</p>`,
      category: "tips",
      categoryLabel: "Tips & Trik",
      author: "Admin Amagriya",
      publishDate: new Date().toLocaleDateString("id-ID"),
      readTime: "5 menit",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
      featured: true,
      views: 0,
      status: "published",
      tags: ["tips", "minimalis", "gorden"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`article:${sampleArticle.id}`, sampleArticle);
    console.log("✅ Seeded sample article");
    
    // Seed Sample Gallery Items
    const sampleGalleryItems = [
      {
        id: "gallery-1",
        title: "Apartemen Modern Jakarta Selatan",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
        category: "Apartemen",
        type: "Gorden Smokering",
        location: "Jakarta Selatan",
        description: "Pemasangan gorden smokering premium untuk apartemen modern di kawasan Jakarta Selatan",
        date: new Date().toLocaleDateString("id-ID"),
        featured: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "gallery-2",
        title: "Rumah Minimalis Bintaro",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
        category: "Rumah Tinggal",
        type: "Gorden Blackout",
        location: "Bintaro, Tangerang Selatan",
        description: "Instalasi gorden blackout untuk rumah minimalis modern",
        date: new Date().toLocaleDateString("id-ID"),
        featured: true,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "gallery-3",
        title: "Kantor Corporate BSD",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
        category: "Kantor",
        type: "Blind Roller",
        location: "BSD City",
        description: "Pemasangan blind roller untuk kantor corporate di BSD",
        date: new Date().toLocaleDateString("id-ID"),
        featured: false,
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    for (const item of sampleGalleryItems) {
      await kv.set(`gallery:${item.id}`, item);
    }
    console.log(`✅ Seeded ${sampleGalleryItems.length} sample gallery items`);
    
    console.log("🎉 Database seeding completed successfully!");
    
    return c.json({
      success: true,
      message: "Database seeded successfully",
      seeded: {
        categories: categories.length,
        products: products.length,
        calculatorLeads: 1,
        articles: 1,
        gallery: sampleGalleryItems.length,
      }
    });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;