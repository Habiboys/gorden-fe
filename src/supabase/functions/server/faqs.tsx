import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all FAQs
app.get("/", async (c) => {
  try {
    const category = c.req.query("category");
    
    let faqs = await kv.getByPrefix("faq:");
    
    // Filter by category if provided
    if (category) {
      faqs = faqs.filter((faq: any) => faq.category === category);
    }
    
    // Sort by order (ascending)
    faqs.sort((a: any, b: any) => a.order - b.order);
    
    return c.json({ success: true, data: faqs });
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get FAQ by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const faq = await kv.get(`faq:${id}`);
    
    if (!faq) {
      return c.json({ success: false, error: "FAQ not found" }, 404);
    }
    
    return c.json({ success: true, data: faq });
  } catch (error: any) {
    console.error(`Error fetching FAQ ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new FAQ (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { question, answer } = body;
    
    if (!question || !answer) {
      return c.json(
        { success: false, error: "Question and answer are required" },
        400
      );
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const faq = {
      id,
      question,
      answer,
      category: body.category || 'general',
      order: body.order || 0,
      active: body.active !== undefined ? body.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`faq:${id}`, faq);
    
    return c.json({ success: true, data: faq }, 201);
  } catch (error: any) {
    console.error("Error creating FAQ:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update FAQ (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingFaq = await kv.get(`faq:${id}`);
    if (!existingFaq) {
      return c.json({ success: false, error: "FAQ not found" }, 404);
    }
    
    const updatedFaq = {
      ...existingFaq,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`faq:${id}`, updatedFaq);
    
    return c.json({ success: true, data: updatedFaq });
  } catch (error: any) {
    console.error(`Error updating FAQ ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete FAQ (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingFaq = await kv.get(`faq:${id}`);
    if (!existingFaq) {
      return c.json({ success: false, error: "FAQ not found" }, 404);
    }
    
    await kv.del(`faq:${id}`);
    
    return c.json({ success: true, message: "FAQ deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting FAQ ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
