import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and auth related schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { 
    enum: ['admin', 'manager', 'operator', 'system_analyst', 'performance_analyst', 'lease_manager', 'data_analyst'] 
  }).notNull(),
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
    role: z.enum(['admin', 'manager', 'operator', 'system_analyst', 'performance_analyst', 'lease_manager', 'data_analyst']),
    email: z.string().email().optional(),
    locationId: z.number().optional(),
  });

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // From API: loc_xxxx
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  address: text("address"),
  coordinates: jsonb("coordinates").$type<{
    lat: number;
    long: number;
  }>(),
  status: text("status").notNull().default('active'),
  lastSyncAt: timestamp("last_sync_at"),
});

// Machine Type schema
export const machineTypes = pgTable("machine_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isWasher: boolean("is_washer").notNull().default(false),
  isDryer: boolean("is_dryer").notNull().default(false),
  isCombo: boolean("is_combo").notNull().default(false),
});

// Machine Programs (Cycles) schema
export const machinePrograms = pgTable("machine_programs", {
  id: serial("id").primaryKey(),
  machineTypeId: integer("machine_type_id").references(() => machineTypes.id),
  externalId: text("external_id").notNull(), // e.g. cyc_normal_hot
  name: text("name").notNull(), // e.g. NORMAL_HOT
  type: text("type").notNull(), // washer or dryer program
  sortOrder: integer("sort_order"),
});

// Program Modifiers schema
export const programModifiers = pgTable("program_modifiers", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(), // e.g. mod_regular
  name: text("name").notNull(), // e.g. REGULAR
  programId: integer("program_id").references(() => machinePrograms.id),
});

// Machine schema
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  locationId: integer("location_id").references(() => locations.id),
  machineTypeId: integer("machine_type_id").references(() => machineTypes.id),
  controlId: text("control_id"),
  serialNumber: text("serial_number"),
  machineNumber: text("machine_number"),
  networkNode: text("network_node"),
  modelNumber: text("model_number"),
  status: jsonb("status").$type<{
    linkQualityIndicator: number;
    statusId: string;
    selectedCycle?: {
      id: string;
      name: string;
    };
    selectedModifiers?: Array<{
      id: string;
      name: string;
    }>;
    remainingSeconds?: number;
    remainingVend?: number;
    isDoorOpen?: boolean;
    topoffFullyDisabled?: boolean;
    canTopOff?: boolean;
    topOffVend?: number;
    topOffTime?: number;
  }>(),
  lastSyncAt: timestamp("last_sync_at"),
});

export const machineDetails = pgTable("machine_details", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  controlId: text("control_id"),
  serialNumber: text("serial_number"),
  machineNumber: text("machine_number"),
  networkNode: text("network_node"),
  modelNumber: text("model_number"),
  machineTypeId: integer("machine_type_id").references(() => machineTypes.id),
  details: jsonb("details").$type<{
    linkQualityIndicator: number;
    statusId: string;
    selectedCycle?: {
      id: string;
      name: string;
    };
    selectedModifiers?: Array<{
      id: string;
      name: string;
    }>;
    remainingSeconds?: number;
    remainingVend?: number;
    isDoorOpen?: boolean;
    topoffFullyDisabled?: boolean;
    canTopOff?: boolean;
    topOffVend?: number;
    topOffTime?: number;
  }>(),
});


// Command History schema
export const commandHistory = pgTable("command_history", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  commandId: text("command_id").notNull(), // The generated command ID from API
  command: text("command").notNull(), // START, STOP, etc.
  params: jsonb("params"), // Command parameters
  status: text("status").notNull(), // QUEUED, COMPLETED, FAILED
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

// Create insert schemas
export const insertLocationSchema = createInsertSchema(locations);
export const insertMachineTypeSchema = createInsertSchema(machineTypes);
export const insertMachineProgramSchema = createInsertSchema(machinePrograms);
export const insertProgramModifierSchema = createInsertSchema(programModifiers);
export const insertMachineSchema = createInsertSchema(machines);
export const insertMachineDetailsSchema = createInsertSchema(machineDetails);
export const insertCommandHistorySchema = createInsertSchema(commandHistory);

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
export type MachineType = typeof machineTypes.$inferSelect;
export type InsertMachineType = z.infer<typeof insertMachineTypeSchema>;
export type MachineProgram = typeof machinePrograms.$inferSelect;
export type InsertMachineProgram = z.infer<typeof insertMachineProgramSchema>;
export type ProgramModifier = typeof programModifiers.$inferSelect;
export type InsertProgramModifier = z.infer<typeof insertProgramModifierSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type CommandHistory = typeof commandHistory.$inferSelect;
export type InsertCommandHistory = z.infer<typeof insertCommandHistorySchema>;
export type MachineDetails = typeof machineDetails.$inferSelect;
export type InsertMachineDetails = z.infer<typeof insertMachineDetailsSchema>;

// WebSocket message types
export type WSMessage = {
  type: 'machine_update' | 'new_alert' | 'alert_cleared';
  payload: any;
};

// Machine Cycles schema
export const machineCycles = pgTable("machine_cycles", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  cycleType: text("cycle_type").notNull(),
  sortOrder: integer("sort_order"),
});

// Cycle Modifiers schema
export const cycleModifiers = pgTable("cycle_modifiers", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order"),
});

// Machine Supported Cycles schema (many-to-many)
export const machineSupportedCycles = pgTable("machine_supported_cycles", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  cycleId: integer("cycle_id").references(() => machineCycles.id),
  isEnabled: boolean("is_enabled").default(true),
});

// Machine Supported Modifiers schema (many-to-many)
export const machineSupportedModifiers = pgTable("machine_supported_modifiers", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  modifierId: integer("modifier_id").references(() => cycleModifiers.id),
  isEnabled: boolean("is_enabled").default(true),
});

// Cycle Steps schema
export const cycleSteps = pgTable("cycle_steps", {
  id: serial("id").primaryKey(),
  stepName: text("step_name").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order"),
});

// Machine Cycle Steps schema (relationships)
export const machineCycleSteps = pgTable("machine_cycle_steps", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  cycleId: integer("cycle_id").references(() => machineCycles.id),
  stepId: integer("step_id").references(() => cycleSteps.id),
  stepOrder: integer("step_order").notNull(),
  isEnabled: boolean("is_enabled").default(true),
});

// Create insert schemas for new tables
export const insertMachineCycleSchema = createInsertSchema(machineCycles);
export const insertCycleModifierSchema = createInsertSchema(cycleModifiers);
export const insertMachineSupportedCycleSchema = createInsertSchema(machineSupportedCycles);
export const insertMachineSupportedModifierSchema = createInsertSchema(machineSupportedModifiers);
export const insertCycleStepSchema = createInsertSchema(cycleSteps);
export const insertMachineCycleStepSchema = createInsertSchema(machineCycleSteps);

// Machine Errors schema
export const machineErrors = pgTable("machine_errors", {
  id: text("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  locationId: integer("location_id").references(() => locations.id),
  errorName: text("error_name").notNull(),
  errorType: text("error_type").notNull(),
  errorCode: integer("error_code"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add to the existing insert schemas section
export const insertMachineErrorSchema = createInsertSchema(machineErrors).extend({
  id: z.string().uuid().optional(),
  timestamp: z.string().transform(str => new Date(str)),
});

// Add to the existing export types section
export type MachineError = typeof machineErrors.$inferSelect;
export type InsertMachineError = z.infer<typeof insertMachineErrorSchema>;

// Export types for new tables
export type MachineCycle = typeof machineCycles.$inferSelect;
export type InsertMachineCycle = z.infer<typeof insertMachineCycleSchema>;
export type CycleModifier = typeof cycleModifiers.$inferSelect;
export type InsertCycleModifier = z.infer<typeof insertCycleModifierSchema>;
export type MachineSupportedCycle = typeof machineSupportedCycles.$inferSelect;
export type InsertMachineSupportedCycle = z.infer<typeof insertMachineSupportedCycleSchema>;
export type MachineSupportedModifier = typeof machineSupportedModifiers.$inferSelect;
export type InsertMachineSupportedModifier = z.infer<typeof insertMachineSupportedModifierSchema>;
export type CycleStep = typeof cycleSteps.$inferSelect;
export type InsertCycleStep = z.infer<typeof insertCycleStepSchema>;
export type MachineCycleStep = typeof machineCycleSteps.$inferSelect;
export type InsertMachineCycleStep = z.infer<typeof insertMachineCycleStepSchema>;