import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const BUCKET_NAME = "make-df4da301-uploads";
const PRODUCTS_BUCKET = "make-df4da301-products";
const ARTICLES_BUCKET = "make-df4da301-articles";
const GALLERY_BUCKET = "make-df4da301-gallery";

// Initialize storage buckets
async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketsToCreate = [
      { name: BUCKET_NAME, public: true },
      { name: PRODUCTS_BUCKET, public: true },
      { name: ARTICLES_BUCKET, public: true },
      { name: GALLERY_BUCKET, public: true }
    ];
    
    for (const bucketConfig of bucketsToCreate) {
      const bucketExists = buckets?.some((bucket) => bucket.name === bucketConfig.name);
      
      if (!bucketExists) {
        console.log(`📦 Creating bucket: ${bucketConfig.name}`);
        const { error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          fileSizeLimit: 5242880, // 5MB
        });
        
        if (error) {
          console.error(`❌ Error creating bucket ${bucketConfig.name}:`, error);
        } else {
          console.log(`✅ Bucket ${bucketConfig.name} created successfully`);
        }
      } else {
        console.log(`✓ Bucket ${bucketConfig.name} already exists`);
      }
    }
  } catch (error) {
    console.error("❌ Error ensuring buckets:", error);
  }
}

// Ensure bucket exists on startup
ensureBucket();

// Upload single file
app.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = `uploads/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log("✅ File uploaded:", publicUrl);

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return c.json(
      { success: false, error: error.message || "Upload failed" },
      500
    );
  }
});

// Upload multiple files
app.post("/multiple", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return c.json({ success: false, error: "No files provided" }, 400);
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      const filePath = `uploads/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("❌ Upload error for file:", file.name, error);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        url: publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        type: file.type,
      });
    }

    console.log(`✅ ${uploadedFiles.length} files uploaded`);

    return c.json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error: any) {
    console.error("❌ Multiple upload error:", error);
    return c.json(
      { success: false, error: error.message || "Upload failed" },
      500
    );
  }
});

// Upload article image
app.post("/article", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `article-${Date.now()}.${fileExt}`;
    const filePath = `articles/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(ARTICLES_BUCKET)
      .getPublicUrl(filePath);

    console.log("✅ Article image uploaded:", publicUrl);

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return c.json(
      { success: false, error: error.message || "Upload failed" },
      500
    );
  }
});

// Upload gallery image
app.post("/gallery", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `gallery-${Date.now()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(filePath);

    console.log("✅ Gallery image uploaded:", publicUrl);

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath,
        fileName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return c.json(
      { success: false, error: error.message || "Upload failed" },
      500
    );
  }
});

// Delete file
app.delete("/:path", async (c) => {
  try {
    const path = c.req.param("path");
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error("❌ Delete error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log("✅ File deleted:", path);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return c.json(
      { success: false, error: error.message || "Delete failed" },
      500
    );
  }
});

export default app;