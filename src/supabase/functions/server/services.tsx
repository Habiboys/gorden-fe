import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all services
app.get("/", async (c) => {
  try {
    const services = await kv.getByPrefix("service:");
    return c.json({ success: true, data: services });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get service by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const service = await kv.get(`service:${id}`);
    
    if (!service) {
      return c.json({ success: false, error: "Service not found" }, 404);
    }
    
    return c.json({ success: true, data: service });
  } catch (error: any) {
    console.error(`Error fetching service ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new service (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title, description, icon } = body;
    
    if (!title || !description) {
      return c.json(
        { success: false, error: "Title and description are required" },
        400
      );
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const service = {
      id,
      title,
      description,
      icon: icon || 'Shield',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: body.order || 0,
      active: body.active !== undefined ? body.active : true,
    };
    
    await kv.set(`service:${id}`, service);
    
    return c.json({ success: true, data: service }, 201);
  } catch (error: any) {
    console.error("Error creating service:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update service (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingService = await kv.get(`service:${id}`);
    if (!existingService) {
      return c.json({ success: false, error: "Service not found" }, 404);
    }
    
    const updatedService = {
      ...existingService,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`service:${id}`, updatedService);
    
    return c.json({ success: true, data: updatedService });
  } catch (error: any) {
    console.error(`Error updating service ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete service (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingService = await kv.get(`service:${id}`);
    if (!existingService) {
      return c.json({ success: false, error: "Service not found" }, 404);
    }
    
    await kv.del(`service:${id}`);
    
    return c.json({ success: true, message: "Service deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting service ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
