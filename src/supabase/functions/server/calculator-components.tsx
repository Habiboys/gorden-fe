import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all calculator components
app.get("/", async (c) => {
  try {
    const components = await kv.getByPrefix("calculator-component:");
    
    // Group by type
    const grouped = {
      products: components.filter(c => c.type === 'product'),
      relGorden: components.filter(c => c.type === 'relGorden'),
      tassel: components.filter(c => c.type === 'tassel'),
      hook: components.filter(c => c.type === 'hook'),
      kainVitrase: components.filter(c => c.type === 'kainVitrase'),
      relVitrase: components.filter(c => c.type === 'relVitrase'),
    };
    
    return c.json({ 
      success: true, 
      data: grouped,
      totalComponents: components.length 
    });
  } catch (error: any) {
    console.error("Error fetching calculator components:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get components by type
app.get("/:type", async (c) => {
  try {
    const type = c.req.param("type");
    const components = await kv.getByPrefix("calculator-component:");
    const filtered = components.filter(comp => comp.type === type);
    
    return c.json({ 
      success: true, 
      data: filtered 
    });
  } catch (error: any) {
    console.error("Error fetching components by type:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single component
app.get("/detail/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const component = await kv.get(`calculator-component:${id}`);
    
    if (!component) {
      return c.json({ success: false, error: "Component not found" }, 404);
    }
    
    return c.json({ success: true, data: component });
  } catch (error: any) {
    console.error("Error fetching component:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create component
app.post("/", async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate required fields
    if (!data.name || !data.type || !data.price) {
      return c.json({ 
        success: false, 
        error: "Name, type, and price are required" 
      }, 400);
    }

    const id = `comp-${Date.now()}`;
    const component = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`calculator-component:${id}`, component);

    return c.json({ 
      success: true, 
      data: component,
      message: "Component created successfully" 
    }, 201);
  } catch (error: any) {
    console.error("Error creating component:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update component
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();

    const existing = await kv.get(`calculator-component:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Component not found" }, 404);
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`calculator-component:${id}`, updated);

    return c.json({ 
      success: true, 
      data: updated,
      message: "Component updated successfully" 
    });
  } catch (error: any) {
    console.error("Error updating component:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete component
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await kv.get(`calculator-component:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Component not found" }, 404);
    }

    await kv.del(`calculator-component:${id}`);

    return c.json({ 
      success: true, 
      message: "Component deleted successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting component:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Bulk create (for seeding)
app.post("/bulk", async (c) => {
  try {
    const { components } = await c.req.json();
    
    if (!Array.isArray(components)) {
      return c.json({ 
        success: false, 
        error: "Components must be an array" 
      }, 400);
    }

    const created = [];
    for (const comp of components) {
      const id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const component = {
        id,
        ...comp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await kv.set(`calculator-component:${id}`, component);
      created.push(component);
    }

    return c.json({ 
      success: true, 
      data: created,
      message: `${created.length} components created successfully` 
    }, 201);
  } catch (error: any) {
    console.error("Error bulk creating components:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
