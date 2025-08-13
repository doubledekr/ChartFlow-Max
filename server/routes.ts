import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { polygonService } from "./services/polygonService";
import { 
  insertChartTemplateSchema,
  insertChartInstanceSchema,
  insertExportPresetSchema,
  customFonts,
  customLogos,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { createInsertSchema } from "drizzle-zod";

const insertCustomFontSchema = createInsertSchema(customFonts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertCustomLogoSchema = createInsertSchema(customLogos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
      
      // Check if multiple symbols are provided (comma or space separated)
      const symbols = symbol.split(/[,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
      
      if (symbols.length > 1) {
        // Multiple symbols - fetch data for each and combine for unified Y-axis
        console.log(`Fetching data for multiple symbols: ${symbols.join(', ')}`);
        
        const allData = await Promise.all(
          symbols.map(async (sym) => {
            const data = await polygonService.getStockData(sym, timeframe);
            return { symbol: sym, data };
          })
        );
        
        // Combine all data points for unified Y-axis scaling
        const combinedData = allData.reduce((acc, { data }) => {
          return acc.concat(data);
        }, [] as any[]);
        
        // Sort combined data by timestamp for proper chart rendering
        combinedData.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`Combined ${combinedData.length} data points from ${symbols.length} symbols`);
        res.json(combinedData);
      } else {
        // Single symbol - use existing logic
        const data = await polygonService.getStockData(symbol, timeframe);
        res.json(data);
      }
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

  // Font management routes
  app.get("/api/fonts", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const fonts = await storage.getAllAvailableCustomFonts(userId);
      res.json(fonts);
    } catch (error) {
      console.error("Error fetching fonts:", error);
      res.status(500).json({ message: "Failed to fetch fonts" });
    }
  });

  app.post("/api/fonts/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getFontUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting font upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/fonts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fontData = insertCustomFontSchema.parse({
        ...req.body,
        userId,
      });
      
      const font = await storage.createCustomFont(fontData);
      res.json(font);
    } catch (error) {
      console.error("Error creating custom font:", error);
      res.status(500).json({ message: "Failed to create custom font" });
    }
  });

  app.get("/api/fonts/:id", async (req, res) => {
    try {
      const font = await storage.getCustomFont(req.params.id);
      if (!font) {
        return res.status(404).json({ message: "Font not found" });
      }
      res.json(font);
    } catch (error) {
      console.error("Error fetching font:", error);
      res.status(500).json({ message: "Failed to fetch font" });
    }
  });

  app.delete("/api/fonts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const font = await storage.getCustomFont(req.params.id);
      
      if (!font) {
        return res.status(404).json({ message: "Font not found" });
      }
      
      if (font.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this font" });
      }
      
      await storage.deleteCustomFont(req.params.id);
      res.json({ message: "Font deleted successfully" });
    } catch (error) {
      console.error("Error deleting font:", error);
      res.status(500).json({ message: "Failed to delete font" });
    }
  });

  app.get("/fonts/:fontId", async (req, res) => {
    try {
      const font = await storage.getCustomFont(req.params.fontId);
      if (!font) {
        return res.status(404).json({ message: "Font not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const fontFile = await objectStorageService.getFontFile(font.fileUrl);
      
      res.setHeader('Content-Type', `font/${font.format}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      
      await objectStorageService.downloadObject(fontFile, res);
    } catch (error) {
      console.error("Error serving font:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Font file not found" });
      }
      res.status(500).json({ message: "Failed to serve font" });
    }
  });

  // Logo management routes
  app.get("/api/logos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logos = await storage.getUserCustomLogos(userId);
      res.json(logos);
    } catch (error) {
      console.error("Error fetching logos:", error);
      res.status(500).json({ message: "Failed to fetch logos" });
    }
  });

  app.post("/api/logos/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/logos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logoData = insertCustomLogoSchema.parse({
        ...req.body,
        userId,
      });
      
      const logo = await storage.createCustomLogo(logoData);
      res.json(logo);
    } catch (error) {
      console.error("Error creating custom logo:", error);
      res.status(500).json({ message: "Failed to create custom logo" });
    }
  });

  app.get("/api/logos/:id", async (req, res) => {
    try {
      const logo = await storage.getCustomLogo(req.params.id);
      if (!logo) {
        return res.status(404).json({ message: "Logo not found" });
      }
      res.json(logo);
    } catch (error) {
      console.error("Error fetching logo:", error);
      res.status(500).json({ message: "Failed to fetch logo" });
    }
  });

  app.delete("/api/logos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logo = await storage.getCustomLogo(req.params.id);
      
      if (!logo) {
        return res.status(404).json({ message: "Logo not found" });
      }
      
      if (logo.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this logo" });
      }
      
      await storage.deleteCustomLogo(req.params.id);
      res.json({ message: "Logo deleted successfully" });
    } catch (error) {
      console.error("Error deleting logo:", error);
      res.status(500).json({ message: "Failed to delete logo" });
    }
  });

  app.get("/logos/:logoId", async (req, res) => {
    try {
      const logo = await storage.getCustomLogo(req.params.logoId);
      if (!logo) {
        return res.status(404).json({ message: "Logo not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const logoFile = await objectStorageService.getLogoFile(logo.fileUrl);
      
      res.setHeader('Content-Type', logo.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      
      await objectStorageService.downloadObject(logoFile, res);
    } catch (error) {
      console.error("Error serving logo:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Logo file not found" });
      }
      res.status(500).json({ message: "Failed to serve logo" });
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
