import { storage } from "../storage";
import type { InsertDepartment, InsertSchedule } from "@shared/schema";
import { log } from "../vite";

const API_BASE_URL = "https://api.laundrygenius.com/v1"; // API endpoint from documentation

export class ApiSyncService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string) {
    log(`Making API request to: ${endpoint}`, 'api-sync');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
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
}