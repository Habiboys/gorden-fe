import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all products (with optional filters)
app.get("/", async (c) => {
  try {
    const category = c.req.query("category");
    const featured = c.req.query("featured");
    const limit = c.req.query("limit");
    
    const products = await kv.getByPrefix("product:");
    
    let filtered = products;
    
    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((p: any) => p.category === category);
    }
    
    // Filter by featured
    if (featured === "true") {
      filtered = filtered.filter((p: any) => p.featured === true);
    }
    
    // Sort by createdAt desc
    filtered.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Limit results
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single product by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const product = await kv.get(`product:${id}`);
    
    if (!product) {
      return c.json({ success: false, error: "Product not found" }, 404);
    }
    
    return c.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new product (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    // Generate ID
    const id = `prod-${Date.now()}`;
    
    const product = {
      id,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description,
      price: body.price,
      comparePrice: body.comparePrice || null,
      category: body.category,
      subcategory: body.subcategory || null,
      images: body.images || [],
      featured: body.featured || false,
      inStock: body.inStock !== undefined ? body.inStock : true,
      stock: body.stock || 0,
      sku: body.sku || id,
      specifications: body.specifications || {},
      colors: body.colors || [],
      sizes: body.sizes || [],
      tags: body.tags || [],
      views: 0,
      sales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`product:${id}`, product);
    
    return c.json({ success: true, data: product }, 201);
  } catch (error: any) {
    console.error("Error creating product:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update product (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`product:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Product not found" }, 404);
    }
    
    const updated = {
      ...existing,
      ...body,
      id, // Keep original ID
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`product:${id}`, updated);
    
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete product (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`product:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Product not found" }, 404);
    }
    
    await kv.del(`product:${id}`);
    
    return c.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Increment view count
app.post("/:id/view", async (c) => {
  try {
    const id = c.req.param("id");
    
    const product = await kv.get(`product:${id}`);
    if (!product) {
      return c.json({ success: false, error: "Product not found" }, 404);
    }
    
    product.views = (product.views || 0) + 1;
    await kv.set(`product:${id}`, product);
    
    return c.json({ success: true, views: product.views });
  } catch (error: any) {
    console.error("Error incrementing view:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
