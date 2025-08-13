import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chart templates table - saves chart layouts and styling
export const chartTemplates = pgTable("chart_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  config: jsonb("config").notNull(), // Chart styling configuration
  elements: jsonb("elements").notNull().default('[]'), // Interactive elements layout
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual chart instances - templates applied to specific stock data
export const chartInstances = pgTable("chart_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => chartTemplates.id).notNull(),
  name: varchar("name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  symbol: varchar("symbol").notNull(), // Stock symbol (AAPL, GOOGL, etc.)
  timeframe: varchar("timeframe").notNull().default('1Y'), // 1D, 1W, 1M, 3M, 6M, 1Y, 2Y, 5Y
  elements: jsonb("elements").notNull().default('[]'), // Instance-specific annotations
  polygonData: jsonb("polygon_data"), // Cached Polygon API data
  lastDataUpdate: timestamp("last_data_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export presets for different output formats
export const exportPresets = pgTable("export_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  format: varchar("format").notNull(), // png, svg, pdf
  width: integer("width").notNull().default(1920),
  height: integer("height").notNull().default(1080),
  dpi: integer("dpi").notNull().default(300),
  quality: integer("quality").notNull().default(95),
  settings: jsonb("settings").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Polygon API cache for rate limiting and performance
export const polygonCache = pgTable("polygon_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key").unique().notNull(), // symbol_timeframe combination
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Custom logos table
export const customLogos = pgTable("custom_logos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  position: varchar("position").notNull().default("top-right"),
  size: varchar("size").notNull().default("medium"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomLogo = typeof customLogos.$inferSelect;
export type InsertCustomLogo = typeof customLogos.$inferInsert;

// Custom fonts table for user-uploaded fonts
export const customFonts = pgTable("custom_fonts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Display name
  family: varchar("family").notNull(), // CSS font-family name
  category: varchar("category").notNull().default('custom'), // Font category
  userId: varchar("user_id").references(() => users.id).notNull(), // User who uploaded it
  fileName: varchar("file_name").notNull(), // Original file name
  fileUrl: varchar("file_url").notNull(), // Object storage URL
  fileSize: integer("file_size"), // File size in bytes
  format: varchar("format").notNull(), // woff, woff2, ttf, otf
  isPublic: boolean("is_public").default(false), // Whether other users can use it
  metadata: jsonb("metadata").default('{}'), // Additional font metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Font usage tracking table
export const fontUsage = pgTable("font_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fontFamily: varchar("font_family").notNull(),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id"), // Template or instance ID
  usageCount: integer("usage_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomFont = typeof customFonts.$inferSelect;
export type InsertCustomFont = typeof customFonts.$inferInsert;
export type FontUsage = typeof fontUsage.$inferSelect;
export type InsertFontUsage = typeof fontUsage.$inferInsert;

export type ChartTemplate = typeof chartTemplates.$inferSelect;
export type InsertChartTemplate = typeof chartTemplates.$inferInsert;

export type ChartInstance = typeof chartInstances.$inferSelect;
export type InsertChartInstance = typeof chartInstances.$inferInsert;

export type ExportPreset = typeof exportPresets.$inferSelect;
export type InsertExportPreset = typeof exportPresets.$inferInsert;

export type PolygonCache = typeof polygonCache.$inferSelect;
export type InsertPolygonCache = typeof polygonCache.$inferInsert;

// Zod schemas for validation
export const insertChartTemplateSchema = createInsertSchema(chartTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChartInstanceSchema = createInsertSchema(chartInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExportPresetSchema = createInsertSchema(exportPresets).omit({
  id: true,
  createdAt: true,
});

export type InsertChartTemplateType = z.infer<typeof insertChartTemplateSchema>;
export type InsertChartInstanceType = z.infer<typeof insertChartInstanceSchema>;
export type InsertExportPresetType = z.infer<typeof insertExportPresetSchema>;