import path from "path";
import fs from "fs";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== "production";

if (!isDevelopment) {
  // Only serve static files in production
  const __dirname = import.meta.dirname;
  const distPath = path.join(__dirname, "../spa");

  // Check if dist path exists before serving
  if (fs.existsSync(distPath)) {
    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });
  }
} else {
  // In development, just handle non-API routes with a simple message
  app.get("*", (req, res) => {
    // Don't handle API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    // For all other routes in development, return a simple message
    res.json({
      message: "Development mode - Frontend served by Vite on port 8080",
      backend: "Backend API running on port 3000",
    });
  });
}

app.listen(port, () => {
  console.log(`🚀 Fusion Starter backend server running on port ${port}`);
  if (isDevelopment) {
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`📱 Frontend: Served by Vite (separate process)`);
  } else {
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
