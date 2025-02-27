import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and auth related schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

// Laundry operations related schemas
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull(), // online, offline, maintenance
  lastPing: timestamp("last_ping"),
  metrics: jsonb("metrics").$type<{
    cycles: number;
    uptime: number;
    errors: number;
    temperature: number;
    waterLevel: number;
    detergentLevel: number;
  }>(),
});

export const insertMachineSchema = createInsertSchema(machines).pick({
  name: true,
  location: true,
  status: true,
});

// Alert related schemas
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull(),
  type: text("type").notNull(), // error, warning, info
  message: text("message").notNull(),
  status: text("status").notNull(), // active, cleared
  createdAt: timestamp("created_at").notNull(),
  clearedAt: timestamp("cleared_at"),
  clearedBy: integer("cleared_by"),
  // Make new fields optional for backward compatibility
  priority: text("priority"), // high, medium, low
  category: text("category"), // maintenance, operational, system
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  machineId: true,
  type: true,
  message: true,
  status: true,
}).extend({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  category: z.enum(['maintenance', 'operational', 'system']).optional(),
});

// API Sync related schemas
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  success: boolean("success").notNull(),
  error: text("error"),
  machineCount: integer("machine_count"),
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).pick({
  timestamp: true,
  success: true,
  error: true,
  machineCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;

// WebSocket message types
export type WSMessage = {
  type: 'machine_update' | 'new_alert' | 'alert_cleared';
  payload: any;
};