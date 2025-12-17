import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all articles (with filters)
app.get("/", async (c) => {
  try {
    const category = c.req.query("category");
    const featured = c.req.query("featured");
    const limit = c.req.query("limit");
    const search = c.req.query("search");
    
    const articles = await kv.getByPrefix("article:");
    
    let filtered = articles;
    
    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((a: any) => a.category === category);
    }
    
    // Filter by featured
    if (featured === "true") {
      filtered = filtered.filter((a: any) => a.featured === true);
    }
    
    // Search in title and excerpt
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((a: any) => 
        a.title.toLowerCase().includes(searchLower) ||
        a.excerpt.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by publish date desc
    filtered.sort((a: any, b: any) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    // Limit results
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get article by slug
app.get("/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const articles = await kv.getByPrefix("article:");
    const article = articles.find((a: any) => a.slug === slug);
    
    if (!article) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }
    
    return c.json({ success: true, data: article });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create article (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    const id = `article-${Date.now()}`;
    
    const article = {
      id,
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      categoryLabel: body.categoryLabel,
      author: body.author || "Admin Amagriya",
      publishDate: body.publishDate || new Date().toLocaleDateString("id-ID"),
      readTime: body.readTime || "5 menit",
      image: body.image,
      featured: body.featured || false,
      views: 0,
      status: body.status || "published",
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`article:${id}`, article);
    
    return c.json({ success: true, data: article }, 201);
  } catch (error: any) {
    console.error("Error creating article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update article (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`article:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }
    
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`article:${id}`, updated);
    
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete article (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`article:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }
    
    await kv.del(`article:${id}`);
    
    return c.json({ success: true, message: "Article deleted" });
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Increment view count
app.post("/:id/view", async (c) => {
  try {
    const id = c.req.param("id");
    
    const article = await kv.get(`article:${id}`);
    if (!article) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }
    
    article.views = (article.views || 0) + 1;
    await kv.set(`article:${id}`, article);
    
    return c.json({ success: true, views: article.views });
  } catch (error: any) {
    console.error("Error incrementing view:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
