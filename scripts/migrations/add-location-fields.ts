import { db, pool } from '../../server/db';
import { log } from '../../server/vite';

// Add location fields to machine-related tables that need it
async function main() {
  try {
    log('Starting migration: Adding location fields to machine-related tables...', 'migration');
    
    // List of all tables that need location fields added
    const tablesToModify = [
      'machine_programs',
      'program_modifiers',
      'machine_details',
      'command_history',
      'alerts',
      'machine_cycles',
      'machine_supported_cycles',
      'machine_supported_modifiers',
      'machine_cycle_steps'
    ];
    
    for (const table of tablesToModify) {
      // Check if the locationId column already exists
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = 'location_id'
      `, [table]);
      
      // If the column doesn't exist, add it
      if (result.rowCount === 0) {
        log(`Adding location_id column to table: ${table}`, 'migration');
        
        await pool.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id)
        `);
        
        log(`Successfully added location_id column to table: ${table}`, 'migration');
      } else {
        log(`location_id column already exists in table: ${table}`, 'migration');
      }
    }
    
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