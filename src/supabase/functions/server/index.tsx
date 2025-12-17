import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import products from "./products.tsx";
import categories from "./categories.tsx";
import articles from "./articles.tsx";
import calculatorLeads from "./calculator-leads.tsx";
import calculatorComponents from "./calculator-components.tsx";
import documents from "./documents.tsx";
import referrals from "./referrals.tsx";
import orders from "./orders.tsx";
import seed from "./seed.tsx";
import services from "./services.tsx";
import gallery from "./gallery.tsx";
import faqs from "./faqs.tsx";
import contacts from "./contacts.tsx";
import upload from "./upload.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-df4da301/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount all routes
app.route("/make-server-df4da301/products", products);
app.route("/make-server-df4da301/categories", categories);
app.route("/make-server-df4da301/articles", articles);
app.route("/make-server-df4da301/calculator-leads", calculatorLeads);
app.route("/make-server-df4da301/calculator-components", calculatorComponents);
app.route("/make-server-df4da301/documents", documents);
app.route("/make-server-df4da301/referrals", referrals);
app.route("/make-server-df4da301/orders", orders);
app.route("/make-server-df4da301/seed", seed);
app.route("/make-server-df4da301/services", services);
app.route("/make-server-df4da301/gallery", gallery);
app.route("/make-server-df4da301/faqs", faqs);
app.route("/make-server-df4da301/contacts", contacts);
app.route("/make-server-df4da301/upload", upload);

// Start server
Deno.serve(app.fetch);