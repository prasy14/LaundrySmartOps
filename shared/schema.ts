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

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  type: text("type"), // store, facility, etc.
  status: text("status").notNull(), // active, inactive
  metadata: jsonb("metadata").$type<{
    timezone?: string;
    phone?: string;
    email?: string;
    operatingHours?: string;
  }>(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  externalId: true,
  name: true,
  address: true,
  type: true,
  status: true,
});

// Machine Program schema
export const machinePrograms = pgTable("machine_programs", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  type: text("type").notNull(), // wash, dry, etc.
  metadata: jsonb("metadata").$type<{
    temperature?: number;
    spinSpeed?: number;
    waterLevel?: number;
    energyUsage?: number;
  }>(),
});

export const insertMachineProgramSchema = createInsertSchema(machinePrograms).pick({
  externalId: true,
  name: true,
  description: true,
  duration: true,
  type: true,
});

// Laundry operations related schemas
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  locationId: integer("location_id").notNull(),
  model: text("model"),
  serialNumber: text("serial_number"),
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
  supportedPrograms: jsonb("supported_programs").$type<string[]>(),
});

export const insertMachineSchema = createInsertSchema(machines).pick({
  externalId: true,
  name: true,
  locationId: true,
  model: true,
  serialNumber: true,
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
  locationCount: integer("location_count"),
  programCount: integer("program_count"),
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).pick({
  timestamp: true,
  success: true,
  error: true,
  machineCount: true,
  locationCount: true,
  programCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type MachineProgram = typeof machinePrograms.$inferSelect;
export type InsertMachineProgram = z.infer<typeof insertMachineProgramSchema>;
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