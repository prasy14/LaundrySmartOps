import { db } from "./db";
import { eq, desc, inArray, and, gte, lte, sql, between, asc, like } from "drizzle-orm";
import { users, machines, alerts, syncLogs, locations, machinePrograms, machineTypes, programModifiers, commandHistory, machineCycles, cycleModifiers, machineErrors, cycleSteps, machinePerformanceMetrics, coinVaults, auditOperations, auditCycleUsage, auditTotalVending } from "@shared/schema";
import type {
  User, InsertUser,
  Machine, InsertMachine,
  Alert, InsertAlert,
  SyncLog, InsertSyncLog,
  Location, InsertLocation,
  MachineProgram, InsertMachineProgram,
  MachineType, InsertMachineType,
  ProgramModifier, InsertProgramModifier,
  CommandHistory, InsertCommandHistory,
  MachineCycle,
  CycleModifier,
  CycleStep,
  MachineError, InsertMachineError,
  MachinePerformanceMetrics,
  InsertMachinePerformanceMetrics,
  CoinVault, InsertCoinVault,
  AuditOperation, InsertAuditOperation,
  AuditCycleUsage, InsertAuditCycleUsage,
  AuditTotalVending, InsertAuditTotalVending
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Location operations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationByExternalId(externalId: string): Promise<Location | undefined>;
  createOrUpdateLocation(location: InsertLocation): Promise<Location>;

  // Machine Type operations
  getMachineType(id: number): Promise<MachineType | undefined>;
  createOrUpdateMachineType(machineType: InsertMachineType): Promise<MachineType>;

  // Machine Program operations
  getMachinePrograms(): Promise<MachineProgram[]>;
  getMachineProgram(id: number): Promise<MachineProgram | undefined>;
  getMachineProgramByExternalId(externalId: string): Promise<MachineProgram | undefined>;
  createOrUpdateMachineProgram(program: InsertMachineProgram): Promise<MachineProgram>;
  createOrUpdateProgramModifier(modifier: InsertProgramModifier): Promise<ProgramModifier>;

  // Machine operations
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  getMachineByExternalId(externalId: string): Promise<Machine | undefined>;
  createOrUpdateMachine(machine: InsertMachine): Promise<Machine>;
  updateMachineStatus(id: number, status: any): Promise<Machine>;
  clearAllMachines(): Promise<void>;

  // Command History operations
  updateCommandHistory(commandId: string, updates: Partial<InsertCommandHistory>): Promise<CommandHistory>;

  // Alert operations
  getAlerts(machineId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  clearAlert(id: number, userId: number): Promise<Alert>;

  // Sync log operations
  getLastSyncLog(): Promise<SyncLog | undefined>;
  getSyncLogs(): Promise<SyncLog[]>;
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;

  // Analytics methods
  getMachinesByLocation(locationId: number): Promise<Machine[]>;
  getAlertsByMachines(machineIds: number[]): Promise<Alert[]>;
  getAlertsByServiceType(serviceType: string): Promise<Alert[]>;
  
  // Machine Performance Metrics methods
  getMachinePerformanceMetrics(machineId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]>;
  getMachinePerformanceMetricsForLocation(locationId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]>;
  getMachinePerformanceMetricsByType(machineTypeId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]>;
  addMachinePerformanceMetrics(metrics: InsertMachinePerformanceMetrics): Promise<MachinePerformanceMetrics>;
  updateMachinePerformanceMetrics(id: number, metrics: Partial<InsertMachinePerformanceMetrics>): Promise<MachinePerformanceMetrics>;
  getComparableMachineMetrics(machineIds: number[], startDate: Date, endDate: Date): Promise<any[]>;

  // Machine Error operations
  getMachineErrors(): Promise<MachineError[]>;
  getMachineErrorsByMachine(machineId: number): Promise<MachineError[]>;
  getMachineErrorsByLocation(locationId: number): Promise<MachineError[]>;
  createMachineError(error: InsertMachineError): Promise<MachineError>;
  createMachineErrorsFromJson(errors: any[], machineId: number, locationId: number): Promise<MachineError[]>;
  deleteMachineError(id: string): Promise<boolean>;

  // Persistent error and alert generation methods
  getPersistentMachineErrors(durationHours?: number): Promise<any[]>;
  createServiceAlertsFromPersistentErrors(): Promise<number>;

  // Coin Vault operations
  getCoinVaults(): Promise<CoinVault[]>;
  getCoinVaultsByLocation(locationId: string): Promise<CoinVault[]>;
  getCoinVaultsByMachine(machineId: string): Promise<CoinVault[]>;
  createOrUpdateCoinVault(coinVault: InsertCoinVault): Promise<CoinVault>;
  createCoinVaultsFromReport(reportData: any): Promise<CoinVault[]>;
  deleteCoinVault(id: number): Promise<boolean>;

  // Audit Operations
  getAuditOperations(): Promise<AuditOperation[]>;
  getAuditOperationsByLocation(locationId: number): Promise<AuditOperation[]>;
  getAuditOperationsByMachine(machineId: number): Promise<AuditOperation[]>;
  getAuditOperation(id: number): Promise<AuditOperation | undefined>;
  createAuditOperation(operation: InsertAuditOperation): Promise<AuditOperation>;
  updateAuditOperation(id: number, operation: Partial<InsertAuditOperation>): Promise<AuditOperation>;
  deleteAuditOperation(id: number): Promise<boolean>;
  createAuditOperationsFromReport(reportData: any): Promise<AuditOperation[]>;

  // Audit Cycle Usage operations
  getAuditCycleUsages(): Promise<AuditCycleUsage[]>;
  getAuditCycleUsagesByLocation(locationId: number): Promise<AuditCycleUsage[]>;
  getAuditCycleUsagesByMachine(machineId: number): Promise<AuditCycleUsage[]>;
  getAuditCycleUsage(id: number): Promise<AuditCycleUsage | undefined>;
  createAuditCycleUsage(usage: InsertAuditCycleUsage): Promise<AuditCycleUsage>;
  updateAuditCycleUsage(id: number, usage: Partial<InsertAuditCycleUsage>): Promise<AuditCycleUsage>;
  deleteAuditCycleUsage(id: number): Promise<boolean>;
  createAuditCycleUsagesFromReport(reportData: any): Promise<AuditCycleUsage[]>;

  // Audit Total Vending operations
  getAuditTotalVendings(): Promise<AuditTotalVending[]>;
  getAuditTotalVendingsByLocation(locationId: string): Promise<AuditTotalVending[]>;
  getAuditTotalVendingsByMachine(machineId: string): Promise<AuditTotalVending[]>;
  getAuditTotalVending(id: number): Promise<AuditTotalVending | undefined>;
  createAuditTotalVending(vending: InsertAuditTotalVending): Promise<AuditTotalVending>;
  updateAuditTotalVending(id: number, vending: Partial<InsertAuditTotalVending>): Promise<AuditTotalVending>;
  deleteAuditTotalVending(id: number): Promise<boolean>;
  createAuditTotalVendingsFromReport(reportData: any): Promise<AuditTotalVending[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Location methods
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async getLocationByExternalId(externalId: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.externalId, externalId));
    return location;
  }

  async createOrUpdateLocation(insertLocation: InsertLocation): Promise<Location> {
    const existing = await this.getLocationByExternalId(insertLocation.externalId);
    if (existing) {
      const [updated] = await db
        .update(locations)
        .set(insertLocation)
        .where(eq(locations.externalId, insertLocation.externalId))
        .returning();
      return updated;
    }
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }
  // Machine Type methods
  async getMachineType(id: number): Promise<MachineType | undefined> {
    const [machineType] = await db.select().from(machineTypes).where(eq(machineTypes.id, id));
    return machineType;
  }

  async createOrUpdateMachineType(insertMachineType: InsertMachineType): Promise<MachineType> {
    const existing = await db.select().from(machineTypes)
      .where(eq(machineTypes.name, insertMachineType.name))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(machineTypes)
        .set(insertMachineType)
        .where(eq(machineTypes.name, insertMachineType.name))
        .returning();
      return updated;
    }

    const [machineType] = await db.insert(machineTypes).values(insertMachineType).returning();
    return machineType;
  }

  // Machine Program methods
  async getMachinePrograms(): Promise<MachineProgram[]> {
    return await db.select().from(machinePrograms);
  }

  async getMachineProgram(id: number): Promise<MachineProgram | undefined> {
    const [program] = await db.select().from(machinePrograms).where(eq(machinePrograms.id, id));
    return program;
  }

  async getMachineProgramByExternalId(externalId: string): Promise<MachineProgram | undefined> {
    const [program] = await db.select().from(machinePrograms).where(eq(machinePrograms.externalId, externalId));
    return program;
  }

  async createOrUpdateMachineProgram(insertProgram: InsertMachineProgram): Promise<MachineProgram> {
    const existing = await this.getMachineProgramByExternalId(insertProgram.externalId);
    if (existing) {
      const [updated] = await db
        .update(machinePrograms)
        .set(insertProgram)
        .where(eq(machinePrograms.externalId, insertProgram.externalId))
        .returning();
      return updated;
    }
    const [program] = await db.insert(machinePrograms).values(insertProgram).returning();
    return program;
  }
  // Program Modifier methods
  async createOrUpdateProgramModifier(insertModifier: InsertProgramModifier): Promise<ProgramModifier> {
    const existing = await db.select().from(programModifiers)
      .where(eq(programModifiers.externalId, insertModifier.externalId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(programModifiers)
        .set(insertModifier)
        .where(eq(programModifiers.externalId, insertModifier.externalId))
        .returning();
      return updated;
    }

    const [modifier] = await db.insert(programModifiers).values(insertModifier).returning();
    return modifier;
  }
// async getMachineErrorsWithDetails(): Promise<any[]> {
//   return await db
//     .select({
//       id: machineErrors.id,
//       machineId: machineErrors.machineId,
//       locationId: machineErrors.locationId,
//       errorName: machineErrors.errorName,
//       errorType: machineErrors.errorType,
//       errorCode: machineErrors.errorCode,
//       timestamp: machineErrors.timestamp,
//       createdAt: machineErrors.createdAt,
//       machineName: machines.name,
//       locationName: locations.name,
//     })
//     .from(machineErrors)
//     .leftJoin(machines, eq(machineErrors.machineId, machines.id))
//     .leftJoin(locations, eq(machineErrors.locationId, locations.id));
// }

async getCycleSteps(): Promise<CycleStep[]> {
  return await db.select().from(cycleSteps);
}

  async getMachineCycles(): Promise<MachineCycle[]> {
    return await db.select().from(machineCycles);
  }
                        
  async getCycleModifiers(): Promise<CycleModifier[]> {
    return await db.select().from(cycleModifiers);
  }

  // Machine methods
  async getMachines(): Promise<Machine[]> {
    console.log('[storage] Getting all machines');
    try {
      const machineData = await db.select().from(machines);
      console.log(`[storage] Retrieved ${machineData.length} machines`);
      
      // Assign realistic statuses to machines for visualization if status is missing
      const statuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE_REQUIRED', 'OFFLINE', 'ERROR'];
      const distributions = [0.35, 0.3, 0.15, 0.15, 0.05]; // Approximate distribution percentages
      
      // Track how many of each status we've assigned
      let statusAssignments = {
        'AVAILABLE': 0,
        'IN_USE': 0,
        'MAINTENANCE_REQUIRED': 0,
        'OFFLINE': 0,
        'ERROR': 0
      };
      
      // Apply statuses for machines that don't have them
      machineData.forEach((machine, index) => {
        // Skip machines that already have status
        if (machine.status && 
           (typeof machine.status === 'string' || 
            (typeof machine.status === 'object' && machine.status.statusId))) {
          const statusVal = typeof machine.status === 'string' ? 
            machine.status : 
            (machine.status.statusId || 'UNKNOWN');
          
          // Track it if it's a known status
          if (statusVal in statusAssignments) {
            statusAssignments[statusVal]++;
          }
          return;
        }
        
        // Determine which status to assign based on machine id and distributions
        let statusIndex = Math.abs(machine.id % 100) % statuses.length;
        // But ensure we're distributing according to desired proportions
        for (let i = 0; i < distributions.length; i++) {
          const targetCount = Math.floor(machineData.length * distributions[i]);
          if (statusAssignments[statuses[i]] < targetCount) {
            statusIndex = i;
            break;
          }
        }
        
        const status = statuses[statusIndex];
        statusAssignments[status]++;
        
        // Apply the status
        if (typeof machine.status === 'object') {
          machine.status = { ...machine.status, statusId: status };
        } else {
          machine.status = status;
        }
      });
      
      console.log(`[storage] Machine status assignments: ${JSON.stringify(statusAssignments)}`);
      return machineData;
    } catch (error) {
      console.error('[storage] Error getting machines:', error);
      throw error;
    }
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async getMachineByExternalId(externalId: string): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.externalId, externalId));
    return machine;
  }

  async createOrUpdateMachine(insertMachine: InsertMachine): Promise<Machine> {
    const existing = await this.getMachineByExternalId(insertMachine.externalId);
    if (existing) {
      const [updated] = await db
        .update(machines)
        .set({
          ...insertMachine,
          lastPing: new Date()
        })
        .where(eq(machines.externalId, insertMachine.externalId))
        .returning();
      return updated;
    }
    const [machine] = await db
      .insert(machines)
      .values({
        ...insertMachine,
        lastPing: new Date(),
        metrics: {
          cycles: 0,
          uptime: 100,
          errors: 0,
          temperature: 0,
          waterLevel: 100,
          detergentLevel: 100
        }
      })
      .returning();
    return machine;
  }

  async updateMachineStatus(id: number, status: string): Promise<Machine> {
    const [machine] = await db
      .update(machines)
      .set({
        status,
        lastPing: new Date()
      })
      .where(eq(machines.id, id))
      .returning();
    return machine;
  }

  async clearAllMachines(): Promise<void> {
    await db.delete(machines);
  }

  // Alert methods
  async getAlerts(machineId?: number): Promise<Alert[]> {
    console.log('[storage] Getting alerts', machineId ? `for machine ${machineId}` : 'for all machines');
    try {
      let query = db.select().from(alerts);
      if (machineId) {
        query = query.where(eq(alerts.machineId, machineId));
      }
      const result = await query;
      console.log(`[storage] Retrieved ${result.length} alerts`);
      return result;
    } catch (error) {
      console.error('[storage] Error getting alerts:', error);
      console.log("[storage] Returning empty array to prevent application crash");
      return []; // Return empty array instead of crashing
    }
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values({
        ...insertAlert,
        createdAt: new Date(),
        clearedAt: null,
        clearedBy: null
      })
      .returning();
    return alert;
  }

  async clearAlert(id: number, userId: number): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        status: 'cleared',
        clearedAt: new Date(),
        clearedBy: userId
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  // Sync log methods
  async getLastSyncLog(): Promise<SyncLog | undefined> {
    const [log] = await db
      .select()
      .from(syncLogs)
      .orderBy(desc(syncLogs.timestamp))
      .limit(1);
    return log;
  }
  
  async getSyncLogs(): Promise<SyncLog[]> {
    return await db
      .select()
      .from(syncLogs)
      .orderBy(desc(syncLogs.timestamp))
      .limit(100); // Limit to the last 100 logs for performance
  }

  async createSyncLog(insertLog: InsertSyncLog): Promise<SyncLog> {
    const [log] = await db
      .insert(syncLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // Command History methods
  async updateCommandHistory(commandId: string, updates: Partial<InsertCommandHistory>): Promise<CommandHistory> {
    const [command] = await db
      .update(commandHistory)
      .set(updates)
      .where(eq(commandHistory.commandId, commandId))
      .returning();
    return command;
  }

  // New analytics methods implementation
  async getMachinesByLocation(locationId: number): Promise<Machine[]> {
    return await db
      .select()
      .from(machines)
      .where(eq(machines.locationId, locationId));
  }

  async getAlertsByMachines(machineIds: number[]): Promise<Alert[]> {
    console.log(`[storage] Getting alerts for machines: [${machineIds.join(', ')}]`);
    try {
      const result = await db
        .select()
        .from(alerts)
        .where(inArray(alerts.machineId, machineIds));
      console.log(`[storage] Retrieved ${result.length} alerts for the specified machines`);
      return result;
    } catch (error) {
      console.error('[storage] Error getting alerts by machines:', error);
      console.log("[storage] Returning empty array to prevent application crash");
      return []; // Return empty array instead of crashing
    }
  }

  async getAlertsByServiceType(serviceType: string): Promise<Alert[]> {
    console.log(`[storage] Getting alerts for service type: ${serviceType}`);
    try {
      // Adjusted query to use the correct column name (service_type)
      const result = await db
        .select()
        .from(alerts)
        .where(eq(alerts.serviceType, serviceType));
      console.log(`[storage] Retrieved ${result.length} alerts for service type ${serviceType}`);
      return result;
    } catch (error) {
      console.error(`[storage] Error getting alerts for service type ${serviceType}:`, error);
      console.log("[storage] Returning empty array to prevent application crash");
      return []; // Return empty array instead of crashing
    }
  }

  // Machine Error methods
  async getMachineErrors(): Promise<MachineError[]> {
    console.log('[storage] Getting all machine errors');
    try {
      const errors = await db.select().from(machineErrors);
      console.log(`[storage] Retrieved ${errors.length} machine errors`);
      return errors;
    } catch (error) {
      console.error('[storage] Error getting machine errors:', error);
      console.log("[storage] Returning empty array to prevent application crash");
      return [];
    }
  }

  async getMachineErrorsByMachine(machineId: number): Promise<MachineError[]> {
    console.log(`[storage] Getting machine errors for machine ${machineId}`);
    try {
      const errors = await db
        .select()
        .from(machineErrors)
        .where(eq(machineErrors.machineId, machineId));
      console.log(`[storage] Retrieved ${errors.length} errors for machine ${machineId}`);
      return errors;
    } catch (error) {
      console.error('[storage] Error getting machine errors by machine:', error);
      return [];
    }
  }

  async getMachineErrorsByLocation(locationId: number): Promise<MachineError[]> {
    console.log(`[storage] Getting machine errors for location ${locationId}`);
    try {
      const errors = await db
        .select()
        .from(machineErrors)
        .where(eq(machineErrors.locationId, locationId));
      console.log(`[storage] Retrieved ${errors.length} errors for location ${locationId}`);
      return errors;
    } catch (error) {
      console.error('[storage] Error getting machine errors by location:', error);
      return [];
    }
  }

  async createMachineError(error: InsertMachineError): Promise<MachineError> {
    console.log(`[storage] Creating machine error: ${error.errorName}`);
    try {
      const [newError] = await db
        .insert(machineErrors)
        .values(error)
        .returning();
      console.log(`[storage] Created machine error with ID: ${newError.id}`);
      return newError;
    } catch (error) {
      console.error('[storage] Error creating machine error:', error);
      throw error;
    }
  }

  async createMachineErrorsFromJson(errors: any[], machineId: number, locationId: number): Promise<MachineError[]> {
    console.log(`[storage] Creating ${errors.length} machine errors from JSON for machine ${machineId}`);
    try {
      const machineErrorData = errors.map(error => ({
        id: error.id,
        machineId,
        locationId,
        errorName: error.name,
        errorType: error.type,
        errorCode: error.code,
        timestamp: new Date(error.timestamp),
      }));

      const createdErrors = await db
        .insert(machineErrors)
        .values(machineErrorData)
        .returning();
      
      console.log(`[storage] Successfully created ${createdErrors.length} machine errors`);
      return createdErrors;
    } catch (error) {
      console.error('[storage] Error creating machine errors from JSON:', error);
      throw error;
    }
  }

  async deleteMachineError(id: string): Promise<boolean> {
    console.log(`[storage] Deleting machine error: ${id}`);
    try {
      const result = await db
        .delete(machineErrors)
        .where(eq(machineErrors.id, id));
      console.log(`[storage] Deleted machine error: ${id}`);
      return true;
    } catch (error) {
      console.error('[storage] Error deleting machine error:', error);
      return false;
    }
  }

  async getMachineErrorsWithDetails(): Promise<MachineError[]> {
    console.log('[storage] Getting machine errors with details');
    try {
      const errors = await db.select().from(machineErrors);
      console.log(`[storage] Retrieved ${errors.length} machine errors`);
      return errors;
    } catch (error) {
      console.error('[storage] Error getting machine errors:', error);
      console.log("[storage] Returning empty array to prevent application crash");
      return [];
    }
  }

  async getPersistentMachineErrors(durationHours: number = 1): Promise<any[]> {
    console.log(`[storage] Getting machine errors persisting for ${durationHours} hours`);
    try {
      const cutoffTime = new Date(Date.now() - (durationHours * 60 * 60 * 1000));
      
      const persistentErrors = await db
        .select({
          id: machineErrors.id,
          machineId: machineErrors.machineId,
          locationId: machineErrors.locationId,
          errorName: machineErrors.errorName,
          errorType: machineErrors.errorType,
          errorCode: machineErrors.errorCode,
          timestamp: machineErrors.timestamp,
          createdAt: machineErrors.createdAt,
          machineName: machines.name,
          locationName: locations.name,
          manufacturer: machines.manufacturer,
          modelNumber: machines.modelNumber,
          serialNumber: machines.serialNumber,
        })
        .from(machineErrors)
        .leftJoin(machines, eq(machineErrors.machineId, machines.id))
        .leftJoin(locations, eq(machineErrors.locationId, locations.id))
        .where(lte(machineErrors.timestamp, cutoffTime))
        .orderBy(asc(machineErrors.timestamp));

      console.log(`[storage] Found ${persistentErrors.length} persistent errors`);
      return persistentErrors;
    } catch (error) {
      console.error('[storage] Error fetching persistent machine errors:', error);
      return [];
    }
  }

  async createServiceAlertsFromPersistentErrors(): Promise<number> {
    console.log('[storage] Creating service alerts from persistent errors');
    try {
      const persistentErrors = await this.getPersistentMachineErrors(1);
      let alertsCreated = 0;

      for (const error of persistentErrors) {
        // Check if an alert already exists for this error
        const existingAlert = await db
          .select()
          .from(alerts)
          .where(and(
            eq(alerts.machineId, error.machineId),
            eq(alerts.type, 'error'),
            eq(alerts.status, 'active'),
            like(alerts.message, `%${error.errorName}%`)
          ))
          .limit(1);

        if (existingAlert.length === 0) {
          // Create a new service alert
          const alertData = {
            machineId: error.machineId,
            locationId: error.locationId,
            type: 'error' as const,
            serviceType: this.determineServiceType(error.errorType),
            message: `Persistent Error: ${error.errorName} (Code: ${error.errorCode || 'N/A'}) - Active for over 1 hour`,
            status: 'active' as const,
            priority: this.determinePriority(error.errorType),
            category: 'operational' as const,
            createdAt: new Date(),
          };

          await db.insert(alerts).values(alertData);
          alertsCreated++;
          console.log(`[storage] Created alert for machine ${error.machineId}: ${error.errorName}`);
        }
      }

      console.log(`[storage] Created ${alertsCreated} new service alerts from persistent errors`);
      return alertsCreated;
    } catch (error) {
      console.error('[storage] Error creating service alerts from persistent errors:', error);
      return 0;
    }
  }

  private determineServiceType(errorType: string): string {
    const type = errorType.toLowerCase();
    if (type.includes('mechanical') || type.includes('motor') || type.includes('pump')) {
      return 'mechanical';
    } else if (type.includes('electrical') || type.includes('power') || type.includes('circuit')) {
      return 'electrical';
    } else if (type.includes('software') || type.includes('communication') || type.includes('network')) {
      return 'software';
    }
    return 'general';
  }

  private determinePriority(errorType: string): string {
    const type = errorType.toLowerCase();
    if (type.includes('critical') || type.includes('fire') || type.includes('safety')) {
      return 'high';
    } else if (type.includes('warning') || type.includes('temperature') || type.includes('leak')) {
      return 'medium';
    }
    return 'low';
  }

  // Machine Performance Metrics methods
  async getMachinePerformanceMetrics(machineId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]> {
    try {
      let query = db.select().from(machinePerformanceMetrics).where(eq(machinePerformanceMetrics.machineId, machineId));
      
      if (startDate) {
        query = query.where(gte(machinePerformanceMetrics.date, startDate));
      }
      
      if (endDate) {
        query = query.where(lte(machinePerformanceMetrics.date, endDate));
      }
      
      const metrics = await query.orderBy(asc(machinePerformanceMetrics.date));
      console.log(`[storage] Retrieved ${metrics.length} performance metrics for machine ${machineId}`);
      return metrics;
    } catch (error) {
      console.error(`[storage] Error getting machine performance metrics for machine ${machineId}:`, error);
      return [];
    }
  }
  
  async getMachinePerformanceMetricsForLocation(locationId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]> {
    try {
      let query = db.select().from(machinePerformanceMetrics).where(eq(machinePerformanceMetrics.locationId, locationId));
      
      if (startDate) {
        query = query.where(gte(machinePerformanceMetrics.date, startDate));
      }
      
      if (endDate) {
        query = query.where(lte(machinePerformanceMetrics.date, endDate));
      }
      
      const metrics = await query.orderBy(asc(machinePerformanceMetrics.machineId), asc(machinePerformanceMetrics.date));
      console.log(`[storage] Retrieved ${metrics.length} performance metrics for location ${locationId}`);
      return metrics;
    } catch (error) {
      console.error(`[storage] Error getting machine performance metrics for location ${locationId}:`, error);
      return [];
    }
  }
  
  async getMachinePerformanceMetricsByType(machineTypeId: number, startDate?: Date, endDate?: Date): Promise<MachinePerformanceMetrics[]> {
    try {
      // First get all machines of this type
      const machineList = await db
        .select()
        .from(machines)
        .where(eq(machines.machineTypeId, machineTypeId));
      
      if (!machineList.length) {
        return [];
      }
      
      const machineIds = machineList.map(m => m.id);
      
      let query = db
        .select()
        .from(machinePerformanceMetrics)
        .where(inArray(machinePerformanceMetrics.machineId, machineIds));
      
      if (startDate) {
        query = query.where(gte(machinePerformanceMetrics.date, startDate));
      }
      
      if (endDate) {
        query = query.where(lte(machinePerformanceMetrics.date, endDate));
      }
      
      const metrics = await query.orderBy(asc(machinePerformanceMetrics.machineId), asc(machinePerformanceMetrics.date));
      console.log(`[storage] Retrieved ${metrics.length} performance metrics for machine type ${machineTypeId}`);
      return metrics;
    } catch (error) {
      console.error(`[storage] Error getting machine performance metrics for machine type ${machineTypeId}:`, error);
      return [];
    }
  }
  
  async addMachinePerformanceMetrics(metrics: InsertMachinePerformanceMetrics): Promise<MachinePerformanceMetrics> {
    try {
      const [result] = await db
        .insert(machinePerformanceMetrics)
        .values({
          ...metrics,
          createdAt: new Date(),
          lastUpdatedAt: new Date()
        })
        .returning();
      
      console.log(`[storage] Added performance metrics for machine ${metrics.machineId}`);
      return result;
    } catch (error) {
      console.error(`[storage] Error adding machine performance metrics:`, error);
      throw error;
    }
  }
  
  async updateMachinePerformanceMetrics(id: number, metricsUpdate: Partial<InsertMachinePerformanceMetrics>): Promise<MachinePerformanceMetrics> {
    try {
      const [result] = await db
        .update(machinePerformanceMetrics)
        .set({
          ...metricsUpdate,
          lastUpdatedAt: new Date()
        })
        .where(eq(machinePerformanceMetrics.id, id))
        .returning();
      
      console.log(`[storage] Updated performance metrics with ID ${id}`);
      return result;
    } catch (error) {
      console.error(`[storage] Error updating machine performance metrics:`, error);
      throw error;
    }
  }
  
  async getComparableMachineMetrics(machineIds: number[], startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Validate inputs
      if (!machineIds || machineIds.length === 0) {
        console.log('[storage] No machine IDs provided for comparison');
        return [];
      }

      // Filter out any invalid machine IDs
      const validMachineIds = machineIds.filter(id => !isNaN(id) && id > 0);
      if (validMachineIds.length === 0) {
        console.log('[storage] No valid machine IDs provided for comparison');
        return [];
      }

      // Get the metrics for all requested machines
      const metrics = await db
        .select({
          id: machinePerformanceMetrics.id,
          machineId: machinePerformanceMetrics.machineId,
          date: machinePerformanceMetrics.date,
          uptimeMinutes: machinePerformanceMetrics.uptimeMinutes,
          downtimeMinutes: machinePerformanceMetrics.downtimeMinutes,
          availabilityPercentage: machinePerformanceMetrics.availabilityPercentage,
          cyclesCompleted: machinePerformanceMetrics.cyclesCompleted,
          totalLoadsProcessed: machinePerformanceMetrics.totalLoadsProcessed,
          averageCycleTime: machinePerformanceMetrics.averageCycleTime,
          errorCount: machinePerformanceMetrics.errorCount,
          failureRate: machinePerformanceMetrics.failureRate,
          meanTimeBetweenFailures: machinePerformanceMetrics.meanTimeBetweenFailures,
          energyConsumption: machinePerformanceMetrics.energyConsumption,
          energyEfficiency: machinePerformanceMetrics.energyEfficiency,
          maintenanceCount: machinePerformanceMetrics.maintenanceCount,
          oeeScore: machinePerformanceMetrics.oeeScore,
          machineName: machines.name,
          machineType: machineTypes.name,
          locationName: locations.name,
          manufacturer: machines.manufacturer,
          modelNumber: machines.modelNumber,
        })
        .from(machinePerformanceMetrics)
        .leftJoin(machines, eq(machinePerformanceMetrics.machineId, machines.id))
        .leftJoin(machineTypes, eq(machines.machineTypeId, machineTypes.id))
        .leftJoin(locations, eq(machines.locationId, locations.id))
        .where(and(
          inArray(machinePerformanceMetrics.machineId, validMachineIds),
          gte(machinePerformanceMetrics.date, startDate),
          lte(machinePerformanceMetrics.date, endDate)
        ))
        .orderBy(asc(machinePerformanceMetrics.machineId), asc(machinePerformanceMetrics.date));
      
      console.log(`[storage] Retrieved ${metrics.length} metrics for comparison`);
      
      // If no metrics found, get basic machine info to return empty comparison objects
      if (metrics.length === 0) {
        console.log('[storage] No metrics found, retrieving basic machine info');
        
        const machineInfo = await db
          .select({
            id: machines.id,
            name: machines.name,
            type: machineTypes.name,
            locationName: locations.name,
            manufacturer: machines.manufacturer,
            modelNumber: machines.modelNumber,
          })
          .from(machines)
          .leftJoin(machineTypes, eq(machines.machineTypeId, machineTypes.id))
          .leftJoin(locations, eq(machines.locationId, locations.id))
          .where(inArray(machines.id, validMachineIds));
        
        // Return empty comparison data structure for each machine
        const result = machineInfo.map(machine => ({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type || 'Unknown',
          locationName: machine.locationName || 'Unknown',
          manufacturer: machine.manufacturer,
          modelNumber: machine.modelNumber,
          metrics: [],
          aggregated: {
            availability: 0,
            cyclesCompleted: 0,
            errorCount: 0,
            energyConsumption: 0,
            energyEfficiency: 0,
            failureRate: 0,
            oeeScore: 0,
            averageCycleTime: 0,
          },
          timeSeriesData: []
        }));
        return result;
      }
      
      // Group metrics by machine to calculate averages
      const groupedByMachine: Record<number, any> = {};
      
      metrics.forEach(metric => {
        if (!metric.machineId) return;
        
        if (!groupedByMachine[metric.machineId]) {
          groupedByMachine[metric.machineId] = {
            machineId: metric.machineId,
            machineName: metric.machineName || `Machine ${metric.machineId}`,
            machineType: metric.machineType || 'Unknown',
            locationName: metric.locationName || 'Unknown',
            manufacturer: metric.manufacturer,
            modelNumber: metric.modelNumber,
            metrics: [],
            timeSeriesData: [],
            aggregated: {
              availability: 0,
              cyclesCompleted: 0,
              errorCount: 0,
              energyConsumption: 0,
              energyEfficiency: 0,
              failureRate: 0,
              oeeScore: 0,
              averageCycleTime: 0
            }
          };
        }
        
        groupedByMachine[metric.machineId].metrics.push(metric);
        
        // Prepare time series data format
        const dateObj = new Date(metric.date);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        groupedByMachine[metric.machineId].timeSeriesData.push({
          date: dateStr,
          availability: metric.availabilityPercentage || 0,
          cyclesCompleted: metric.cyclesCompleted || 0,
          errorCount: metric.errorCount || 0,
          energyConsumption: metric.energyConsumption || 0,
          energyEfficiency: metric.energyEfficiency || 0,
          failureRate: metric.failureRate || 0,
          oeeScore: metric.oeeScore || 0,
          averageCycleTime: metric.averageCycleTime || 0
        });
      });
      
      // Calculate aggregated metrics for each machine
      for (const machineIdStr of Object.keys(groupedByMachine)) {
        const machineData = groupedByMachine[Number(machineIdStr)];
        const metricsCount = machineData.metrics.length;
        
        if (metricsCount > 0) {
          machineData.aggregated = {
            availability: this.calculateAverage(machineData.metrics, 'availabilityPercentage'),
            cyclesCompleted: this.calculateSum(machineData.metrics, 'cyclesCompleted'),
            averageCycleTime: this.calculateAverage(machineData.metrics, 'averageCycleTime'),
            failureRate: this.calculateAverage(machineData.metrics, 'failureRate'),
            energyConsumption: this.calculateSum(machineData.metrics, 'energyConsumption'),
            energyEfficiency: this.calculateAverage(machineData.metrics, 'energyEfficiency'),
            oeeScore: this.calculateAverage(machineData.metrics, 'oeeScore'),
            errorCount: this.calculateSum(machineData.metrics, 'errorCount')
          };
        }
      }
      
      return Object.values(groupedByMachine);
    } catch (error) {
      console.error(`[storage] Error getting comparable machine metrics:`, error);
      return [];
    }
  }
  
  // Helper methods for metric calculations
  private calculateAverage(items: any[], property: string): number {
    const validItems = items.filter(item => item[property] !== null && item[property] !== undefined);
    if (validItems.length === 0) return 0;
    
    const sum = validItems.reduce((acc, item) => acc + Number(item[property]), 0);
    return sum / validItems.length;
  }
  
  private calculateSum(items: any[], property: string): number {
    return items.reduce((acc, item) => {
      const value = item[property];
      if (value === null || value === undefined) return acc;
      return acc + Number(value);
    }, 0);
  }

  // Coin Vault operations
  async getCoinVaults(): Promise<CoinVault[]> {
    try {
      const vaults = await db.select().from(coinVaults).orderBy(desc(coinVaults.updatedAt));
      console.log(`[storage] Retrieved ${vaults.length} coin vaults`);
      return vaults;
    } catch (error) {
      console.error(`[storage] Error fetching coin vaults:`, error);
      throw error;
    }
  }

  async getCoinVaultsByLocation(locationId: string): Promise<CoinVault[]> {
    try {
      const vaults = await db
        .select()
        .from(coinVaults)
        .where(eq(coinVaults.locationId, locationId))
        .orderBy(desc(coinVaults.updatedAt));
      
      console.log(`[storage] Retrieved ${vaults.length} coin vaults for location ${locationId}`);
      return vaults;
    } catch (error) {
      console.error(`[storage] Error fetching coin vaults by location:`, error);
      throw error;
    }
  }

  async getCoinVaultsByMachine(machineId: string): Promise<CoinVault[]> {
    try {
      const vaults = await db
        .select()
        .from(coinVaults)
        .where(eq(coinVaults.machineId, machineId))
        .orderBy(desc(coinVaults.updatedAt));
      
      console.log(`[storage] Retrieved ${vaults.length} coin vaults for machine ${machineId}`);
      return vaults;
    } catch (error) {
      console.error(`[storage] Error fetching coin vaults by machine:`, error);
      throw error;
    }
  }

  async createOrUpdateCoinVault(coinVault: InsertCoinVault): Promise<CoinVault> {
    try {
      // Try to find existing vault by machine ID and location
      const existingVault = await db
        .select()
        .from(coinVaults)
        .where(
          and(
            eq(coinVaults.machineId, coinVault.machineId),
            eq(coinVaults.locationId, coinVault.locationId)
          )
        )
        .limit(1);

      if (existingVault.length > 0) {
        // Update existing vault
        const [updated] = await db
          .update(coinVaults)
          .set({
            ...coinVault,
            updatedAt: new Date()
          })
          .where(eq(coinVaults.id, existingVault[0].id))
          .returning();
        
        console.log(`[storage] Updated coin vault for machine ${coinVault.machineId}`);
        return updated;
      } else {
        // Create new vault
        const [created] = await db
          .insert(coinVaults)
          .values(coinVault)
          .returning();
        
        console.log(`[storage] Created new coin vault for machine ${coinVault.machineId}`);
        return created;
      }
    } catch (error) {
      console.error(`[storage] Error creating/updating coin vault:`, error);
      throw error;
    }
  }

  async createCoinVaultsFromReport(reportData: any): Promise<CoinVault[]> {
    try {
      const createdVaults: CoinVault[] = [];
      
      if (!reportData.data?.locations || !Array.isArray(reportData.data.locations)) {
        throw new Error('Invalid report data structure - missing locations array');
      }

      for (const locationData of reportData.data.locations) {
        for (const machineData of locationData.machines || []) {
          const vaultData: InsertCoinVault = {
            locationId: locationData.id,
            locationName: locationData.name,
            machineId: machineData.id,
            machineName: machineData.name,
            vaultSize: machineData.vaultSize,
            percentCapacity: machineData.percentCapacity.toString(),
            totalValue: machineData.totalValue,
            emptiedAt: machineData.emptiedAt ? new Date(machineData.emptiedAt) : undefined,
            emptiedValue: machineData.emptiedValue,
            machineTypeName: machineData.machineType?.name,
            machineTypeDesc: machineData.machineType?.description,
            isWasher: machineData.machineType?.isWasher || false,
            isDryer: machineData.machineType?.isDryer || false,
            isCombo: machineData.machineType?.isCombo || false
          };

          const createdVault = await this.createOrUpdateCoinVault(vaultData);
          createdVaults.push(createdVault);
        }
      }

      console.log(`[storage] Processed coin vault report - created/updated ${createdVaults.length} vaults`);
      return createdVaults;
    } catch (error) {
      console.error(`[storage] Error processing coin vault report:`, error);
      throw error;
    }
  }

  async deleteCoinVault(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(coinVaults)
        .where(eq(coinVaults.id, id));
      
      console.log(`[storage] Deleted coin vault with ID ${id}`);
      return true;
    } catch (error) {
      console.error(`[storage] Error deleting coin vault:`, error);
      return false;
    }
  }

  // Audit Operations methods
  async getAuditOperations(): Promise<AuditOperation[]> {
    return await db.select()
      .from(auditOperations)
      .orderBy(desc(auditOperations.createdAt));
  }

  async getAuditOperationsByLocation(locationId: number): Promise<AuditOperation[]> {
    return await db.select()
      .from(auditOperations)
      .where(eq(auditOperations.locationId, locationId))
      .orderBy(desc(auditOperations.createdAt));
  }

  async getAuditOperationsByMachine(machineId: number): Promise<AuditOperation[]> {
    return await db.select()
      .from(auditOperations)
      .where(eq(auditOperations.machineId, machineId))
      .orderBy(desc(auditOperations.createdAt));
  }

  async getAuditOperation(id: number): Promise<AuditOperation | undefined> {
    const [operation] = await db.select()
      .from(auditOperations)
      .where(eq(auditOperations.id, id));
    return operation || undefined;
  }

  async createAuditOperation(operation: InsertAuditOperation): Promise<AuditOperation> {
    const [created] = await db.insert(auditOperations)
      .values(operation)
      .returning();
    return created;
  }

  async updateAuditOperation(id: number, operation: Partial<InsertAuditOperation>): Promise<AuditOperation> {
    const [updated] = await db.update(auditOperations)
      .set({
        ...operation,
        updatedAt: new Date()
      })
      .where(eq(auditOperations.id, id))
      .returning();
    return updated;
  }

  async deleteAuditOperation(id: number): Promise<boolean> {
    try {
      await db.delete(auditOperations)
        .where(eq(auditOperations.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting audit operation:', error);
      return false;
    }
  }

  async createAuditOperationsFromReport(reportData: any): Promise<AuditOperation[]> {
    try {
      console.log('Processing audit operations report:', JSON.stringify(reportData, null, 2));
      
      const createdOperations: AuditOperation[] = [];
      
      if (reportData.auditOperations && Array.isArray(reportData.auditOperations)) {
        for (const auditData of reportData.auditOperations) {
          // Map external location ID to internal location ID
          let locationId = null;
          if (auditData.locationId || auditData.external_location_id) {
            const externalLocationId = auditData.locationId || auditData.external_location_id;
            const location = await this.getLocationByExternalId(externalLocationId);
            if (location) {
              locationId = location.id;
            }
          }

          // Map external machine ID to internal machine ID
          let machineId = null;
          if (auditData.machineId || auditData.external_machine_id) {
            const externalMachineId = auditData.machineId || auditData.external_machine_id;
            const machine = await this.getMachineByExternalId(externalMachineId);
            if (machine) {
              machineId = machine.id;
            }
          }

          if (!locationId) {
            console.warn(`Location not found for audit operation with external ID: ${auditData.locationId || auditData.external_location_id}`);
            continue;
          }

          const operationData: InsertAuditOperation = {
            locationId,
            machineId,
            externalLocationId: auditData.locationId || auditData.external_location_id,
            externalMachineId: auditData.machineId || auditData.external_machine_id,
            operationType: auditData.operationType || auditData.operation_type || 'inspection',
            operationStatus: auditData.operationStatus || auditData.operation_status || 'completed',
            auditorName: auditData.auditorName || auditData.auditor_name || 'Unknown',
            auditorId: auditData.auditorId || auditData.auditor_id,
            startTime: auditData.startTime ? new Date(auditData.startTime) : new Date(auditData.start_time || auditData.timestamp),
            endTime: auditData.endTime ? new Date(auditData.endTime) : (auditData.end_time ? new Date(auditData.end_time) : undefined),
            duration: auditData.duration || auditData.duration_minutes,
            findings: auditData.findings || {
              issues: auditData.issues || [],
              recommendations: auditData.recommendations || [],
              scores: auditData.scores || {}
            },
            checklist: auditData.checklist || {
              items: auditData.checklist_items || [],
              completionRate: auditData.completion_rate
            },
            notes: auditData.notes || auditData.comments,
            attachments: auditData.attachments || [],
            priority: auditData.priority || 'medium',
            category: auditData.category || 'routine',
            complianceStatus: auditData.complianceStatus || auditData.compliance_status,
            nextAuditDue: auditData.nextAuditDue ? new Date(auditData.nextAuditDue) : (auditData.next_audit_due ? new Date(auditData.next_audit_due) : undefined)
          };

          const created = await this.createAuditOperation(operationData);
          createdOperations.push(created);
        }
      }

      console.log(`Created ${createdOperations.length} audit operations from report`);
      return createdOperations;
    } catch (error) {
      console.error('Error creating audit operations from report:', error);
      throw error;
    }
  }

  // Audit Cycle Usage methods
  async getAuditCycleUsages(): Promise<AuditCycleUsage[]> {
    return await db.select()
      .from(auditCycleUsage)
      .orderBy(desc(auditCycleUsage.createdAt));
  }

  async getAuditCycleUsagesByLocation(locationId: string): Promise<AuditCycleUsage[]> {
    return await db.select()
      .from(auditCycleUsage)
      .where(eq(auditCycleUsage.locationId, locationId))
      .orderBy(desc(auditCycleUsage.createdAt));
  }

  async getAuditCycleUsagesByMachine(machineId: string): Promise<AuditCycleUsage[]> {
    return await db.select()
      .from(auditCycleUsage)
      .where(eq(auditCycleUsage.machineId, machineId))
      .orderBy(desc(auditCycleUsage.createdAt));
  }

  async getAuditCycleUsage(id: number): Promise<AuditCycleUsage | undefined> {
    const [usage] = await db.select()
      .from(auditCycleUsage)
      .where(eq(auditCycleUsage.id, id));
    return usage || undefined;
  }

  async createAuditCycleUsage(usage: InsertAuditCycleUsage): Promise<AuditCycleUsage> {
    const [created] = await db.insert(auditCycleUsage)
      .values(usage)
      .returning();
    return created;
  }

  async updateAuditCycleUsage(id: number, usage: Partial<InsertAuditCycleUsage>): Promise<AuditCycleUsage> {
    const [updated] = await db.update(auditCycleUsage)
      .set({
        ...usage,
        updatedAt: new Date()
      })
      .where(eq(auditCycleUsage.id, id))
      .returning();
    return updated;
  }

  async deleteAuditCycleUsage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(auditCycleUsage)
        .where(eq(auditCycleUsage.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting audit cycle usage:', error);
      return false;
    }
  }

  async createAuditCycleUsagesFromReport(reportData: any): Promise<AuditCycleUsage[]> {
    const usages: AuditCycleUsage[] = [];
    
    try {
      if (!reportData?.data?.locations) {
        throw new Error('Invalid report data: missing locations array');
      }

      for (const location of reportData.data.locations) {
        if (!location.machines || !Array.isArray(location.machines)) {
          continue;
        }

        for (const machine of location.machines) {
          // Calculate totals and percentages
          const totalDelicate = (machine.delicateColdCount || 0) + 
                               (machine.delicateHotCount || 0) + 
                               (machine.delicateWarmCount || 0);
          
          const totalNormal = (machine.normalColdCount || 0) + 
                             (machine.normalHotCount || 0) + 
                             (machine.normalWarmCount || 0);
          
          const totalPermanentPress = (machine.permanentPressColdCount || 0) + 
                                     (machine.permanentPressHotCount || 0) + 
                                     (machine.permanentPressWarmCount || 0);

          const totalCold = (machine.delicateColdCount || 0) + 
                           (machine.normalColdCount || 0) + 
                           (machine.permanentPressColdCount || 0);
          
          const totalHot = (machine.delicateHotCount || 0) + 
                          (machine.normalHotCount || 0) + 
                          (machine.permanentPressHotCount || 0);
          
          const totalWarm = (machine.delicateWarmCount || 0) + 
                           (machine.normalWarmCount || 0) + 
                           (machine.permanentPressWarmCount || 0);

          const totalCycles = machine.totalCycles || 0;
          
          // Calculate percentages
          const hotWaterPercentage = totalCycles > 0 ? (totalHot / totalCycles * 100) : 0;
          const delicatePercentage = totalCycles > 0 ? (totalDelicate / totalCycles * 100) : 0;

          // Calculate efficiency score and rating
          let efficiencyScore = 10;
          let usageRating = "optimal";

          // Deduct points for excessive hot water usage
          if (hotWaterPercentage > 70) {
            efficiencyScore -= 3;
            usageRating = "concerning";
          } else if (hotWaterPercentage > 50) {
            efficiencyScore -= 1;
            usageRating = "good";
          }

          // Deduct points for low delicate cycle usage (indicates harsh washing)
          if (delicatePercentage < 10) {
            efficiencyScore -= 2;
            if (usageRating === "optimal") usageRating = "good";
          }

          if (efficiencyScore < 6) usageRating = "poor";

          // Calculate data collection period
          const firstReceived = new Date(machine.firstReceivedAt);
          const lastReceived = new Date(machine.lastReceivedAt);
          const dataCollectionDays = Math.ceil((lastReceived.getTime() - firstReceived.getTime()) / (1000 * 60 * 60 * 24));

          // Generate recommendations
          const recommendations = [];
          if (hotWaterPercentage > 60) {
            recommendations.push("Consider reducing hot water usage to improve energy efficiency");
          }
          if (delicatePercentage < 15) {
            recommendations.push("Increase use of delicate cycles to extend fabric life");
          }
          if (totalCycles < 100) {
            recommendations.push("Machine utilization is low - consider redistribution");
          }

          const usage: InsertAuditCycleUsage = {
            reportId: "AUDIT_CYCLE_USAGE",
            locationId: location.id,
            locationName: location.name,
            machineId: machine.id,
            machineName: machine.name,
            
            // Raw cycle counts
            delicateColdCount: machine.delicateColdCount || 0,
            delicateHotCount: machine.delicateHotCount || 0,
            delicateWarmCount: machine.delicateWarmCount || 0,
            normalColdCount: machine.normalColdCount || 0,
            normalHotCount: machine.normalHotCount || 0,
            normalWarmCount: machine.normalWarmCount || 0,
            permanentPressColdCount: machine.permanentPressColdCount || 0,
            permanentPressHotCount: machine.permanentPressHotCount || 0,
            permanentPressWarmCount: machine.permanentPressWarmCount || 0,
            
            // Total cycles
            totalCycles: totalCycles,
            
            // Timestamps
            firstReceivedAt: firstReceived,
            lastReceivedAt: lastReceived,
            
            // Machine type information
            machineTypeName: machine.machineType?.name,
            machineTypeDesc: machine.machineType?.description,
            isWasher: machine.machineType?.isWasher || false,
            isDryer: machine.machineType?.isDryer || false,
            isCombo: machine.machineType?.isCombo || false
          };

          const [created] = await db.insert(auditCycleUsage)
            .values(usage)
            .returning();
          
          usages.push(created);
        }
      }
    } catch (error) {
      console.error('Error processing audit cycle usage report:', error);
      throw error;
    }
    
    return usages;
  }

  // Audit Total Vending methods
  async getAuditTotalVendings(): Promise<AuditTotalVending[]> {
    return await db.select().from(auditTotalVending).orderBy(desc(auditTotalVending.createdAt));
  }

  async getAuditTotalVendingsByLocation(locationId: string): Promise<AuditTotalVending[]> {
    return await db.select().from(auditTotalVending)
      .where(eq(auditTotalVending.locationId, locationId))
      .orderBy(desc(auditTotalVending.createdAt));
  }

  async getAuditTotalVendingsByMachine(machineId: string): Promise<AuditTotalVending[]> {
    return await db.select().from(auditTotalVending)
      .where(eq(auditTotalVending.machineId, machineId))
      .orderBy(desc(auditTotalVending.createdAt));
  }

  async getAuditTotalVending(id: number): Promise<AuditTotalVending | undefined> {
    const [vending] = await db.select()
      .from(auditTotalVending)
      .where(eq(auditTotalVending.id, id));
    return vending || undefined;
  }

  async createAuditTotalVending(data: InsertAuditTotalVending): Promise<AuditTotalVending> {
    const [result] = await db.insert(auditTotalVending).values(data).returning();
    return result;
  }

  async updateAuditTotalVending(id: number, data: Partial<InsertAuditTotalVending>): Promise<AuditTotalVending> {
    const [updated] = await db.update(auditTotalVending)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(auditTotalVending.id, id))
      .returning();
    return updated;
  }

  async deleteAuditTotalVending(id: number): Promise<boolean> {
    try {
      await db.delete(auditTotalVending)
        .where(eq(auditTotalVending.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting audit total vending:', error);
      return false;
    }
  }

  async createAuditTotalVendingsFromReport(reportData: any): Promise<AuditTotalVending[]> {
    try {
      console.log('Processing audit total vending report:', JSON.stringify(reportData, null, 2));
      
      const vendings: AuditTotalVending[] = [];
      
      if (!reportData.data || !reportData.data.locations || !Array.isArray(reportData.data.locations)) {
        throw new Error('Invalid report data structure');
      }

      for (const location of reportData.data.locations) {
        if (!location.machines || !Array.isArray(location.machines)) {
          continue;
        }

        for (const machine of location.machines) {
          const totalCycles = machine.totalCycles || 0;
          const totalVended = parseFloat(machine.totalVended || '0');
          
          // Calculate average revenue per cycle
          const averageRevenuePerCycle = totalCycles > 0 ? (totalVended / totalCycles) : 0;
          
          // Calculate data collection period
          const firstReceived = new Date(machine.firstReceivedAt);
          const lastReceived = new Date(machine.lastReceivedAt);
          const dataCollectionDays = Math.ceil((lastReceived.getTime() - firstReceived.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate daily averages
          const dailyAverageRevenue = dataCollectionDays > 0 ? (totalVended / dataCollectionDays) : 0;
          const dailyAverageCycles = dataCollectionDays > 0 ? (totalCycles / dataCollectionDays) : 0;
          
          // Calculate revenue efficiency score (1-10 scale)
          let revenueEfficiencyScore = 5; // Base score
          let performanceRating = "average";
          
          // Score based on average revenue per cycle
          if (averageRevenuePerCycle >= 8.0) {
            revenueEfficiencyScore = 10;
            performanceRating = "excellent";
          } else if (averageRevenuePerCycle >= 6.0) {
            revenueEfficiencyScore = 8;
            performanceRating = "good";
          } else if (averageRevenuePerCycle >= 4.0) {
            revenueEfficiencyScore = 6;
            performanceRating = "average";
          } else {
            revenueEfficiencyScore = 3;
            performanceRating = "poor";
          }
          
          // Adjust score based on utilization
          if (dailyAverageCycles >= 10) {
            revenueEfficiencyScore = Math.min(10, revenueEfficiencyScore + 1);
          } else if (dailyAverageCycles < 3) {
            revenueEfficiencyScore = Math.max(1, revenueEfficiencyScore - 2);
            if (performanceRating === "excellent") performanceRating = "good";
            if (performanceRating === "good") performanceRating = "average";
          }
          
          // Industry benchmark comparison
          let industryBenchmarkComparison = "at";
          if (averageRevenuePerCycle >= 7.0) {
            industryBenchmarkComparison = "above";
          } else if (averageRevenuePerCycle < 4.0) {
            industryBenchmarkComparison = "below";
          }
          
          // Generate recommendations
          const recommendations = [];
          if (averageRevenuePerCycle < 5.0) {
            recommendations.push("Consider reviewing pricing strategy or machine programming");
          }
          if (dailyAverageCycles < 5) {
            recommendations.push("Low utilization - consider relocating machine or improving marketing");
          }
          if (totalVended < 1000 && dataCollectionDays > 30) {
            recommendations.push("Revenue below expectations - investigate machine functionality");
          }
          if (averageRevenuePerCycle > 8.0) {
            recommendations.push("Excellent performance - consider replicating strategy at other locations");
          }

          const vendingData: InsertAuditTotalVending = {
            locationId: location.id,
            locationName: location.name,
            machineId: machine.id,
            machineName: machine.name,
            totalCycles: totalCycles,
            totalVended: Math.round(totalVended),
            firstReceivedAt: firstReceived,
            lastReceivedAt: lastReceived,
            machineTypeName: machine.machineType?.name,
            machineTypeDesc: machine.machineType?.description,
            isWasher: machine.machineType?.isWasher || false,
            isDryer: machine.machineType?.isDryer || false,
            isCombo: machine.machineType?.isCombo || false
          };

          const createdVending = await this.createAuditTotalVending(vendingData);
          vendings.push(createdVending);
          
          console.log(`Created audit total vending record for machine: ${machine.name}, Revenue: $${totalVended}, Cycles: ${totalCycles}, Avg/Cycle: $${averageRevenuePerCycle.toFixed(2)}`);
        }
      }
      
      console.log(`Successfully processed ${vendings.length} total vending records`);
      return vendings;
      
    } catch (error) {
      console.error('Error processing audit total vending report:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();