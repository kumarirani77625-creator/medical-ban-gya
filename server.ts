import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeMedicineImage, askCareAssistant } from "./services/geminiService.ts";
import {
  requestAmbulance,
  getAmbulanceStatus,
  cancelAmbulanceRequest,
} from "./services/ambulanceService.ts";
import { getPharmaciesForMedicine, pharmacies } from "./services/pharmacyService.ts";
import { findNearbyHospitals } from "./services/hospitalService.ts";

dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  try {
    dotenv.config({ path: ".env.example" });
  } catch (e) {
    // Ignore if not present
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with generous limit for high-resolution image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- API ROUTES FIRST ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "CareMitra Senior Health & Emergency Assistant",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Analyze Medicine Photo endpoint
  app.post("/api/analyze-medicine", async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({
          error: "Missing image data. Please upload a valid JPG, PNG, or WEBP image.",
        });
      }

      // Validate allowed mime types
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const detectedMime = mimeType || (image.startsWith("data:image/png") ? "image/png" : "image/jpeg");
      
      if (!allowedMimes.includes(detectedMime)) {
        return res.status(400).json({
          error: "Unsupported image format. Allowed formats: JPG, PNG, WEBP.",
        });
      }

      // Check payload size
      if (image.length > 15 * 1024 * 1024) {
        return res.status(400).json({
          error: "Image file is too large. Please upload an image under 10MB.",
        });
      }

      const result = await analyzeMedicineImage(image, detectedMime);
      return res.json(result);
    } catch (err: any) {
      console.error("API /api/analyze-medicine error:", err);
      return res.status(500).json({
        error: "Failed to analyze medicine photo. Please try again or consult your doctor.",
        details: err.message,
      });
    }
  });

  // 2. Pharmacy Search endpoint
  app.get("/api/pharmacies", (req, res) => {
    try {
      const medicineName = (req.query.medicineName as string) || "";
      const result = getPharmaciesForMedicine(medicineName);
      return res.json(result);
    } catch (err: any) {
      console.error("API /api/pharmacies error:", err);
      return res.status(500).json({ error: "Failed to retrieve pharmacy listings." });
    }
  });

  // 3. Emergency Ambulance Request endpoint
  app.post("/api/emergency/request", async (req, res) => {
    try {
      const { latitude, longitude, accuracy, patientName, emergencyType, contactNumber } = req.body;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({
          error: "Valid latitude and longitude coordinates are required for emergency dispatch.",
        });
      }

      const result = await requestAmbulance({
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? accuracy : 10,
        patientName: patientName || "Senior Patient",
        emergencyType: emergencyType || "General Medical Emergency",
        contactNumber: contactNumber || "Emergency Helpline",
      });

      return res.json(result);
    } catch (err: any) {
      console.error("API /api/emergency/request error:", err);
      return res.status(500).json({
        error: "Emergency dispatch processing error. Please dial 112 / 108 directly.",
      });
    }
  });

  // Emergency status check
  app.get("/api/emergency/status/:id", async (req, res) => {
    try {
      const status = await getAmbulanceStatus(req.params.id);
      if (!status) {
        return res.status(404).json({ error: "Emergency request ID not found." });
      }
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to check status." });
    }
  });

  // Emergency cancel
  app.post("/api/emergency/cancel/:id", async (req, res) => {
    try {
      const result = await cancelAmbulanceRequest(req.params.id);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to cancel request." });
    }
  });

  // 4. Nearby Hospitals endpoint
  app.get("/api/nearby-hospitals", async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

      const result = await findNearbyHospitals(lat, lng);
      return res.json(result);
    } catch (err: any) {
      console.error("API /api/nearby-hospitals error:", err);
      return res.status(500).json({ error: "Failed to search nearby hospitals." });
    }
  });

  // 5. Senior AI Assistant endpoint
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { message, language, context } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Please provide a valid question." });
      }

      const lang = language === "hi" ? "hi" : "en";
      const reply = await askCareAssistant(message.trim(), lang, context);
      return res.json({ reply, language: lang });
    } catch (err: any) {
      console.error("API /api/ai-assistant error:", err);
      return res.status(500).json({
        reply:
          "CareMitra Assistant is currently unavailable. Please consult your physician or in an emergency, call 112 / 108.",
      });
    }
  });

  // Explicit API error handler returning clean JSON instead of HTML
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Middleware Error:", err);
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || "An unexpected error occurred during request processing.",
    });
  });

  // --- VITE MIDDLEWARE & STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "localhost", () => {
    console.log(`CareMitra senior care server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start CareMitra server:", err);
  process.exit(1);
});
