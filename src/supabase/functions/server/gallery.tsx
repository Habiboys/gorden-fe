import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all gallery items with optional filtering
app.get("/", async (c) => {
  try {
    const category = c.req.query("category");
    const featured = c.req.query("featured");
    
    let galleryItems = await kv.getByPrefix("gallery:");
    
    // Filter by category
    if (category && category !== "all") {
      galleryItems = galleryItems.filter((item: any) => item.category === category);
    }
    
    // Filter by featured
    if (featured === "true") {
      galleryItems = galleryItems.filter((item: any) => item.featured === true);
    }
    
    // Sort by order (ascending) and then by createdAt (descending)
    galleryItems.sort((a: any, b: any) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return c.json({ success: true, data: galleryItems });
  } catch (error: any) {
    console.error("Error fetching gallery items:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get gallery item by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const galleryItem = await kv.get(`gallery:${id}`);
    
    if (!galleryItem) {
      return c.json({ success: false, error: "Gallery item not found" }, 404);
    }
    
    return c.json({ success: true, data: galleryItem });
  } catch (error: any) {
    console.error(`Error fetching gallery item ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new gallery item (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title, image, category, type, location } = body;
    
    if (!title || !image || !category) {
      return c.json(
        { success: false, error: "Title, image, and category are required" },
        400
      );
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const galleryItem = {
      id,
      title,
      image,
      category,
      type: type || '',
      location: location || '',
      description: body.description || '',
      date: body.date || new Date().toISOString().split('T')[0],
      featured: body.featured || false,
      order: body.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`gallery:${id}`, galleryItem);
    
    return c.json({ success: true, data: galleryItem }, 201);
  } catch (error: any) {
    console.error("Error creating gallery item:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update gallery item (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingItem = await kv.get(`gallery:${id}`);
    if (!existingItem) {
      return c.json({ success: false, error: "Gallery item not found" }, 404);
    }
    
    const updatedItem = {
      ...existingItem,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`gallery:${id}`, updatedItem);
    
    return c.json({ success: true, data: updatedItem });
  } catch (error: any) {
    console.error(`Error updating gallery item ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete gallery item (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingItem = await kv.get(`gallery:${id}`);
    if (!existingItem) {
      return c.json({ success: false, error: "Gallery item not found" }, 404);
    }
    
    await kv.del(`gallery:${id}`);
    
    return c.json({ success: true, message: "Gallery item deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting gallery item ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
