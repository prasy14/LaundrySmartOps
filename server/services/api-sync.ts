import { storage } from "../storage";
import type { InsertMachine, InsertAlert } from "@shared/schema";
import { log } from "../vite";

const API_BASE_URL = "https://documenter.getpostman.com/view/1318407/2s9YkocgSL"; // API endpoint from documentation

export class ApiSyncService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any) {
    log(`Making API request to: ${endpoint}`, 'api-sync');
    try {
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
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      log(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      throw error;
    }
  }

  async syncMachineStatus(machineId: number) {
    try {
      log(`Syncing status for machine ${machineId}`, 'api-sync');
      const data = await this.fetchWithAuth(`/machines/${machineId}/status`);

      // Update machine metrics
      const metrics = {
        cycles: data.cycles || 0,
        uptime: data.uptime || 100,
        errors: data.errors || 0,
        temperature: data.temperature || 0,
        waterLevel: data.waterLevel || 100,
        detergentLevel: data.detergentLevel || 100
      };

      await storage.updateMachineStatus(machineId, data.status);

      return true;
    } catch (error) {
      log(`Failed to sync machine status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'api-sync');
      return false;
    }
  }

  async syncAllMachines() {
    try {
      log('Starting machine sync', 'api-sync');
      const response = await this.fetchWithAuth('/machines');
      const machines = Array.isArray(response) ? response : response.machines || [];

      // Clear existing machines
      await storage.clearAllMachines();

      for (const machine of machines) {
        const machineData: InsertMachine = {
          name: machine.name || `Machine ${machine.id}`,
          location: machine.location || 'Unknown',
          status: machine.status || 'offline',
        };

        const createdMachine = await storage.createMachine(machineData);
        log(`Synced machine: ${machine.name}`, 'api-sync');

        // Fetch and update status for each machine
        await this.syncMachineStatus(createdMachine.id);
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