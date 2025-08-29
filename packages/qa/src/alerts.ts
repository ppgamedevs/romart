import { QAIssueSeverity, QAIssueStatus } from '@artfromromania/db';
import { AlertConfig } from './types';
import { getConfigFromEnv } from './utils';

export class QAAlertService {
  private config: AlertConfig;

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      ...getConfigFromEnv().alert,
      ...config
    };
  }

  async sendAlert(
    severity: QAIssueSeverity,
    title: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    // Check if severity meets minimum threshold
    if (!this.meetsSeverityThreshold(severity)) {
      return;
    }

    const promises: Promise<void>[] = [];

    // Send email alert
    if (this.config.emailTo) {
      promises.push(this.sendEmailAlert(severity, title, message, details));
    }

    // Send Slack alert
    if (this.config.slackWebhook) {
      promises.push(this.sendSlackAlert(severity, title, message, details));
    }

    await Promise.allSettled(promises);
  }

  async sendScanSummary(
    scanType: string,
    result: {
      totalScanned: number;
      issuesFound: number;
      issuesCreated: number;
      issuesUpdated: number;
      scanDuration: number;
      errors: string[];
    }
  ): Promise<void> {
    const severity = this.determineScanSeverity(result);
    
    if (!this.meetsSeverityThreshold(severity)) {
      return;
    }

    const title = `QA Scan Summary: ${scanType}`;
    const message = this.formatScanSummary(scanType, result);

    await this.sendAlert(severity, title, message, {
      scanType,
      ...result
    });
  }

  private meetsSeverityThreshold(severity: QAIssueSeverity): boolean {
    const severityLevels = {
      'WARNING': 1,
      'ERROR': 2,
      'CRITICAL': 3
    };

    const minLevel = severityLevels[this.config.minSeverity];
    const currentLevel = severityLevels[severity];

    return currentLevel >= minLevel;
  }

  private determineScanSeverity(result: {
    issuesFound: number;
    issuesCreated: number;
    errors: string[];
  }): QAIssueSeverity {
    if (result.errors.length > 0) return 'ERROR';
    if (result.issuesCreated > 10) return 'ERROR';
    if (result.issuesFound > 5) return 'WARNING';
    return 'WARNING';
  }

  private formatScanSummary(
    scanType: string,
    result: {
      totalScanned: number;
      issuesFound: number;
      issuesCreated: number;
      issuesUpdated: number;
      scanDuration: number;
      errors: string[];
    }
  ): string {
    const duration = Math.round(result.scanDuration / 1000);
    
    let summary = `QA Scan completed for ${scanType}:\n`;
    summary += `• Total scanned: ${result.totalScanned}\n`;
    summary += `• Issues found: ${result.issuesFound}\n`;
    summary += `• New issues: ${result.issuesCreated}\n`;
    summary += `• Updated issues: ${result.issuesUpdated}\n`;
    summary += `• Duration: ${duration}s\n`;

    if (result.errors.length > 0) {
      summary += `• Errors: ${result.errors.length}\n`;
      summary += `\nErrors:\n${result.errors.slice(0, 5).join('\n')}`;
      if (result.errors.length > 5) {
        summary += `\n... and ${result.errors.length - 5} more`;
      }
    }

    return summary;
  }

  private async sendEmailAlert(
    severity: QAIssueSeverity,
    title: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // Use Resend API for email sending
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email alert');
        return;
      }

      const emailBody = this.formatEmailBody(severity, title, message, details);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.config.emailFrom,
          to: this.config.emailTo,
          subject: `[QA Alert] ${severity}: ${title}`,
          html: emailBody
        })
      });

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
      }

      console.log('Email alert sent successfully');
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private async sendSlackAlert(
    severity: QAIssueSeverity,
    title: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const color = this.getSeverityColor(severity);
      
      const payload = {
        attachments: [
          {
            color,
            title: `QA Alert: ${title}`,
            text: message,
            fields: details ? Object.entries(details).map(([key, value]) => ({
              title: key,
              value: typeof value === 'object' ? JSON.stringify(value) : String(value),
              short: true
            })) : [],
            footer: 'RomArt QA System',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      const response = await fetch(this.config.slackWebhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
      }

      console.log('Slack alert sent successfully');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private formatEmailBody(
    severity: QAIssueSeverity,
    title: string,
    message: string,
    details?: Record<string, any>
  ): string {
    const color = this.getSeverityColor(severity);
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">QA Alert: ${severity}</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
          <h3 style="margin-top: 0;">${title}</h3>
          <p style="white-space: pre-line;">${message}</p>
    `;

    if (details && Object.keys(details).length > 0) {
      html += '<h4>Details:</h4><ul>';
      for (const [key, value] of Object.entries(details)) {
        html += `<li><strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}</li>`;
      }
      html += '</ul>';
    }

    html += `
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          Sent by RomArt QA System
        </div>
      </div>
    `;

    return html;
  }

  private getSeverityColor(severity: QAIssueSeverity): string {
    switch (severity) {
      case 'WARNING': return '#ffa500';
      case 'ERROR': return '#ff0000';
      case 'CRITICAL': return '#8b0000';
      default: return '#666666';
    }
  }
}
