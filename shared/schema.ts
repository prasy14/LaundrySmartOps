import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and auth related schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ['admin', 'manager', 'operator'] }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  locationId: integer("location_id").references(() => locations.id),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    role: true,
    name: true,
    email: true,
    locationId: true,
  })
  .extend({
    role: z.enum(['admin', 'manager', 'operator']),
    email: z.string().email().optional(),
    locationId: z.number().optional(),
  });

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  type: text("type"), // store, facility, etc.
  status: text("status").notNull(), // active, inactive
  timezone: text("timezone"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  operatingHours: jsonb("operating_hours").$type<{
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  externalId: true,
  name: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  type: true,
  status: true,
  timezone: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  operatingHours: true,
  metadata: true,
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

// Machine schema
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  locationId: integer("location_id").notNull(),
  model: text("model"),
  serialNumber: text("serial_number"),
  status: text("status").notNull(), // online, offline, maintenance
  lastPing: timestamp("last_ping"),
  installationDate: timestamp("installation_date"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  metrics: jsonb("metrics").$type<{
    cycles: number;
    uptime: number;
    errors: number;
    temperature: number;
    waterLevel: number;
    detergentLevel: number;
    energyConsumption: number;
    waterConsumption: number;
    maintenanceCount: number;
    avgCycleTime: number;
    totalRuntime: number;
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
  supportedPrograms: true,
});

// Alert schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull(),
  type: text("type").notNull(), // error, warning, info
  serviceType: text("service_type"), // mechanical, electrical, software, etc.
  message: text("message").notNull(),
  status: text("status").notNull(), // active, in_progress, resolved, cleared
  createdAt: timestamp("created_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
  assignedTo: integer("assigned_to"),
  priority: text("priority"), // high, medium, low
  category: text("category"), // maintenance, operational, system
  location: text("location"), // physical location within the facility
  resolutionDetails: text("resolution_details"),
  responseTime: integer("response_time_minutes"), // time to first response
  resolutionTime: integer("resolution_time_minutes"), // total time to resolution
});

// Add alert types for better categorization
export const insertAlertSchema = createInsertSchema(alerts).pick({
  machineId: true,
  type: true,
  serviceType: true,
  message: true,
  status: true,
  priority: true,
  category: true,
}).extend({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  category: z.enum(['maintenance', 'operational', 'system']).optional(),
  serviceType: z.enum(['mechanical', 'electrical', 'software', 'general']).optional(),
});

// Sync Log schema
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

// Export types
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