import type { Job, Schedule } from 'src/interfaces/enrichment.interface';

export interface EmailTemplateContext {
  event: string;
  config: {
    id?: number | string;
    configId?: number | string;
    transactionType?: string;
    cfg_name?: string;
    version?: string;
    cfg_version?: string;
    endpointPath?: string;
    endpoint_path?: string;
    status?: string;
  };
  actorName?: string;
  actorEmail: string;
  comment?: string;
  tenantId?: string;
}
export interface JobEmailTemplateContext {
  event: string;
  job: Job;
  actorName?: string;
  actorEmail: string;
  comment?: string;
  tenantId?: string;
}
export interface ScheduleEmailTemplateContext {
  event: string;
  schedule: Schedule;
  actorName?: string;
  actorEmail: string;
  comment?: string;
  tenantId?: string;
}

export interface EmailTheme {
  subject: string;
  themeColor: string;
  statusBadgeColor: string;
  emailTitle: string;
  actionDescription: string;
}

export function getEmailTheme(event: string, configName: string, version?: string): EmailTheme {
  const themes: Record<string, Omit<EmailTheme, 'subject'>> = {
    editor_submit: {
      themeColor: '#2196F3',
      statusBadgeColor: '#e3f2fd',
      emailTitle: 'Approval Required',
      actionDescription: 'submitted for approval',
    },
    approver_approve: {
      themeColor: '#4CAF50',
      statusBadgeColor: '#e8f5e9',
      emailTitle: 'Configuration Approved',
      actionDescription: 'approved and ready for export',
    },
    exporter_export: {
      themeColor: '#FF9800',
      statusBadgeColor: '#fff3e0',
      emailTitle: 'Configuration Exported',
      actionDescription: 'exported and ready for deployment',
    },
    publisher_deploy: {
      themeColor: '#9C27B0',
      statusBadgeColor: '#f3e5f5',
      emailTitle: 'Configuration Deployed to Production',
      actionDescription: 'deployed to production',
    },
    publisher_activate: {
      themeColor: '#4CAF50',
      statusBadgeColor: '#e8f5e9',
      emailTitle: 'Configuration Activated',
      actionDescription: 'activated',
    },
    publisher_deactivate: {
      themeColor: '#F44336',
      statusBadgeColor: '#ffebee',
      emailTitle: 'Configuration Deactivated',
      actionDescription: 'deactivated',
    },
    approver_reject: {
      themeColor: '#F44336',
      statusBadgeColor: '#ffebee',
      emailTitle: 'Configuration Rejected',
      actionDescription: 'rejected',
    },
  };

  const theme = themes[event] ?? {
    themeColor: '#2196F3',
    statusBadgeColor: '#e3f2fd',
    emailTitle: 'Workflow Update',
    actionDescription: 'updated',
  };

  return {
    ...theme,
    subject: `${theme.emailTitle}: ${configName} ${version ?? ''}`.trim(),
  };
}

export function generateWorkflowEmailHTML(context: EmailTemplateContext): string {
  const { config, actorName, actorEmail, comment } = context;

  const configName = config.transactionType ?? config.cfg_name ?? 'Configuration';
  const version = config.version ?? config.cfg_version ?? '1.0';
  const theme = getEmailTheme(context.event, configName, version);

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: ${theme.themeColor}; margin-top: 0;">${theme.emailTitle}</h2>
  
  <div style="background-color: ${theme.statusBadgeColor}; padding: 15px; border-left: 4px solid ${theme.themeColor}; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${actorName ?? actorEmail}</p>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
      <a href="mailto:${actorEmail}" style="color: ${theme.themeColor}; text-decoration: none;">${actorEmail}</a>
    </p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Comment:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h3 style="margin-top: 0; color: ${theme.themeColor};">Configuration Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Configuration:</td>
        <td style="padding: 8px;">${configName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${version}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Endpoint:</td>
        <td style="padding: 8px;">${config.endpointPath ?? config.endpoint_path ?? 'N/A'}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Status:</td>
        <td style="padding: 8px;">
          <span style="background-color: ${theme.themeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${config.status ?? 'N/A'}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.${context.tenantId ? `<br/>Tenant: ${context.tenantId}` : ''}
  </p>
</div>
  `.trim();
}

export function generateWorkflowEmailText(context: EmailTemplateContext): string {
  const { config, actorName, actorEmail, comment, tenantId } = context;

  const configName = config.transactionType ?? config.cfg_name ?? 'Configuration';
  const version = config.version ?? config.cfg_version ?? '1.0';
  const theme = getEmailTheme(context.event, configName, version);

  return `
Hello,

${actorName ?? actorEmail} has ${theme.actionDescription}:

Configuration: ${configName}
Version: ${version}
Endpoint: ${config.endpointPath ?? config.endpoint_path ?? 'N/A'}
Status: ${config.status ?? 'N/A'}
${comment ? `\nComment:\n${comment}` : ''}

---
This is an automated notification from Tazama Connection Studio.
From: ${actorName ?? actorEmail} (${actorEmail})${tenantId ? `\nTenant: ${tenantId}` : ''}
  `.trim();
}

export function generateJobflowEmailHTML(context: JobEmailTemplateContext): string {
  const { job, actorName, actorEmail, comment } = context;

  const jobName = job.endpoint_name || 'Job';
  const version = job.version || '1.0';
  const theme = getEmailTheme(context.event, jobName, version);

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: ${theme.themeColor}; margin-top: 0;">${theme.emailTitle}</h2>
  
  <div style="background-color: ${theme.statusBadgeColor}; padding: 15px; border-left: 4px solid ${theme.themeColor}; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${actorName ?? actorEmail}</p>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
      <a href="mailto:${actorEmail}" style="color: ${theme.themeColor}; text-decoration: none;">${actorEmail}</a>
    </p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Comment:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h3 style="margin-top: 0; color: ${theme.themeColor};">Job Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Job:</td>
        <td style="padding: 8px;">${jobName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${version}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Endpoint Name:</td>
        <td style="padding: 8px;">${job.endpoint_name || 'N/A'}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Status:</td>
        <td style="padding: 8px;">
          <span style="background-color: ${theme.themeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${job.status}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.${context.tenantId ? `<br/>Tenant: ${context.tenantId}` : ''}
  </p>
</div>
  `.trim();
}

export function generateJobflowEmailText(context: JobEmailTemplateContext): string {
  const { job, actorName, actorEmail, comment, tenantId } = context;

  const jobName = job.endpoint_name;
  const { version } = job;
  const theme = getEmailTheme(context.event, jobName, version);
  return `
Hello,

${actorName ?? actorEmail} has ${theme.actionDescription}:

Job: ${jobName}
Version: ${version}
Endpoint Name: ${job.endpoint_name}
Status: ${job.status}
${comment ? `\nComment:\n${comment}` : ''}

---
This is an automated notification from Tazama Connection Studio.
From: ${actorName ?? actorEmail} (${actorEmail})${tenantId ? `\nTenant: ${tenantId}` : ''}
  `.trim();
}

export function generateScheduleflowEmailHTML(context: ScheduleEmailTemplateContext): string {
  const { schedule, actorName, actorEmail, comment } = context;

  const { name } = schedule;
  const { cron } = schedule;
  const theme = getEmailTheme(context.event, name);

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: ${theme.themeColor}; margin-top: 0;">${theme.emailTitle}</h2>
  
  <div style="background-color: ${theme.statusBadgeColor}; padding: 15px; border-left: 4px solid ${theme.themeColor}; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${actorName ?? actorEmail}</p>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
      <a href="mailto:${actorEmail}" style="color: ${theme.themeColor}; text-decoration: none;">${actorEmail}</a>
    </p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Comment:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h3 style="margin-top: 0; color: ${theme.themeColor};">Cron Job Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Cron Job Name:</td>
        <td style="padding: 8px;">${name}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Cron Expression:</td>
        <td style="padding: 8px;">${cron}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Iterations:</td>
        <td style="padding: 8px;">${schedule.iterations}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Status:</td>
        <td style="padding: 8px;">
          <span style="background-color: ${theme.themeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${schedule.status}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.${context.tenantId ? `<br/>Tenant: ${context.tenantId}` : ''}
  </p>
</div>
  `.trim();
}

export function generateScheduleflowEmailText(context: ScheduleEmailTemplateContext): string {
  const { schedule, actorName, actorEmail, comment, tenantId } = context;

  const { name } = schedule;
  const { cron } = schedule;
  const theme = getEmailTheme(context.event, name);
  return `
Hello,

${actorName ?? actorEmail} has ${theme.actionDescription}:

Cron Job: ${name}
Cron Expression: ${cron}
Iterations: ${schedule.iterations}
Status: ${schedule.status}
${comment ? `\nComment:\n${comment}` : ''}

---
This is an automated notification from Tazama Connection Studio.
From: ${actorName ?? actorEmail} (${actorEmail})${tenantId ? `\nTenant: ${tenantId}` : ''}
  `.trim();
}

export function generatePublishingStatusEmailHTML(
  configId: number,
  config: any,
  tenantId: string,
  publishingStatus: 'active' | 'inactive',
  actorEmail: string,
  actorName: string,
): string {
  const isActivation = publishingStatus === 'active';
  const emailTitle = `Configuration ${isActivation ? 'Activated' : 'Deactivated'}`;
  const themeColor = isActivation ? '#4CAF50' : '#F44336';
  const statusBadgeColor = isActivation ? '#e8f5e9' : '#ffebee';

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: ${themeColor}; margin-top: 0;">${emailTitle}</h2>
  
  <div style="background-color: ${statusBadgeColor}; padding: 15px; border-left: 4px solid ${themeColor}; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${actorName || actorEmail}</p>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
      <a href="mailto:${actorEmail}" style="color: ${themeColor}; text-decoration: none;">${actorEmail}</a>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold; color: ${themeColor};">
      Publishing Status: ${publishingStatus.toUpperCase()}
    </p>
  </div>

  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h3 style="margin-top: 0; color: ${themeColor};">Configuration Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Configuration:</td>
        <td style="padding: 8px;">${config.transactionType ?? 'Configuration'}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${config.version ?? '1.0'}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Endpoint:</td>
        <td style="padding: 8px;">${config.endpointPath ?? 'N/A'}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Publishing Status:</td>
        <td style="padding: 8px;">
          <span style="background-color: ${themeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${publishingStatus.toUpperCase()}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Config Status:</td>
        <td style="padding: 8px;">${config.status ?? 'N/A'}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Config ID:</td>
        <td style="padding: 8px;">${configId}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Tenant:</td>
        <td style="padding: 8px;">${tenantId}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background-color: ${themeColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      View in Connection Studio
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.<br/>
    Publishing Status: ${publishingStatus}<br/>
    Tenant: ${tenantId}
  </p>
</div>
  `.trim();
}

export function generatePublishingStatusEmailText(
  configId: number,
  config: any,
  tenantId: string,
  publishingStatus: 'active' | 'inactive',
  actorEmail: string,
  actorName: string,
): string {
  const isActivation = publishingStatus === 'active';
  const actionDescription = isActivation ? 'activated' : 'deactivated';

  return `
Hello,

${actorName || actorEmail} has ${actionDescription} the following configuration:

Configuration: ${config.transactionType ?? 'Configuration'}
Version: ${config.version ?? '1.0'}
Endpoint: ${config.endpointPath ?? 'N/A'}
Config ID: ${configId}
Publishing Status: ${publishingStatus.toUpperCase()}
Status: ${config.status ?? 'N/A'}

---
This is an automated notification from Tazama Connection Studio.
Tenant: ${tenantId}
From: ${actorName || actorEmail} (${actorEmail})
  `.trim();
}

export function generateChangesRequestedEmailHTML(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  approverName: string,
  approverEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: #d32f2f;">Changes Requested</h2>
  
  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Configuration Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Configuration:</td>
        <td style="padding: 8px;">${configName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${version}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Transaction Type:</td>
        <td style="padding: 8px;">${transactionType}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Config ID:</td>
        <td style="padding: 8px;">${configId}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Approver: ${approverName || approverEmail}</p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Comments:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <p style="color: #666; margin-top: 30px;">
    Please review the requested changes and resubmit the configuration when ready.
  </p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.<br/>
    Tenant: ${tenantId}
  </p>
</div>
  `;
}

export function generateChangesRequestedEmailText(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  approverName: string,
  approverEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
Hello,

An approver has requested changes to your configuration:

Configuration: ${configName}
Version: ${version}
Transaction Type: ${transactionType}
Config ID: ${configId}

Approver: ${approverName || approverEmail}
${comment ? `\nComments:\n${comment}` : ''}

Please review the requested changes and resubmit the configuration when ready.

---
This is an automated notification from Tazama Connection Studio.
Tenant: ${tenantId}
  `.trim();
}

export function generateSubmitForApprovalEmailHTML(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  submitterName: string,
  submitterEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: #2196F3;">Approval Required</h2>
  
  <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${submitterName || submitterEmail}</p>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
      <a href="mailto:${submitterEmail}" style="color: #2196F3; text-decoration: none;">${submitterEmail}</a>
    </p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Message:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Configuration Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Configuration:</td>
        <td style="padding: 8px;">${configName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${version}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Transaction Type:</td>
        <td style="padding: 8px;">${transactionType}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Config ID:</td>
        <td style="padding: 8px;">${configId}</td>
      </tr>
    </table>
  </div>

  <p style="color: #666; margin-top: 30px;">
    Please review this configuration and approve or request changes as needed.<br/>
    <strong>Click "Reply" to respond directly to the editor.</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.<br/>
    Tenant: ${tenantId}
  </p>
</div>
  `;
}

export function generateSubmitForApprovalEmailText(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  submitterName: string,
  submitterEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
Hello,

${submitterName || submitterEmail} has submitted a configuration for your approval:

Configuration: ${configName}
Version: ${version}
Transaction Type: ${transactionType}
Config ID: ${configId}
${comment ? `\nComments:\n${comment}` : ''}

Please review and approve or request changes as needed.
Click "Reply" to respond directly to ${submitterName || submitterEmail}.

---
This is an automated notification from Tazama Connection Studio.
Tenant: ${tenantId}
  `.trim();
}

export function generateRejectionEmailHTML(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  approverName: string,
  approverEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f9f9f9;">
  <h2 style="color: #d32f2f;">Configuration Rejected</h2>
  
  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Configuration Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Configuration:</td>
        <td style="padding: 8px;">${configName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Version:</td>
        <td style="padding: 8px;">${version}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">Transaction Type:</td>
        <td style="padding: 8px;">${transactionType}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold; color: #666;">Config ID:</td>
        <td style="padding: 8px;">${configId}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Approver: ${approverName || approverEmail}</p>
    ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Rejection Reason:</strong><br/>${comment.replace(/\n/g, '<br/>')}</p>` : ''}
  </div>

  <p style="color: #666; margin-top: 30px;">
    You can review the feedback and make necessary changes before resubmitting.
  </p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;"/>
  <p style="color: #999; font-size: 12px;">
    This is an automated notification from Tazama Connection Studio.<br/>
    Tenant: ${tenantId}
  </p>
</div>
  `;
}

export function generateRejectionEmailText(
  configName: string,
  version: string,
  transactionType: string,
  configId: number,
  approverName: string,
  approverEmail: string,
  comment: string | undefined,
  tenantId: string,
): string {
  return `
Hello,

Your configuration has been rejected by an approver:

Configuration: ${configName}
Version: ${version}
Transaction Type: ${transactionType}
Config ID: ${configId}

Approver: ${approverName || approverEmail}
${comment ? `\nRejection Reason:\n${comment}` : ''}

You can review the feedback and make necessary changes before resubmitting.

---
This is an automated notification from Tazama Connection Studio.
Tenant: ${tenantId}
  `.trim();
}
