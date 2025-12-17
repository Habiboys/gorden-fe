import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all documents (Admin only)
app.get("/", async (c) => {
  try {
    const type = c.req.query("type");
    const status = c.req.query("status");
    
    const documents = await kv.getByPrefix("document:");
    
    let filtered = documents;
    
    // Filter by type
    if (type && type !== "all") {
      filtered = filtered.filter((d: any) => d.type === type);
    }
    
    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((d: any) => d.status === status);
    }
    
    // Sort by created date desc
    filtered.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single document
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const document = await kv.get(`document:${id}`);
    
    if (!document) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }
    
    return c.json({ success: true, data: document });
  } catch (error: any) {
    console.error("Error fetching document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create document (Admin only)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    const id = `doc-${Date.now()}`;
    
    // Generate document number based on type
    const prefix = body.type === "quotation" ? "QT" : "INV";
    const year = new Date().getFullYear();
    
    // Get count of existing documents of this type
    const allDocs = await kv.getByPrefix("document:");
    const typeCount = allDocs.filter((d: any) => d.type === body.type).length;
    const docNumber = `${prefix}-${year}-${String(typeCount + 1).padStart(3, "0")}`;
    
    const document = {
      id,
      type: body.type,
      documentNumber: docNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      amount: body.amount,
      discount: body.discount || 0,
      referralCode: body.referralCode || "",
      quotationData: body.quotationData || null,
      status: body.status || "draft",
      sentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`document:${id}`, document);
    
    return c.json({ success: true, data: document }, 201);
  } catch (error: any) {
    console.error("Error creating document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update document (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existing = await kv.get(`document:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }
    
    const updated = {
      ...existing,
      ...body,
      id,
      documentNumber: existing.documentNumber, // Don't allow changing document number
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`document:${id}`, updated);
    
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mark document as sent
app.post("/:id/send", async (c) => {
  try {
    const id = c.req.param("id");
    
    const document = await kv.get(`document:${id}`);
    if (!document) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }
    
    document.status = "sent";
    document.sentAt = new Date().toISOString();
    document.updatedAt = new Date().toISOString();
    
    await kv.set(`document:${id}`, document);
    
    // TODO: Send email with document
    
    return c.json({ success: true, data: document });
  } catch (error: any) {
    console.error("Error sending document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete document (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`document:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }
    
    await kv.del(`document:${id}`);
    
    return c.json({ success: true, message: "Document deleted" });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
