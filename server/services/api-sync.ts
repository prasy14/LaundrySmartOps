import { storage } from "../storage";
import type { InsertDepartment, InsertSchedule } from "@shared/schema";
import { log } from "../vite";
import type { InsertMachine, InsertAlert } from "@shared/schema";

const API_BASE_URL = "https://api.example.com/v1"; // Replace with actual API URL from documentation

export class ApiSyncService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any) {
    log(`Making API request to: ${endpoint}`, 'api-sync');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async syncDepartments() {
    try {
      log('Starting department sync', 'api-sync');
      const { departments } = await this.fetchWithAuth('/departments');

      for (const dept of departments) {
        const departmentData: InsertDepartment = {
          externalId: dept.id.toString(),
          name: dept.name,
          description: dept.description || null,
          status: dept.active ? 'active' : 'inactive'
        };

        await storage.createDepartment(departmentData);
        log(`Synced department: ${dept.name}`, 'api-sync');
      }

      return true;
    } catch (error) {
      log(`Failed to sync departments: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async syncSchedules(departmentId: string) {
    try {
      log(`Starting schedule sync for department: ${departmentId}`, 'api-sync');
      const { schedules } = await this.fetchWithAuth(`/departments/${departmentId}/schedules`);

      for (const schedule of schedules) {
        const scheduleData: InsertSchedule = {
          departmentId: parseInt(departmentId),
          externalId: schedule.id.toString(),
          startTime: new Date(schedule.start_time),
          endTime: new Date(schedule.end_time),
          status: schedule.status,
          metadata: {
            machineCount: schedule.machine_count,
            operatorName: schedule.operator_name,
            notes: schedule.notes
          }
        };

        await storage.createSchedule(scheduleData);
        log(`Synced schedule: ${schedule.id}`, 'api-sync');
      }

      return true;
    } catch (error) {
      log(`Failed to sync schedules: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async syncMachineStatus(machineId: number) {
    try {
      log(`Syncing status for machine ${machineId}`, 'api-sync');
      const data = await this.fetchWithAuth(`/machines/${machineId}/status`);

      await storage.updateMachineStatus(machineId, data.status);

      // Update machine metrics
      const metrics = {
        cycles: data.cycles,
        uptime: data.uptime,
        errors: data.errors,
        temperature: data.temperature,
        waterLevel: data.waterLevel,
        detergentLevel: data.detergentLevel
      };

      return true;
    } catch (error) {
      log(`Failed to sync machine status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async syncAllMachines() {
    try {
      log('Starting machine sync', 'api-sync');
      const { machines } = await this.fetchWithAuth('/machines');

      for (const machine of machines) {
        const machineData: InsertMachine = {
          name: machine.name,
          location: machine.location,
          status: machine.status,
        };

        await storage.createMachine(machineData);
        log(`Synced machine: ${machine.name}`, 'api-sync');
      }

      return true;
    } catch (error) {
      log(`Failed to sync machines: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async reportAlert(machineId: number, alert: InsertAlert) {
    try {
      log(`Reporting alert for machine ${machineId}`, 'api-sync');
      await this.fetchWithAuth(`/machines/${machineId}/alerts`, 'POST', alert);
      return true;
    } catch (error) {
      log(`Failed to report alert: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }
}