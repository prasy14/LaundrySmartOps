import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, departments, schedules, machines, alerts } from "@shared/schema";
import type { 
  User, InsertUser, 
  Department, InsertDepartment,
  Schedule, InsertSchedule,
  Machine, InsertMachine, 
  Alert, InsertAlert 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartmentSync(id: number): Promise<Department>;

  // Schedule operations
  getSchedules(departmentId?: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateScheduleSync(id: number): Promise<Schedule>;

  // Machine operations
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachineStatus(id: number, status: string): Promise<Machine>;

  // Alert operations
  getAlerts(machineId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  clearAlert(id: number, userId: number): Promise<Alert>;
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

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values({
        ...insertDepartment,
        lastSynced: new Date()
      })
      .returning();
    return department;
  }

  async updateDepartmentSync(id: number): Promise<Department> {
    const [department] = await db
      .update(departments)
      .set({ lastSynced: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  // Schedule methods
  async getSchedules(departmentId?: number): Promise<Schedule[]> {
    let query = db.select().from(schedules);
    if (departmentId) {
      query = query.where(eq(schedules.departmentId, departmentId));
    }
    return await query;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values({
        ...insertSchedule,
        lastSynced: new Date()
      })
      .returning();
    return schedule;
  }

  async updateScheduleSync(id: number): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set({ lastSynced: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
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
        metrics: { cycles: 0, uptime: 0, errors: 0 }
      })
      .returning();
    return machine;
  }

  async updateMachineStatus(id: number, status: string): Promise<Machine> {
    const [machine] = await db
      .update(machines)
      .set({ status, lastPing: new Date() })
      .where(eq(machines.id, id))
      .returning();
    return machine;
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
}

export const storage = new DatabaseStorage();