import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all contact submissions with optional filtering
app.get("/", async (c) => {
  try {
    const status = c.req.query("status");
    const type = c.req.query("type");
    
    let contacts = await kv.getByPrefix("contact:");
    
    // Filter by status
    if (status) {
      contacts = contacts.filter((contact: any) => contact.status === status);
    }
    
    // Filter by type
    if (type) {
      contacts = contacts.filter((contact: any) => contact.type === type);
    }
    
    // Sort by submittedAt (descending)
    contacts.sort((a: any, b: any) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    
    return c.json({ success: true, data: contacts });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get contact by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const contact = await kv.get(`contact:${id}`);
    
    if (!contact) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    return c.json({ success: true, data: contact });
  } catch (error: any) {
    console.error(`Error fetching contact ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Submit new contact form
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, subject, message } = body;
    
    if (!name || !email || !message) {
      return c.json(
        { success: false, error: "Name, email, and message are required" },
        400
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        { success: false, error: "Invalid email format" },
        400
      );
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const contact = {
      id,
      name,
      email,
      phone: phone || '',
      subject: subject || 'General Inquiry',
      message,
      type: body.type || 'general', // general, quote, survey, etc
      status: 'new', // new, replied, closed
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: body.source || 'website',
    };
    
    await kv.set(`contact:${id}`, contact);
    
    return c.json({ 
      success: true, 
      data: contact,
      message: "Thank you for contacting us. We will get back to you soon!" 
    }, 201);
  } catch (error: any) {
    console.error("Error creating contact:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update contact status (Admin only)
app.put("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;
    
    if (!status) {
      return c.json(
        { success: false, error: "Status is required" },
        400
      );
    }
    
    const existingContact = await kv.get(`contact:${id}`);
    if (!existingContact) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    const updatedContact = {
      ...existingContact,
      status,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`contact:${id}`, updatedContact);
    
    return c.json({ success: true, data: updatedContact });
  } catch (error: any) {
    console.error(`Error updating contact status ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update contact (Admin only)
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingContact = await kv.get(`contact:${id}`);
    if (!existingContact) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    const updatedContact = {
      ...existingContact,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`contact:${id}`, updatedContact);
    
    return c.json({ success: true, data: updatedContact });
  } catch (error: any) {
    console.error(`Error updating contact ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete contact (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingContact = await kv.get(`contact:${id}`);
    if (!existingContact) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    await kv.del(`contact:${id}`);
    
    return c.json({ success: true, message: "Contact deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting contact ${c.req.param("id")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
