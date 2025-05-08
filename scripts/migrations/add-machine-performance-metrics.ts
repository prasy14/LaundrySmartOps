import { db } from "../../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration: add-machine-performance-metrics");
  
  try {
    // Create the machine_performance_metrics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS machine_performance_metrics (
        id SERIAL PRIMARY KEY,
        machine_id INTEGER REFERENCES machines(id),
        location_id INTEGER REFERENCES locations(id),
        date TIMESTAMP NOT NULL,
        uptime_minutes NUMERIC,
        downtime_minutes NUMERIC,
        availability_percentage NUMERIC,
        cycles_completed INTEGER,
        total_loads_processed INTEGER,
        average_cycle_time NUMERIC,
        error_count INTEGER,
        failure_rate NUMERIC,
        mtbf NUMERIC,
        energy_consumption NUMERIC,
        energy_efficiency NUMERIC,
        maintenance_count INTEGER,
        planned_maintenance_count INTEGER,
        unplanned_maintenance_count INTEGER,
        oee_score NUMERIC,
        performance_efficiency NUMERIC,
        quality_rate NUMERIC,
        utilization_rate NUMERIC,
        peak_utilization_time TEXT,
        cost_per_cycle NUMERIC,
        revenue_generated NUMERIC,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("Migration completed successfully");
    
    // Insert sample performance metrics data for testing based on real machines
    console.log("Inserting sample performance metrics for testing...");
    
    // Get real machine IDs from the database
    const machines = await db.execute(sql`SELECT id, location_id FROM machines LIMIT 20`);
    
    if (machines && machines.length > 0) {
      console.log(`Found ${machines.length} machines for sample data creation`);
      
      // Create 30 days of historical data (past month) for each machine
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      for (const machine of machines) {
        const machineId = machine.id;
        const locationId = machine.location_id;
        
        // Generate data for each day in the past 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
          
          // Base metrics with some randomization for realistic variance
          const uptimeMinutes = 1440 - Math.floor(Math.random() * 60); // Most machines run 24/7 with small downtime
          const downtimeMinutes = 1440 - uptimeMinutes;
          const availabilityPercentage = (uptimeMinutes / 1440) * 100;
          
          // Cycles vary by machine ID to ensure different patterns
          const cyclesCompleted = 10 + Math.floor(Math.random() * 20) + (machineId % 5);
          const totalLoadsProcessed = cyclesCompleted;
          const averageCycleTime = 25 + Math.floor(Math.random() * 15);
          
          // Error metrics with low randomized values
          const errorCount = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;
          const failureRate = (errorCount / cyclesCompleted) * 100;
          const mtbf = errorCount === 0 ? 720 : 720 / errorCount; // Mean time between failures in hours
          
          // Energy and efficiency metrics
          const energyConsumption = 5 + Math.random() * 3; // kWh
          const energyEfficiency = energyConsumption / cyclesCompleted;
          
          // Maintenance metrics
          const plannedMaintenanceCount = i % 7 === 0 ? 1 : 0; // Weekly planned maintenance
          const unplannedMaintenanceCount = errorCount > 0 ? 1 : 0;
          const maintenanceCount = plannedMaintenanceCount + unplannedMaintenanceCount;
          
          // OEE metrics (Overall Equipment Effectiveness)
          const performanceEfficiency = 85 + Math.random() * 15;
          const qualityRate = 98 + Math.random() * 2;
          const oeeScore = (availabilityPercentage * performanceEfficiency * qualityRate) / 10000;
          
          // Utilization metrics
          const utilizationRate = 60 + Math.random() * 30;
          const peakHours = ['9AM-11AM', '2PM-4PM', '6PM-8PM'];
          const peakUtilizationTime = peakHours[Math.floor(Math.random() * peakHours.length)];
          
          // Cost metrics
          const costPerCycle = 0.50 + Math.random() * 0.30;
          const revenueGenerated = costPerCycle * cyclesCompleted;
          
          // Insert the metrics
          await db.execute(sql`
            INSERT INTO machine_performance_metrics (
              machine_id, location_id, date, 
              uptime_minutes, downtime_minutes, availability_percentage,
              cycles_completed, total_loads_processed, average_cycle_time,
              error_count, failure_rate, mtbf,
              energy_consumption, energy_efficiency,
              maintenance_count, planned_maintenance_count, unplanned_maintenance_count,
              oee_score, performance_efficiency, quality_rate,
              utilization_rate, peak_utilization_time,
              cost_per_cycle, revenue_generated,
              created_at, last_updated_at
            )
            VALUES (
              ${machineId}, ${locationId}, ${date},
              ${uptimeMinutes}, ${downtimeMinutes}, ${availabilityPercentage},
              ${cyclesCompleted}, ${totalLoadsProcessed}, ${averageCycleTime},
              ${errorCount}, ${failureRate}, ${mtbf},
              ${energyConsumption}, ${energyEfficiency},
              ${maintenanceCount}, ${plannedMaintenanceCount}, ${unplannedMaintenanceCount},
              ${oeeScore}, ${performanceEfficiency}, ${qualityRate},
              ${utilizationRate}, ${peakUtilizationTime},
              ${costPerCycle}, ${revenueGenerated},
              NOW(), NOW()
            )
          `);
        }
        
        console.log(`Added 30 days of metrics for machine ${machineId}`);
      }
      
      console.log("Sample data creation completed");
    } else {
      console.log("No machines found for sample data creation");
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

export default main;