import * as path from 'path';
import * as fs from 'fs';
import { log } from '../server/vite';

async function runMigration(migrationName: string) {
  try {
    const migrationPath = path.join(__dirname, 'migrations', `${migrationName}.ts`);
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    log(`Running migration: ${migrationName}`, 'migration');
    
    // Import and run the migration dynamically
    const migration = await import(`./migrations/${migrationName}`);
    
    log(`Migration completed: ${migrationName}`, 'migration');
  } catch (error) {
    log(`Error running migration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'migration');
    process.exit(1);
  }
}

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  console.error('Usage: npm run migrate <migration-name>');
  process.exit(1);
}

runMigration(migrationName);