import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all categories
app.get("/", async (c) => {
  try {
    const categories = await kv.getByPrefix("category:");
    
    // Sort by name
    categories.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    return c.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single category
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const category = await kv.get(`category:${id}`);
    
    if (!category) {
      return c.json({ success: false, error: "Category not found" }, 404);
    }
    
    return c.json({ success: true, data: category });
  } catch (error: any) {
    console.error("Error fetching category:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create category (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    const id = `cat-${Date.now()}`;
    
    const category = {
      id,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description || "",
      image: body.image || "",
      icon: body.icon || "",
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`category:${id}`, category);
    
    return c.json({ success: true, data: category }, 201);
  } catch (error: any) {
    console.error("Error creating category:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update category (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`category:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Category not found" }, 404);
    }
    
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`category:${id}`, updated);
    
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete category (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`category:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Category not found" }, 404);
    }
    
    await kv.del(`category:${id}`);
    
    return c.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
