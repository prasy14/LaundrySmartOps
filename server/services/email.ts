import * as sgMail from '@sendgrid/mail';
import { log } from '../vite';

// Initialize SendGrid with API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  log('SendGrid API initialized', 'email');
} else {
  log('WARNING: SendGrid API key not set. Email functionality will not work.', 'email');
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailSchedule {
  id: number;
  userId: number;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: EmailRecipient[];
  parameters: {
    locationId?: number;
    startDate?: string;
    endDate?: string;
    serviceType?: string;
    format?: 'pdf' | 'csv';
    [key: string]: any;
  };
  lastSentAt?: Date;
  nextSendAt: Date;
  createdAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
}

export class EmailService {
  private FROM_EMAIL = 'reports@automaticlaundry.com';
  private FROM_NAME = 'Automatic Laundry Solutions';
  
  // Available report templates
  private templates: Record<string, EmailTemplate> = {
    'sustainability': {
      id: 'sustainability-report',
      name: 'Sustainability Report',
      subject: 'Monthly Sustainability Metrics Report',
      preheader: 'Key sustainability insights for your laundry operations'
    },
    'maintenance': {
      id: 'maintenance-report',
      name: 'Maintenance Planning Report',
      subject: 'Maintenance Planning Report - Key Insights',
      preheader: 'Maintenance requirements and service planning data'
    },
    'performance': {
      id: 'performance-report',
      name: 'Performance & Operational Report',
      subject: 'Operational Performance Summary',
      preheader: 'KPIs and operational metrics for your review'
    },
    'compliance': {
      id: 'compliance-report',
      name: 'Compliance & SLA Report',
      subject: 'API Usage & SLA Compliance Report',
      preheader: 'System usage and SLA compliance tracking'
    },
    'executive': {
      id: 'executive-summary',
      name: 'Executive Summary',
      subject: 'Business Performance Executive Summary',
      preheader: 'Key business metrics and performance indicators'
    }
  };

  // Send email with attachment
  async sendReportEmail(
    to: EmailRecipient[], 
    reportType: string, 
    attachmentContent?: string, 
    attachmentFilename?: string
  ): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      log('Cannot send email: SendGrid API key not set', 'email');
      return false;
    }

    const template = this.templates[reportType] || {
      id: 'general-report',
      name: 'Report',
      subject: 'Your Requested Report',
      preheader: 'Report data from Automatic Laundry Solutions'
    };

    try {
      const msg: sgMail.MailDataRequired = {
        to: to.map(recipient => ({
          email: recipient.email,
          name: recipient.name
        })),
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: template.subject,
        text: `Your ${template.name} is attached. If you have any questions, please contact support.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #73a4b7; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Automatic Laundry Solutions</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>${template.subject}</h2>
            <p>Dear valued client,</p>
            <p>Attached is your ${template.name} with the latest data from your laundry operations.</p>
            <p>This report contains key metrics and insights to help you make informed decisions about your laundry facilities.</p>
            <p>If you have any questions or need further analysis, please don't hesitate to contact your account manager.</p>
            <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              <p style="font-size: 12px; color: #666;">
                This is an automated message from Automatic Laundry Solutions.<br>
                © ${new Date().getFullYear()} Automatic Laundry Solutions. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        `
      };

      // Add attachment if provided
      if (attachmentContent && attachmentFilename) {
        msg.attachments = [
          {
            content: attachmentContent,
            filename: attachmentFilename,
            type: attachmentFilename.endsWith('.pdf') ? 'application/pdf' : 'text/csv',
            disposition: 'attachment'
          }
        ];
      }

      await sgMail.send(msg);
      log(`Email sent successfully: ${template.name} to ${to.map(r => r.email).join(', ')}`, 'email');
      return true;
    } catch (error) {
      log(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`, 'email');
      return false;
    }
  }

  // Check if SendGrid is configured
  isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }
}

export const emailService = new EmailService();