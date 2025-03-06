import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";
import { users, machines, alerts, syncLogs, locations, machinePrograms } from "@shared/schema";
import type {
  User, InsertUser,
  Machine, InsertMachine,
  Alert, InsertAlert,
  SyncLog, InsertSyncLog,
  Location, InsertLocation,
  MachineProgram, InsertMachineProgram
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

  // Machine Program operations
  getMachinePrograms(): Promise<MachineProgram[]>;
  getMachineProgram(id: number): Promise<MachineProgram | undefined>;
  getMachineProgramByExternalId(externalId: string): Promise<MachineProgram | undefined>;
  createOrUpdateMachineProgram(program: InsertMachineProgram): Promise<MachineProgram>;

  // Machine operations
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  getMachineByExternalId(externalId: string): Promise<Machine | undefined>;
  createOrUpdateMachine(machine: InsertMachine): Promise<Machine>;
  updateMachineStatus(id: number, status: string): Promise<Machine>;
  clearAllMachines(): Promise<void>;

  // Alert operations
  getAlerts(machineId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  clearAlert(id: number, userId: number): Promise<Alert>;

  // Sync log operations
  getLastSyncLog(): Promise<SyncLog | undefined>;
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;

  // New analytics methods
  getMachinesByLocation(locationId: number): Promise<Machine[]>;
  getAlertsByMachines(machineIds: number[]): Promise<Alert[]>;
  getAlertsByServiceType(serviceType: string): Promise<Alert[]>;
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

  // Machine methods
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
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
    let query = db.select().from(alerts);
    if (machineId) {
      query = query.where(eq(alerts.machineId, machineId));
    }
    return await query;
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

  async createSyncLog(insertLog: InsertSyncLog): Promise<SyncLog> {
    const [log] = await db
      .insert(syncLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // New analytics methods implementation
  async getMachinesByLocation(locationId: number): Promise<Machine[]> {
    return await db
      .select()
      .from(machines)
      .where(eq(machines.locationId, locationId));
  }

  async getAlertsByMachines(machineIds: number[]): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(inArray(alerts.machineId, machineIds));
  }

  async getAlertsByServiceType(serviceType: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.serviceType, serviceType));
  }
}

export const storage = new DatabaseStorage();