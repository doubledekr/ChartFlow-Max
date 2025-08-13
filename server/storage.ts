import {
  users,
  chartTemplates,
  chartInstances,
  exportPresets,
  polygonCache,
  customFonts,
  fontUsage,
  customLogos,
  type User,
  type UpsertUser,
  type ChartTemplate,
  type InsertChartTemplate,
  type ChartInstance,
  type InsertChartInstance,
  type ExportPreset,
  type InsertExportPreset,
  type PolygonCache,
  type InsertPolygonCache,
  type CustomFont,
  type InsertCustomFont,
  type FontUsage,
  type InsertFontUsage,
  type CustomLogo,
  type InsertCustomLogo,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, gt, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Chart template operations
  createTemplate(template: InsertChartTemplate): Promise<ChartTemplate>;
  getTemplate(id: string): Promise<ChartTemplate | undefined>;
  getUserTemplates(userId: string): Promise<ChartTemplate[]>;
  updateTemplate(id: string, updates: Partial<InsertChartTemplate>): Promise<ChartTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Chart instance operations
  createInstance(instance: InsertChartInstance): Promise<ChartInstance>;
  getInstance(id: string): Promise<ChartInstance | undefined>;
  getUserInstances(userId: string): Promise<ChartInstance[]>;
  getTemplateInstances(templateId: string): Promise<ChartInstance[]>;
  updateInstance(id: string, updates: Partial<InsertChartInstance>): Promise<ChartInstance>;
  deleteInstance(id: string): Promise<void>;
  
  // Export preset operations
  createExportPreset(preset: InsertExportPreset): Promise<ExportPreset>;
  getUserExportPresets(userId: string): Promise<ExportPreset[]>;
  
  // Polygon cache operations
  getCachedData(cacheKey: string): Promise<PolygonCache | undefined>;
  setCachedData(data: InsertPolygonCache): Promise<void>;
  clearExpiredCache(): Promise<void>;
  
  // Font operations
  createCustomFont(font: InsertCustomFont): Promise<CustomFont>;
  getCustomFont(id: string): Promise<CustomFont | undefined>;
  getUserCustomFonts(userId: string): Promise<CustomFont[]>;
  getPublicCustomFonts(): Promise<CustomFont[]>;
  getAllAvailableCustomFonts(userId?: string): Promise<CustomFont[]>;
  deleteCustomFont(id: string): Promise<void>;
  
  // Font usage tracking
  trackFontUsage(usage: InsertFontUsage): Promise<void>;
  getFontUsageStats(fontFamily: string): Promise<FontUsage[]>;
  
  // Logo operations
  createCustomLogo(logo: InsertCustomLogo): Promise<CustomLogo>;
  getCustomLogo(id: string): Promise<CustomLogo | undefined>;
  getUserCustomLogos(userId: string): Promise<CustomLogo[]>;
  updateCustomLogo(id: string, updates: Partial<InsertCustomLogo>): Promise<CustomLogo>;
  deleteCustomLogo(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Chart template operations
  async createTemplate(template: InsertChartTemplate): Promise<ChartTemplate> {
    const [created] = await db.insert(chartTemplates).values(template).returning();
    return created;
  }

  async getTemplate(id: string): Promise<ChartTemplate | undefined> {
    const [template] = await db.select().from(chartTemplates).where(eq(chartTemplates.id, id));
    return template;
  }

  async getUserTemplates(userId: string): Promise<ChartTemplate[]> {
    return await db.select()
      .from(chartTemplates)
      .where(eq(chartTemplates.userId, userId))
      .orderBy(desc(chartTemplates.updatedAt));
  }

  async updateTemplate(id: string, updates: Partial<InsertChartTemplate>): Promise<ChartTemplate> {
    const [updated] = await db
      .update(chartTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chartTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(chartTemplates).where(eq(chartTemplates.id, id));
  }

  // Chart instance operations
  async createInstance(instance: InsertChartInstance): Promise<ChartInstance> {
    const [created] = await db.insert(chartInstances).values(instance).returning();
    return created;
  }

  async getInstance(id: string): Promise<ChartInstance | undefined> {
    const [instance] = await db.select().from(chartInstances).where(eq(chartInstances.id, id));
    return instance;
  }

  async getUserInstances(userId: string): Promise<ChartInstance[]> {
    return await db.select()
      .from(chartInstances)
      .where(eq(chartInstances.userId, userId))
      .orderBy(desc(chartInstances.updatedAt));
  }

  async getTemplateInstances(templateId: string): Promise<ChartInstance[]> {
    return await db.select()
      .from(chartInstances)
      .where(eq(chartInstances.templateId, templateId))
      .orderBy(desc(chartInstances.updatedAt));
  }

  async updateInstance(id: string, updates: Partial<InsertChartInstance>): Promise<ChartInstance> {
    const [updated] = await db
      .update(chartInstances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chartInstances.id, id))
      .returning();
    return updated;
  }

  async deleteInstance(id: string): Promise<void> {
    await db.delete(chartInstances).where(eq(chartInstances.id, id));
  }

  // Export preset operations
  async createExportPreset(preset: InsertExportPreset): Promise<ExportPreset> {
    const [created] = await db.insert(exportPresets).values(preset).returning();
    return created;
  }

  async getUserExportPresets(userId: string): Promise<ExportPreset[]> {
    return await db.select()
      .from(exportPresets)
      .where(eq(exportPresets.userId, userId))
      .orderBy(desc(exportPresets.createdAt));
  }

  // Polygon cache operations
  async getCachedData(cacheKey: string): Promise<PolygonCache | undefined> {
    const now = new Date();
    const [cached] = await db.select()
      .from(polygonCache)
      .where(and(
        eq(polygonCache.cacheKey, cacheKey),
        gt(polygonCache.expiresAt, now)
      ));
    return cached;
  }

  async setCachedData(data: InsertPolygonCache): Promise<void> {
    await db.insert(polygonCache)
      .values(data)
      .onConflictDoUpdate({
        target: polygonCache.cacheKey,
        set: {
          data: data.data,
          expiresAt: data.expiresAt,
        },
      });
  }

  async clearExpiredCache(): Promise<void> {
    await db.delete(polygonCache).where(lt(polygonCache.expiresAt, new Date()));
  }

  // Font operations
  async createCustomFont(font: InsertCustomFont): Promise<CustomFont> {
    const [created] = await db.insert(customFonts).values(font).returning();
    return created;
  }

  async getCustomFont(id: string): Promise<CustomFont | undefined> {
    const [font] = await db.select().from(customFonts).where(eq(customFonts.id, id));
    return font;
  }

  async getUserCustomFonts(userId: string): Promise<CustomFont[]> {
    return await db.select()
      .from(customFonts)
      .where(eq(customFonts.userId, userId))
      .orderBy(desc(customFonts.createdAt));
  }

  async getPublicCustomFonts(): Promise<CustomFont[]> {
    return await db.select()
      .from(customFonts)
      .where(eq(customFonts.isPublic, true))
      .orderBy(desc(customFonts.createdAt));
  }

  async getAllAvailableCustomFonts(userId?: string): Promise<CustomFont[]> {
    if (!userId) {
      return this.getPublicCustomFonts();
    }
    
    return await db.select()
      .from(customFonts)
      .where(or(
        eq(customFonts.userId, userId),
        eq(customFonts.isPublic, true)
      ))
      .orderBy(desc(customFonts.createdAt));
  }

  async deleteCustomFont(id: string): Promise<void> {
    await db.delete(customFonts).where(eq(customFonts.id, id));
  }

  // Font usage tracking
  async trackFontUsage(usage: InsertFontUsage): Promise<void> {
    await db.insert(fontUsage)
      .values(usage)
      .onConflictDoUpdate({
        target: [fontUsage.fontFamily, fontUsage.userId, fontUsage.projectId],
        set: {
          usageCount: fontUsage.usageCount,
          lastUsed: new Date(),
        },
      });
  }

  async getFontUsageStats(fontFamily: string): Promise<FontUsage[]> {
    return await db.select()
      .from(fontUsage)
      .where(eq(fontUsage.fontFamily, fontFamily))
      .orderBy(desc(fontUsage.lastUsed));
  }

  // Logo operations
  async createCustomLogo(logo: InsertCustomLogo): Promise<CustomLogo> {
    const [created] = await db.insert(customLogos).values(logo).returning();
    return created;
  }

  async getCustomLogo(id: string): Promise<CustomLogo | undefined> {
    const [logo] = await db.select().from(customLogos).where(eq(customLogos.id, id));
    return logo;
  }

  async getUserCustomLogos(userId: string): Promise<CustomLogo[]> {
    return await db.select()
      .from(customLogos)
      .where(eq(customLogos.userId, userId))
      .orderBy(desc(customLogos.createdAt));
  }

  async updateCustomLogo(id: string, updates: Partial<InsertCustomLogo>): Promise<CustomLogo> {
    const [updated] = await db
      .update(customLogos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customLogos.id, id))
      .returning();
    return updated;
  }

  async deleteCustomLogo(id: string): Promise<void> {
    await db.delete(customLogos).where(eq(customLogos.id, id));
  }
}

export const storage = new DatabaseStorage();