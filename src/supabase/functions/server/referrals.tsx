import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Get all referrals (Admin only)
app.get("/", async (c) => {
  try {
    const status = c.req.query("status");
    
    const referrals = await kv.getByPrefix("referral:");
    
    let filtered = referrals;
    
    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((r: any) => r.status === status);
    }
    
    // Sort by created date desc
    filtered.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return c.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get referral by code
app.get("/code/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const referrals = await kv.getByPrefix("referral:");
    const referral = referrals.find((r: any) => r.code === code);
    
    if (!referral) {
      return c.json({ success: false, error: "Referral code not found" }, 404);
    }
    
    return c.json({ success: true, data: referral });
  } catch (error: any) {
    console.error("Error fetching referral by code:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Register new referral (from website)
app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    
    // Generate unique referral code
    const code = `REF${Date.now().toString().slice(-6)}`;
    const id = `referral-${Date.now()}`;
    
    const referral = {
      id,
      code,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address || "",
      totalReferrals: 0,
      successfulReferrals: 0,
      totalEarnings: 0,
      status: "active",
      referredCustomers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`referral:${id}`, referral);
    
    return c.json({ success: true, data: referral }, 201);
  } catch (error: any) {
    console.error("Error registering referral:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Submit referred customer
app.post("/submit", async (c) => {
  try {
    const body = await c.req.json();
    
    // Find referral by code
    const referrals = await kv.getByPrefix("referral:");
    const referral = referrals.find((r: any) => r.code === body.referralCode);
    
    if (!referral) {
      return c.json({ success: false, error: "Invalid referral code" }, 400);
    }
    
    // Add referred customer
    const referredCustomer = {
      id: `cust-${Date.now()}`,
      name: body.customerName,
      phone: body.customerPhone,
      email: body.customerEmail,
      purchaseAmount: body.purchaseAmount || 0,
      commission: body.commission || 0,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    
    referral.referredCustomers.push(referredCustomer);
    referral.totalReferrals += 1;
    referral.updatedAt = new Date().toISOString();
    
    await kv.set(`referral:${referral.id}`, referral);
    
    return c.json({ success: true, data: referral });
  } catch (error: any) {
    console.error("Error submitting referral:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve referral commission (Admin only)
app.post("/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const referral = await kv.get(`referral:${id}`);
    if (!referral) {
      return c.json({ success: false, error: "Referral not found" }, 404);
    }
    
    // Find and update the referred customer
    const customerIndex = referral.referredCustomers.findIndex(
      (c: any) => c.id === body.customerId
    );
    
    if (customerIndex === -1) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }
    
    referral.referredCustomers[customerIndex].status = "approved";
    referral.successfulReferrals += 1;
    referral.totalEarnings += referral.referredCustomers[customerIndex].commission;
    referral.updatedAt = new Date().toISOString();
    
    await kv.set(`referral:${id}`, referral);
    
    return c.json({ success: true, data: referral });
  } catch (error: any) {
    console.error("Error approving referral:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update referral status (Admin only)
app.put("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const referral = await kv.get(`referral:${id}`);
    if (!referral) {
      return c.json({ success: false, error: "Referral not found" }, 404);
    }
    
    referral.status = body.status;
    referral.updatedAt = new Date().toISOString();
    
    await kv.set(`referral:${id}`, referral);
    
    return c.json({ success: true, data: referral });
  } catch (error: any) {
    console.error("Error updating referral status:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
