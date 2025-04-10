import { Router } from "express";
import { requireAuth, isManagerOrAdmin } from "../middleware/auth";
import { emailService } from "../services/email";
import { db } from "../db";
import { log } from "../vite";
import { and, eq, gte, sql } from "drizzle-orm";
import { 
  reportSchedules, 
  insertReportScheduleSchema, 
  emailRecipients, 
  insertEmailRecipientSchema,
  reportRecipients,
} from "@shared/schema";
import { storage } from "../storage";
import { addDays, addWeeks, addMonths } from "date-fns";

const reportEmailRouter = Router();

// Apply middleware
reportEmailRouter.use(requireAuth);

// Get all scheduled reports
reportEmailRouter.get("/schedules", isManagerOrAdmin, async (req, res) => {
  try {
    const schedules = await db.select().from(reportSchedules)
      .where(eq(reportSchedules.userId, req.user.id));
    
    // For each schedule, get the recipients
    const schedulesWithRecipients = await Promise.all(
      schedules.map(async (schedule) => {
        const recipients = await db
          .select({
            id: emailRecipients.id,
            email: emailRecipients.email,
            name: emailRecipients.name,
            role: emailRecipients.role,
          })
          .from(reportRecipients)
          .innerJoin(emailRecipients, eq(reportRecipients.recipientId, emailRecipients.id))
          .where(eq(reportRecipients.reportScheduleId, schedule.id));
        
        return {
          ...schedule,
          recipients,
        };
      })
    );
    
    res.json({ schedules: schedulesWithRecipients });
  } catch (error) {
    log(`Error fetching scheduled reports: ${error}`, "reports");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch scheduled reports"
    });
  }
});

// Schedule a new report
reportEmailRouter.post("/schedule", isManagerOrAdmin, async (req, res) => {
  try {
    // Validate request data
    const reportData = insertReportScheduleSchema.parse({
      userId: req.user.id,
      reportType: req.body.reportType,
      frequency: req.body.frequency,
      parameters: req.body.parameters || {},
      nextSendAt: req.body.startDate || new Date(),
      active: true,
    });

    // Check if SendGrid is configured
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        error: "Email service is not configured. Please contact an administrator."
      });
    }
    
    // Create the schedule
    const [schedule] = await db.insert(reportSchedules).values(reportData).returning();
    
    // Process recipients
    if (Array.isArray(req.body.recipientEmails) && req.body.recipientEmails.length > 0) {
      for (const email of req.body.recipientEmails) {
        // Check if recipient already exists
        let recipientId: number;
        const existingRecipient = await db
          .select()
          .from(emailRecipients)
          .where(eq(emailRecipients.email, email))
          .limit(1);
        
        if (existingRecipient.length > 0) {
          recipientId = existingRecipient[0].id;
        } else {
          // Create new recipient
          const recipientData = insertEmailRecipientSchema.parse({
            email,
            name: email.split('@')[0], // Basic name from email
            active: true,
          });
          
          const [newRecipient] = await db.insert(emailRecipients).values(recipientData).returning();
          recipientId = newRecipient.id;
        }
        
        // Add the recipient to the report
        await db.insert(reportRecipients).values({
          reportScheduleId: schedule.id,
          recipientId,
        });
      }
    }
    
    res.status(201).json({
      message: "Report scheduled successfully",
      schedule,
    });
  } catch (error) {
    log(`Error scheduling report: ${error}`, "reports");
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to schedule report"
    });
  }
});

// Update a scheduled report
reportEmailRouter.patch("/schedule/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    // Check if schedule exists and belongs to user
    const existingSchedule = await db
      .select()
      .from(reportSchedules)
      .where(and(
        eq(reportSchedules.id, scheduleId),
        eq(reportSchedules.userId, req.user.id)
      ))
      .limit(1);
    
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        error: "Scheduled report not found or you don't have permission to update it"
      });
    }
    
    // Update schedule
    const [updatedSchedule] = await db
      .update(reportSchedules)
      .set({
        frequency: req.body.frequency || existingSchedule[0].frequency,
        parameters: req.body.parameters || existingSchedule[0].parameters,
        active: req.body.active !== undefined ? req.body.active : existingSchedule[0].active,
        updatedAt: new Date(),
      })
      .where(eq(reportSchedules.id, scheduleId))
      .returning();
    
    res.json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    log(`Error updating schedule: ${error}`, "reports");
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to update schedule"
    });
  }
});

// Delete a scheduled report
reportEmailRouter.delete("/schedule/:id", isManagerOrAdmin, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    // Check if schedule exists and belongs to user
    const existingSchedule = await db
      .select()
      .from(reportSchedules)
      .where(and(
        eq(reportSchedules.id, scheduleId),
        eq(reportSchedules.userId, req.user.id)
      ))
      .limit(1);
    
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        error: "Scheduled report not found or you don't have permission to delete it"
      });
    }
    
    // Delete report-recipient associations first
    await db
      .delete(reportRecipients)
      .where(eq(reportRecipients.reportScheduleId, scheduleId));
    
    // Delete the schedule
    await db
      .delete(reportSchedules)
      .where(eq(reportSchedules.id, scheduleId));
    
    res.json({
      message: "Schedule deleted successfully"
    });
  } catch (error) {
    log(`Error deleting schedule: ${error}`, "reports");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete schedule"
    });
  }
});

// Send a test email
reportEmailRouter.post("/test-email", isManagerOrAdmin, async (req, res) => {
  try {
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        error: "Email service is not configured. Please contact an administrator."
      });
    }
    
    const { reportType, recipients } = req.body;
    
    if (!reportType || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: "Report type and at least one recipient are required"
      });
    }
    
    const recipientsList = recipients.map(r => ({ email: r }));
    const success = await emailService.sendReportEmail(
      recipientsList,
      reportType
    );
    
    if (success) {
      res.json({ message: "Test email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    log(`Error sending test email: ${error}`, "reports");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send test email"
    });
  }
});

// Process reports that are due to be sent now
// This endpoint would typically be called by a scheduled job
reportEmailRouter.post("/process-due", isManagerOrAdmin, async (req, res) => {
  try {
    // Only administrators can manually trigger this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: "Only administrators can manually trigger report processing"
      });
    }
    
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        error: "Email service is not configured"
      });
    }
    
    // Get all active schedules that are due
    const dueSchedules = await db
      .select()
      .from(reportSchedules)
      .where(and(
        eq(reportSchedules.active, true),
        lte(reportSchedules.nextSendAt, new Date())
      ));
    
    log(`Processing ${dueSchedules.length} due reports`, "reports");
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
    
    // Process each due schedule
    for (const schedule of dueSchedules) {
      results.processed++;
      
      try {
        // Get recipients for this schedule
        const recipients = await db
          .select({
            id: emailRecipients.id,
            email: emailRecipients.email,
            name: emailRecipients.name,
          })
          .from(reportRecipients)
          .innerJoin(emailRecipients, eq(reportRecipients.recipientId, emailRecipients.id))
          .where(eq(reportRecipients.reportScheduleId, schedule.id));
        
        if (recipients.length === 0) {
          log(`No recipients for schedule ${schedule.id}`, "reports");
          continue;
        }
        
        // Generate the report content
        // This would normally call report generation functions based on reportType
        
        // Send the email
        const success = await emailService.sendReportEmail(
          recipients,
          schedule.reportType
        );
        
        if (success) {
          results.succeeded++;
          
          // Calculate next send date based on frequency
          let nextSendAt: Date;
          switch (schedule.frequency) {
            case 'daily':
              nextSendAt = addDays(new Date(), 1);
              break;
            case 'weekly':
              nextSendAt = addWeeks(new Date(), 1);
              break;
            case 'monthly':
              nextSendAt = addMonths(new Date(), 1);
              break;
            default:
              nextSendAt = addMonths(new Date(), 1);
          }
          
          // Update the schedule with last sent and next send date
          await db
            .update(reportSchedules)
            .set({
              lastSentAt: new Date(),
              nextSendAt,
              updatedAt: new Date(),
            })
            .where(eq(reportSchedules.id, schedule.id));
          
          log(`Successfully sent ${schedule.reportType} report for schedule ${schedule.id}`, "reports");
        } else {
          results.failed++;
          log(`Failed to send ${schedule.reportType} report for schedule ${schedule.id}`, "reports");
        }
      } catch (error) {
        results.failed++;
        log(`Error processing schedule ${schedule.id}: ${error}`, "reports");
      }
    }
    
    res.json({
      message: "Completed processing due reports",
      results,
    });
  } catch (error) {
    log(`Error processing due reports: ${error}`, "reports");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to process due reports"
    });
  }
});

export default reportEmailRouter;

// Helper function for LTE operator
function lte(column: any, value: any) {
  return sql`${column} <= ${value}`;
}