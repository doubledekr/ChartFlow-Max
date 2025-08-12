import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { polygonService } from "./services/polygonService";
import { 
  insertChartTemplateSchema,
  insertChartInstanceSchema,
  insertExportPresetSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stock data routes
  app.get("/api/stocks/:symbol/:timeframe", async (req, res) => {
    try {
      const { symbol, timeframe } = req.params;
      const data = await polygonService.getStockData(symbol, timeframe);
      res.json(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ message: "Failed to fetch stock data" });
    }
  });

  // Chart template routes
  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertChartTemplateSchema.parse({
        ...req.body,
        userId,
      });
      
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getUserTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.put("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertChartTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(req.params.id, updates);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTemplate(req.params.id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Chart instance routes
  app.post("/api/instances", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const instanceData = insertChartInstanceSchema.parse({
        ...req.body,
        userId,
      });
      
      const instance = await storage.createInstance(instanceData);
      res.json(instance);
    } catch (error) {
      console.error("Error creating instance:", error);
      res.status(500).json({ message: "Failed to create instance" });
    }
  });

  app.get("/api/instances", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const instances = await storage.getUserInstances(userId);
      res.json(instances);
    } catch (error) {
      console.error("Error fetching instances:", error);
      res.status(500).json({ message: "Failed to fetch instances" });
    }
  });

  app.get("/api/instances/:id", isAuthenticated, async (req, res) => {
    try {
      const instance = await storage.getInstance(req.params.id);
      if (!instance) {
        return res.status(404).json({ message: "Instance not found" });
      }
      res.json(instance);
    } catch (error) {
      console.error("Error fetching instance:", error);
      res.status(500).json({ message: "Failed to fetch instance" });
    }
  });

  app.put("/api/instances/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertChartInstanceSchema.partial().parse(req.body);
      const instance = await storage.updateInstance(req.params.id, updates);
      res.json(instance);
    } catch (error) {
      console.error("Error updating instance:", error);
      res.status(500).json({ message: "Failed to update instance" });
    }
  });

  app.delete("/api/instances/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInstance(req.params.id);
      res.json({ message: "Instance deleted successfully" });
    } catch (error) {
      console.error("Error deleting instance:", error);
      res.status(500).json({ message: "Failed to delete instance" });
    }
  });

  app.get("/api/templates/:templateId/instances", isAuthenticated, async (req, res) => {
    try {
      const instances = await storage.getTemplateInstances(req.params.templateId);
      res.json(instances);
    } catch (error) {
      console.error("Error fetching template instances:", error);
      res.status(500).json({ message: "Failed to fetch template instances" });
    }
  });

  // Export preset routes
  app.post("/api/export-presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const presetData = insertExportPresetSchema.parse({
        ...req.body,
        userId,
      });
      
      const preset = await storage.createExportPreset(presetData);
      res.json(preset);
    } catch (error) {
      console.error("Error creating export preset:", error);
      res.status(500).json({ message: "Failed to create export preset" });
    }
  });

  app.get("/api/export-presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const presets = await storage.getUserExportPresets(userId);
      res.json(presets);
    } catch (error) {
      console.error("Error fetching export presets:", error);
      res.status(500).json({ message: "Failed to fetch export presets" });
    }
  });

  // Cache management
  app.post("/api/cache/clear", isAuthenticated, async (req, res) => {
    try {
      await polygonService.clearExpiredCache();
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
