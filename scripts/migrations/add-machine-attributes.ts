import { db, pool } from '../../server/db';
import { log } from '../../server/vite';

async function main() {
  try {
    log('Starting migration: Adding additional machine attributes...', 'migration');
    
    // Check if the columns already exist
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'machines' 
      AND column_name = 'manufacturer'
    `);
    
    if (result.rowCount === 0) {
      log('Adding new columns to machines table', 'migration');
      
      // Add new columns for enhanced machine management
      await pool.query(`
        ALTER TABLE machines 
        ADD COLUMN IF NOT EXISTS manufacturer TEXT,
        ADD COLUMN IF NOT EXISTS install_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS warranty_expiry_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS life_cycle_status TEXT,
        ADD COLUMN IF NOT EXISTS performance_metrics JSONB
      `);
      
      log('Successfully added new machine attribute columns', 'migration');
    } else {
      log('Machine attribute columns already exist', 'migration');
    }
    
    // Add an index on warranty_expiry_date to improve query performance for warranty alerts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_machines_warranty_expiry 
      ON machines (warranty_expiry_date)
    `);
    log('Added index on warranty_expiry_date', 'migration');
    
    log('Migration completed successfully!', 'migration');
  } catch (error) {
    log(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'migration');
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });