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

// API integration related schemas
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  lastSynced: timestamp("last_synced").notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  externalId: true,
  name: true,
  description: true,
  status: true,
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull(),
  externalId: text("external_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull(),
  metadata: jsonb("metadata"),
  lastSynced: timestamp("last_synced").notNull(),
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  departmentId: true,
  externalId: true,
  startTime: true,
  endTime: true,
  status: true,
  metadata: true,
});

// Machine related schemas
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
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  machineId: true,
  type: true,
  message: true,
  status: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// WebSocket message types
export type WSMessage = {
  type: 'machine_update' | 'new_alert' | 'alert_cleared';
  payload: any;
};