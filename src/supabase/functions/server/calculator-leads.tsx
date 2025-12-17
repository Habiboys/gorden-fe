import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all calculator leads (Admin only)
app.get("/", async (c) => {
  try {
    const status = c.req.query("status");
    const type = c.req.query("type");
    
    const leads = await kv.getByPrefix("calculator-lead:");
    
    let filtered = leads;
    
    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((l: any) => l.status === status);
    }
    
    // Filter by calculator type
    if (type) {
      filtered = filtered.filter((l: any) => l.calculatorType === type);
    }
    
    // Sort by submitted date desc
    filtered.sort((a: any, b: any) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching calculator leads:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single lead
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const lead = await kv.get(`calculator-lead:${id}`);
    
    if (!lead) {
      return c.json({ success: false, error: "Lead not found" }, 404);
    }
    
    return c.json({ success: true, data: lead });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Submit new calculator lead (from website)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    console.log('📥 Received calculator lead:', body);
    
    const id = `lead-${Date.now()}`;
    
    const lead = {
      id,
      // Support both old and new field names
      customerName: body.customerName || body.name,
      customerPhone: body.customerPhone || body.phone,
      customerEmail: body.customerEmail || body.email,
      calculatorType: body.calculatorType,
      productName: body.productName,
      productPrice: body.productPrice,
      items: body.items || [],
      grandTotal: body.grandTotal || body.estimatedPrice,
      totalItems: body.totalItems,
      totalUnits: body.totalUnits,
      // Keep old fields for backward compatibility
      name: body.customerName || body.name,
      phone: body.customerPhone || body.phone,
      email: body.customerEmail || body.email,
      estimatedPrice: body.grandTotal || body.estimatedPrice,
      calculation: body.calculation || body.items,
      status: "new",
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('✅ Saving calculator lead:', lead);
    
    await kv.set(`calculator-lead:${id}`, lead);
    
    return c.json({ success: true, data: lead }, 201);
  } catch (error: any) {
    console.error("❌ Error submitting calculator lead:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update lead status (Admin only)
app.put("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const lead = await kv.get(`calculator-lead:${id}`);
    if (!lead) {
      return c.json({ success: false, error: "Lead not found" }, 404);
    }
    
    lead.status = body.status;
    lead.updatedAt = new Date().toISOString();
    
    await kv.set(`calculator-lead:${id}`, lead);
    
    return c.json({ success: true, data: lead });
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete lead (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`calculator-lead:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Lead not found" }, 404);
    }
    
    await kv.del(`calculator-lead:${id}`);
    
    return c.json({ success: true, message: "Lead deleted" });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;