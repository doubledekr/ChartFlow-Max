import { sql } from 'drizzle-orm';
import { pgTable, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom fonts table for user-uploaded fonts
export const customFonts = pgTable("custom_fonts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Display name
  family: varchar("family").notNull(), // CSS font-family name
  category: varchar("category").notNull().default('custom'), // Font category
  userId: varchar("user_id").notNull(), // User who uploaded it
  fileName: varchar("file_name").notNull(), // Original file name
  fileUrl: varchar("file_url").notNull(), // Object storage URL
  fileSize: varchar("file_size"), // File size in bytes
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
  userId: varchar("user_id"),
  projectId: varchar("project_id"), // Template or instance ID
  usageCount: varchar("usage_count").default('1'),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for font uploads
export const insertCustomFontSchema = createInsertSchema(customFonts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFontUsageSchema = createInsertSchema(fontUsage).omit({
  id: true,
  createdAt: true,
});

// Types
export type CustomFont = typeof customFonts.$inferSelect;
export type InsertCustomFont = z.infer<typeof insertCustomFontSchema>;
export type FontUsage = typeof fontUsage.$inferSelect;
export type InsertFontUsage = z.infer<typeof insertFontUsageSchema>;