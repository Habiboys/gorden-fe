import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all orders (Admin only)
app.get("/", async (c) => {
  try {
    const status = c.req.query("status");
    
    const orders = await kv.getByPrefix("order:");
    
    let filtered = orders;
    
    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((o: any) => o.status === status);
    }
    
    // Sort by order date desc
    filtered.sort((a: any, b: any) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single order
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await kv.get(`order:${id}`);
    
    if (!order) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }
    
    return c.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create order (from website)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    
    const id = `order-${Date.now()}`;
    
    // Generate order number
    const year = new Date().getFullYear();
    const allOrders = await kv.getByPrefix("order:");
    const orderCount = allOrders.length;
    const orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(4, "0")}`;
    
    const order = {
      id,
      orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      items: body.items,
      subtotal: body.subtotal,
      discount: body.discount || 0,
      shipping: body.shipping || 0,
      total: body.total,
      paymentMethod: body.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      notes: body.notes || "",
      referralCode: body.referralCode || "",
      orderDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`order:${id}`, order);
    
    return c.json({ success: true, data: order }, 201);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update order status (Admin only)
app.put("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }
    
    order.status = body.status;
    order.updatedAt = new Date().toISOString();
    
    await kv.set(`order:${id}`, order);
    
    return c.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update payment status (Admin only)
app.put("/:id/payment", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }
    
    order.paymentStatus = body.paymentStatus;
    order.updatedAt = new Date().toISOString();
    
    await kv.set(`order:${id}`, order);
    
    return c.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete order (Admin only)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await kv.get(`order:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }
    
    await kv.del(`order:${id}`);
    
    return c.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
