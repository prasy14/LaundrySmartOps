import { users, machines, alerts } from "@shared/schema";
import type { User, InsertUser, Machine, InsertMachine, Alert, InsertAlert } from "@shared/schema";

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
  
  // Alert operations
  getAlerts(machineId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  clearAlert(id: number, userId: number): Promise<Alert>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private machines: Map<number, Machine>;
  private alerts: Map<number, Alert>;
  private currentIds: { users: number; machines: number; alerts: number };

  constructor() {
    this.users = new Map();
    this.machines = new Map();
    this.alerts = new Map();
    this.currentIds = { users: 1, machines: 1, alerts: 1 };
    
    // Add default admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Administrator'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Machine methods
  async getMachines(): Promise<Machine[]> {
    return Array.from(this.machines.values());
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    return this.machines.get(id);
  }

  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    const id = this.currentIds.machines++;
    const machine: Machine = {
      ...insertMachine,
      id,
      lastPing: new Date(),
      metrics: { cycles: 0, uptime: 0, errors: 0 }
    };
    this.machines.set(id, machine);
    return machine;
  }

  async updateMachineStatus(id: number, status: string): Promise<Machine> {
    const machine = await this.getMachine(id);
    if (!machine) throw new Error('Machine not found');
    
    const updated = { ...machine, status, lastPing: new Date() };
    this.machines.set(id, updated);
    return updated;
  }

  // Alert methods
  async getAlerts(machineId?: number): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values());
    return machineId 
      ? alerts.filter(a => a.machineId === machineId)
      : alerts;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentIds.alerts++;
    const alert: Alert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      clearedAt: null,
      clearedBy: null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async clearAlert(id: number, userId: number): Promise<Alert> {
    const alert = this.alerts.get(id);
    if (!alert) throw new Error('Alert not found');
    
    const updated = {
      ...alert,
      status: 'cleared',
      clearedAt: new Date(),
      clearedBy: userId
    };
    this.alerts.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
