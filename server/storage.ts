import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { users, machines, alerts, syncLogs } from "@shared/schema";
import type { 
  User, InsertUser, 
  Machine, InsertMachine, 
  Alert, InsertAlert,
  SyncLog, InsertSyncLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Machine operations
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachineStatus(id: number, status: string): Promise<Machine>;
  clearAllMachines(): Promise<void>;

  // Alert operations
  getAlerts(machineId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  clearAlert(id: number, userId: number): Promise<Alert>;

  // Sync log operations
  getLastSyncLog(): Promise<SyncLog | undefined>;
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
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

  // Machine methods
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
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
}

export const storage = new DatabaseStorage();