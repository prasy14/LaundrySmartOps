import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and auth related schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { 
    enum: [
      'admin', 'manager', 'operator', 
      'system_analyst', 'performance_analyst', 'lease_manager', 'data_analyst',
      'sustainability_officer', 'property_manager', 'service_manager', 
      'compliance_officer', 'facilities_manager', 'executive', 
      'business_analyst', 'it_manager', 'customer_service_lead', 
      'maintenance_planner', 'service_lead', 'product_dev_analyst', 
      'senior_executive'
    ] 
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
    role: z.enum([
      'admin', 'manager', 'operator', 
      'system_analyst', 'performance_analyst', 'lease_manager', 'data_analyst',
      'sustainability_officer', 'property_manager', 'service_manager', 
      'compliance_officer', 'facilities_manager', 'executive', 
      'business_analyst', 'it_manager', 'customer_service_lead', 
      'maintenance_planner', 'service_lead', 'product_dev_analyst', 
      'senior_executive'
    ]),
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
  locationId: integer("location_id").references(() => locations.id),
  machineId: integer("machine_id").references(() => machines.id), // Added machine ID reference
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
  locationId: integer("location_id").references(() => locations.id),
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
  manufacturer: text("manufacturer"),
  installDate: timestamp("install_date"),
  warrantyExpiryDate: timestamp("warranty_expiry_date"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  lifeCycleStatus: text("life_cycle_status"),
  performanceMetrics: jsonb("performance_metrics").$type<{
    uptime: number;
    averageCyclesPerDay: number;
    averageCycleTime: number;
    errorFrequency: number;
    efficiency: number;
  }>(),
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
  locationId: integer("location_id").references(() => locations.id),
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
  locationId: integer("location_id").references(() => locations.id),
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
  locationId: integer("location_id").references(() => locations.id),
  type: text("type").notNull(), // error, warning, info
  serviceType: text("service_type"), // mechanical, electrical, software, etc.
  message: text("message").notNull(),
  status: text("status").notNull(), // active, in_progress, resolved, cleared
  createdAt: timestamp("created_at").notNull(),
  clearedAt: timestamp("cleared_at"),
  clearedBy: integer("cleared_by"),
  resolvedAt: timestamp("resolved_at"),
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
  locationId: true,
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
  endpoint: text("endpoint").notNull(), // API endpoint called
  method: text("method").notNull(), // HTTP method used
  requestData: jsonb("request_data"), // Data sent in the request
  responseData: jsonb("response_data"), // Data received in the response
  duration: integer("duration"), // Duration of the API call in milliseconds
  statusCode: integer("status_code"), // HTTP status code
  machineCount: integer("machine_count"),
  locationCount: integer("location_count"),
  programCount: integer("program_count"),
  userId: integer("user_id").references(() => users.id), // User who initiated the sync (if applicable)
  syncType: text("sync_type").notNull(), // Type of sync: 'auto', 'manual', 'scheduled'
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).pick({
  timestamp: true,
  success: true,
  error: true,
  endpoint: true,
  method: true,
  requestData: true,
  responseData: true,
  duration: true,
  statusCode: true,
  machineCount: true,
  locationCount: true,
  programCount: true,
  userId: true,
  syncType: true,
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
  locationId: integer("location_id").references(() => locations.id),
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
  locationId: integer("location_id").references(() => locations.id),
  isEnabled: boolean("is_enabled").default(true),
});

// Machine Supported Modifiers schema (many-to-many)
export const machineSupportedModifiers = pgTable("machine_supported_modifiers", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  modifierId: integer("modifier_id").references(() => cycleModifiers.id),
  locationId: integer("location_id").references(() => locations.id),
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
  locationId: integer("location_id").references(() => locations.id),
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
}).omit({
  createdAt: true,
});

// Schema for handling the JSON format from external API
export const externalMachineErrorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(), 
  code: z.number(),
  timestamp: z.string(),
}).transform((data) => ({
  id: data.id,
  errorName: data.name,
  errorType: data.type,
  errorCode: data.code,
  timestamp: new Date(data.timestamp),
}));

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

// Sustainability metrics schema
export const sustainabilityMetrics = pgTable("sustainability_metrics", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  locationId: integer("location_id").references(() => locations.id),
  date: timestamp("date").notNull(),
  energyConsumption: numeric("energy_consumption"), // in kWh
  waterConsumption: numeric("water_consumption"), // in gallons
  carbonFootprint: numeric("carbon_footprint"), // in kg CO2e
  cycleCount: integer("cycle_count"),
  operatingHours: numeric("operating_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSustainabilityMetricsSchema = createInsertSchema(sustainabilityMetrics).pick({
  machineId: true,
  locationId: true,
  date: true,
  energyConsumption: true,
  waterConsumption: true,
  carbonFootprint: true,
  cycleCount: true,
  operatingHours: true,
});

export type SustainabilityMetrics = typeof sustainabilityMetrics.$inferSelect;
export type InsertSustainabilityMetrics = z.infer<typeof insertSustainabilityMetricsSchema>;

// Machine Performance Metrics schema for detailed comparison
export const machinePerformanceMetrics = pgTable("machine_performance_metrics", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  locationId: integer("location_id").references(() => locations.id),
  date: timestamp("date").notNull(),
  // Uptime/Downtime metrics
  uptimeMinutes: numeric("uptime_minutes"),
  downtimeMinutes: numeric("downtime_minutes"),
  availabilityPercentage: numeric("availability_percentage"), // (uptime / (uptime + downtime)) * 100
  
  // Output/Throughput metrics
  cyclesCompleted: integer("cycles_completed"),
  totalLoadsProcessed: integer("total_loads_processed"),
  averageCycleTime: numeric("average_cycle_time"), // in minutes
  
  // Error and reliability metrics
  errorCount: integer("error_count"),
  failureRate: numeric("failure_rate"), // errors per 100 cycles
  meanTimeBetweenFailures: numeric("mtbf"), // in hours
  
  // Energy metrics
  energyConsumption: numeric("energy_consumption"), // in kWh
  energyEfficiency: numeric("energy_efficiency"), // kWh per cycle
  
  // Maintenance metrics
  maintenanceCount: integer("maintenance_count"),
  plannedMaintenanceCount: integer("planned_maintenance_count"),
  unplannedMaintenanceCount: integer("unplanned_maintenance_count"),
  
  // OEE (Overall Equipment Effectiveness)
  oeeScore: numeric("oee_score"), // percentage (0-100)
  performanceEfficiency: numeric("performance_efficiency"), // percentage (0-100)
  qualityRate: numeric("quality_rate"), // percentage (0-100)
  
  // Utilization metrics
  utilizationRate: numeric("utilization_rate"), // percentage (0-100)
  peakUtilizationTime: text("peak_utilization_time"), // e.g., "9AM-11AM"
  
  // Additional metrics
  costPerCycle: numeric("cost_per_cycle"),
  revenueGenerated: numeric("revenue_generated"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});

export const insertMachinePerformanceMetricsSchema = createInsertSchema(machinePerformanceMetrics).pick({
  machineId: true,
  locationId: true,
  date: true,
  uptimeMinutes: true,
  downtimeMinutes: true,
  availabilityPercentage: true,
  cyclesCompleted: true,
  totalLoadsProcessed: true,
  averageCycleTime: true,
  errorCount: true,
  failureRate: true,
  meanTimeBetweenFailures: true,
  energyConsumption: true,
  energyEfficiency: true,
  maintenanceCount: true,
  plannedMaintenanceCount: true,
  unplannedMaintenanceCount: true,
  oeeScore: true,
  performanceEfficiency: true,
  qualityRate: true,
  utilizationRate: true,
  peakUtilizationTime: true,
  costPerCycle: true,
  revenueGenerated: true,
});

export type MachinePerformanceMetrics = typeof machinePerformanceMetrics.$inferSelect;
export type InsertMachinePerformanceMetrics = z.infer<typeof insertMachinePerformanceMetricsSchema>;

// Email Report scheduling schema
export const emailRecipients = pgTable("email_recipients", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportSchedules = pgTable("report_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // sustainability, maintenance, performance, compliance, executive
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  parameters: jsonb("parameters").$type<{
    locationId?: number;
    startDate?: string;
    endDate?: string;
    serviceType?: string;
    format?: string;
    [key: string]: any;
  }>().default({}),
  lastSentAt: timestamp("last_sent_at"),
  nextSendAt: timestamp("next_send_at").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportRecipients = pgTable("report_recipients", {
  id: serial("id").primaryKey(),
  reportScheduleId: integer("report_schedule_id").references(() => reportSchedules.id).notNull(),
  recipientId: integer("recipient_id").references(() => emailRecipients.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients).pick({
  email: true,
  name: true,
  role: true,
  active: true,
});

export const insertReportScheduleSchema = createInsertSchema(reportSchedules).pick({
  userId: true,
  reportType: true,
  frequency: true,
  parameters: true,
  nextSendAt: true,
  active: true,
});

export const insertReportRecipientSchema = createInsertSchema(reportRecipients).pick({
  reportScheduleId: true,
  recipientId: true,
});

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = z.infer<typeof insertEmailRecipientSchema>;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = z.infer<typeof insertReportScheduleSchema>;
export type ReportRecipient = typeof reportRecipients.$inferSelect;
export type InsertReportRecipient = z.infer<typeof insertReportRecipientSchema>;

// Coin Vault table for storing coin vault data
export const coinVaults = pgTable("coin_vaults", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  machineId: integer("machine_id").references(() => machines.id),
  externalMachineId: text("external_machine_id").notNull(),
  machineName: text("machine_name").notNull(),
  vaultSize: integer("vault_size").notNull(),
  percentCapacity: numeric("percent_capacity", { precision: 5, scale: 3 }).notNull(),
  totalValue: integer("total_value").notNull(), // stored in cents
  machineType: jsonb("machine_type").$type<{
    name: string;
    description: string;
    isWasher: boolean;
    isDryer: boolean;
    isCombo: boolean;
  }>().notNull(),
  emptiedDetails: jsonb("emptied_details").$type<Array<{
    emptiedAt: string;
    emptiedValue: number;
  }>>().notNull().default([]),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoinVaultSchema = createInsertSchema(coinVaults).pick({
  locationId: true,
  machineId: true,
  externalMachineId: true,
  machineName: true,
  vaultSize: true,
  percentCapacity: true,
  totalValue: true,
  machineType: true,
  emptiedDetails: true,
});

export type CoinVault = typeof coinVaults.$inferSelect;
export type InsertCoinVault = z.infer<typeof insertCoinVaultSchema>;

// Audit Operations table
export const auditOperations = pgTable("audit_operations", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id).notNull(),
  machineId: integer("machine_id").references(() => machines.id),
  externalLocationId: text("external_location_id"),
  externalMachineId: text("external_machine_id"),
  operationType: text("operation_type").notNull(), // e.g., "maintenance", "inspection", "cleaning"
  operationStatus: text("operation_status").notNull(), // e.g., "pending", "in_progress", "completed", "failed"
  auditorName: text("auditor_name").notNull(),
  auditorId: text("auditor_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  findings: jsonb("findings").$type<{
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      resolved: boolean;
    }>;
    recommendations: string[];
    scores?: {
      cleanliness?: number;
      functionality?: number;
      safety?: number;
      overall?: number;
    };
  }>(),
  checklist: jsonb("checklist").$type<{
    items: Array<{
      item: string;
      status: string; // "pass", "fail", "na"
      notes?: string;
    }>;
    completionRate?: number;
  }>(),
  notes: text("notes"),
  attachments: jsonb("attachments").$type<Array<{
    filename: string;
    url: string;
    type: string;
    size?: number;
  }>>(),
  priority: text("priority").notNull().default("medium"), // "high", "medium", "low"
  category: text("category").notNull(), // "preventive", "corrective", "routine", "emergency"
  complianceStatus: text("compliance_status"), // "compliant", "non_compliant", "pending_review"
  nextAuditDue: timestamp("next_audit_due"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id)
});

export const insertAuditOperationSchema = createInsertSchema(auditOperations).pick({
  locationId: true,
  machineId: true,
  externalLocationId: true,
  externalMachineId: true,
  operationType: true,
  operationStatus: true,
  auditorName: true,
  auditorId: true,
  startTime: true,
  endTime: true,
  duration: true,
  findings: true,
  checklist: true,
  notes: true,
  attachments: true,
  priority: true,
  category: true,
  complianceStatus: true,
  nextAuditDue: true,
  createdBy: true,
  updatedBy: true
});

export type AuditOperation = typeof auditOperations.$inferSelect;
export type InsertAuditOperation = z.infer<typeof insertAuditOperationSchema>;

// Audit Cycle Usage table for tracking machine cycle patterns and usage analytics
export const auditCycleUsage = pgTable("audit_cycle_usage", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  machineId: integer("machine_id").references(() => machines.id),
  externalLocationId: text("external_location_id"),
  externalMachineId: text("external_machine_id"),
  
  // Machine information
  machineName: text("machine_name").notNull(),
  machineTypeName: text("machine_type_name"),
  machineTypeDescription: text("machine_type_description"),
  isWasher: boolean("is_washer").default(false),
  isDryer: boolean("is_dryer").default(false),
  isCombo: boolean("is_combo").default(false),
  
  // Cycle counts by type and temperature
  delicateColdCount: integer("delicate_cold_count").default(0),
  delicateHotCount: integer("delicate_hot_count").default(0),
  delicateWarmCount: integer("delicate_warm_count").default(0),
  normalColdCount: integer("normal_cold_count").default(0),
  normalHotCount: integer("normal_hot_count").default(0),
  normalWarmCount: integer("normal_warm_count").default(0),
  permanentPressColdCount: integer("permanent_press_cold_count").default(0),
  permanentPressHotCount: integer("permanent_press_hot_count").default(0),
  permanentPressWarmCount: integer("permanent_press_warm_count").default(0),
  
  // Total cycles and calculated metrics
  totalCycles: integer("total_cycles").notNull(),
  totalDelicateCycles: integer("total_delicate_cycles").default(0),
  totalNormalCycles: integer("total_normal_cycles").default(0),
  totalPermanentPressCycles: integer("total_permanent_press_cycles").default(0),
  totalColdCycles: integer("total_cold_cycles").default(0),
  totalHotCycles: integer("total_hot_cycles").default(0),
  totalWarmCycles: integer("total_warm_cycles").default(0),
  
  // Usage patterns and efficiency metrics
  hotWaterUsagePercentage: numeric("hot_water_usage_percentage", { precision: 5, scale: 2 }),
  delicateCyclePercentage: numeric("delicate_cycle_percentage", { precision: 5, scale: 2 }),
  energyEfficiencyScore: integer("energy_efficiency_score"),
  usagePatternRating: text("usage_pattern_rating"), // optimal, good, concerning, poor
  
  // Data collection period
  firstReceivedAt: timestamp("first_received_at").notNull(),
  lastReceivedAt: timestamp("last_received_at").notNull(),
  dataCollectionDays: integer("data_collection_days"),
  
  // Audit metadata
  auditDate: timestamp("audit_date").defaultNow(),
  auditedBy: integer("audited_by").references(() => users.id),
  auditNotes: text("audit_notes"),
  recommendations: jsonb("recommendations"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertAuditCycleUsageSchema = createInsertSchema(auditCycleUsage).pick({
  locationId: true,
  machineId: true,
  externalLocationId: true,
  externalMachineId: true,
  machineName: true,
  machineTypeName: true,
  machineTypeDescription: true,
  isWasher: true,
  isDryer: true,
  isCombo: true,
  delicateColdCount: true,
  delicateHotCount: true,
  delicateWarmCount: true,
  normalColdCount: true,
  normalHotCount: true,
  normalWarmCount: true,
  permanentPressColdCount: true,
  permanentPressHotCount: true,
  permanentPressWarmCount: true,
  totalCycles: true,
  totalDelicateCycles: true,
  totalNormalCycles: true,
  totalPermanentPressCycles: true,
  totalColdCycles: true,
  totalHotCycles: true,
  totalWarmCycles: true,
  hotWaterUsagePercentage: true,
  delicateCyclePercentage: true,
  energyEfficiencyScore: true,
  usagePatternRating: true,
  firstReceivedAt: true,
  lastReceivedAt: true,
  dataCollectionDays: true,
  auditedBy: true,
  auditNotes: true,
  recommendations: true
});

export type AuditCycleUsage = typeof auditCycleUsage.$inferSelect;
export type InsertAuditCycleUsage = z.infer<typeof insertAuditCycleUsageSchema>;

// Audit Total Vending table for tracking machine revenue and cycle performance
export const auditTotalVending = pgTable("audit_total_vending", {
  id: serial("id").primaryKey(),
  locationId: text("location_id"),
  locationName: text("location_name"),
  machineId: text("machine_id"),
  machineName: text("machine_name"),
  totalCycles: integer("total_cycles"),
  totalVended: integer("total_vended"),
  firstReceivedAt: timestamp("first_received_at"),
  lastReceivedAt: timestamp("last_received_at"),
  machineTypeName: text("machine_type_name"),
  machineTypeDesc: text("machine_type_desc"),
  isWasher: boolean("is_washer"),
  isDryer: boolean("is_dryer"),
  isCombo: boolean("is_combo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertAuditTotalVendingSchema = createInsertSchema(auditTotalVending).pick({
  locationId: true,
  locationName: true,
  machineId: true,
  machineName: true,
  totalCycles: true,
  totalVended: true,
  firstReceivedAt: true,
  lastReceivedAt: true,
  machineTypeName: true,
  machineTypeDesc: true,
  isWasher: true,
  isDryer: true,
  isCombo: true
});

export type AuditTotalVending = typeof auditTotalVending.$inferSelect;
export type InsertAuditTotalVending = z.infer<typeof insertAuditTotalVendingSchema>;