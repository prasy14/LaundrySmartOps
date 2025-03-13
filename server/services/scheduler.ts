import { ApiSyncService } from './api-sync';
import { log } from '../vite';

export class SyncScheduler {
  private apiSync: ApiSyncService;
  private interval: NodeJS.Timer | null = null;
  private syncIntervalHours = 24; // Default to daily sync

  constructor(apiKey: string) {
    this.apiSync = new ApiSyncService(apiKey);
  }

  start() {
    // Run initial sync
    this.runSync();

    // Schedule subsequent syncs
    this.interval = setInterval(() => {
      this.runSync();
    }, this.syncIntervalHours * 60 * 60 * 1000);

    log('Sync scheduler started', 'scheduler');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      log('Sync scheduler stopped', 'scheduler');
    }
  }

  private async runSync() {
    try {
      log('Starting scheduled sync', 'scheduler');
      await this.apiSync.syncAll();
      log('Scheduled sync completed successfully', 'scheduler');
    } catch (error) {
      log(`Scheduled sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'scheduler');
    }
  }

  // Method to change sync interval
  setSyncInterval(hours: number) {
    this.syncIntervalHours = hours;
    if (this.interval) {
      this.stop();
      this.start();
    }
    log(`Sync interval updated to ${hours} hours`, 'scheduler');
  }
}
