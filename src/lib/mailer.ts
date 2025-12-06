import { Resend } from "resend";

const resendApiKey = process.env.RESEND_KEY || process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

if (!resendApiKey) {
  console.warn("Resend API key not configured. Emails will not be sent.");
}

interface InviteEmailData {
  email: string;
  organizationName: string;
  inviterName: string;
  inviteToken: string;
  role: string;
}

interface PasswordResetEmailData {
  email: string;
  resetToken: string;
}

interface CampaignSummaryEmailData {
  email: string;
  campaignName: string;
  brandName: string;
  startDate: Date;
  endDate: Date;
  dashboardUrl: string;
}

interface TaskQuestionEmailData {
  email: string;
  contactName: string;
  companyName: string;
  opportunityTitle: string;
  question: string;
  questionTitle: string;
  taskUrl: string;
}

interface QuestionnaireEmailData {
  email: string;
  contactName: string;
  companyName: string;
  opportunityTitle: string;
  questions: Array<{
    id: string;
    title: string;
    question: string;
    description?: string;
    taskUrl: string;
  }>;
  opportunityUrl: string;
  customContent?: string;
}

/**
 * Send an invitation email to join an organization
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  const inviteUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/invite/${data.inviteToken}`;

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: data.email,
      subject: `Invitation to join ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to ${data.organizationName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">You're Invited!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.</p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
              </div>
              <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #666; word-break: break-all;">${inviteUrl}</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">This invitation will expire in 7 days.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send invite email:", error);
    throw error;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  const resetUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${data.resetToken}`;

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: data.email,
      subject: "Reset Your Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Reset</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
              </div>
              <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #666; word-break: break-all;">${resetUrl}</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

/**
 * Send a campaign summary email to brand contacts
 */
export async function sendCampaignSummaryEmail(data: CampaignSummaryEmailData): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: data.email,
      subject: `Campaign Summary: ${data.campaignName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Campaign Summary: ${data.campaignName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Campaign Summary</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p>Your campaign <strong>${data.campaignName}</strong> for <strong>${data.brandName}</strong> has been activated!</p>
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Campaign:</strong> ${data.campaignName}</p>
                <p><strong>Brand:</strong> ${data.brandName}</p>
                <p><strong>Start Date:</strong> ${data.startDate.toLocaleDateString()}</p>
                <p><strong>End Date:</strong> ${data.endDate.toLocaleDateString()}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dashboard</a>
              </div>
              <p>You can track the campaign's progress and performance in your dashboard.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send campaign summary email:", error);
    throw error;
  }
}

/**
 * Send weekly/monthly report email
 */
export async function sendReportEmail(
  email: string,
  reportData: {
    period: string;
    totalRevenue: number;
    activeCampaigns: number;
    completedPosts: number;
    topInfluencers: Array<{ name: string; revenue: number }>;
    dashboardUrl: string;
  }
): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: email,
      subject: `Performance Report - ${reportData.period}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Performance Report - ${reportData.period}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Performance Report</h1>
              <p style="color: white; margin: 10px 0 0 0;">${reportData.period}</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p>Here's your performance summary for <strong>${reportData.period}</strong>:</p>
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <span><strong>Total Revenue:</strong></span>
                  <span>€${reportData.totalRevenue.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <span><strong>Active Campaigns:</strong></span>
                  <span>${reportData.activeCampaigns}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <span><strong>Completed Posts:</strong></span>
                  <span>${reportData.completedPosts}</span>
                </div>
              </div>
              ${reportData.topInfluencers.length > 0 ? `
                <h3 style="margin-top: 30px;">Top Performers</h3>
                <ul style="list-style: none; padding: 0;">
                  ${reportData.topInfluencers.map(
                    (inf) => `
                      <li style="background: white; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                        <strong>${inf.name}</strong> - €${inf.revenue.toLocaleString()}
                      </li>
                    `
                  ).join("")}
                </ul>
              ` : ""}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${reportData.dashboardUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Full Report</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send report email:", error);
    throw error;
  }
}

/**
 * Send a task question email to assigned contact (in Greek)
 */
export async function sendTaskQuestionEmail(data: TaskQuestionEmailData): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: data.email,
      subject: `Ερώτηση για την Ευκαιρία: ${data.opportunityTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ερώτηση για την Ευκαιρία</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">ΕΡΩΤΗΣΗ ΓΙΑ ΕΥΚΑΙΡΙΑ</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Καλησπέρα ${data.contactName},</p>
              <p>Σας ενημερώνουμε ότι για την ευκαιρία <strong>${data.opportunityTitle}</strong> της εταιρείας <strong>${data.companyName}</strong>, χρειαζόμαστε την απάντησή σας στην παρακάτω ερώτηση:</p>
              
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">${data.questionTitle}</h3>
                <p style="font-size: 16px; line-height: 1.8;">${data.question}</p>
              </div>

              <p>Παρακαλούμε απαντήστε στην ερώτηση μέσω του παρακάτω συνδέσμου:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.taskUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">ΑΠΑΝΤΗΣΤΕ ΤΗΝ ΕΡΩΤΗΣΗ</a>
              </div>
              
              <p style="font-size: 12px; color: #666;">Ή αντιγράψτε και επικολλήστε τον παρακάτω σύνδεσμο στον browser σας:</p>
              <p style="font-size: 12px; color: #666; word-break: break-all;">${data.taskUrl}</p>
              
              <p style="margin-top: 30px;">Ευχαριστούμε για τον χρόνο σας.</p>
              <p style="margin-top: 5px;">Με εκτίμηση,<br>Η Ομάδα</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send task question email:", error);
    throw error;
  }
}

/**
 * Send a questionnaire email with all questions for a contact (in Greek)
 */
export async function sendQuestionnaireEmail(data: QuestionnaireEmailData): Promise<void> {
  if (!resendApiKey) {
    console.warn("Resend API key not configured. Skipping email send.");
    return;
  }

  // If custom content is provided, use it directly (plain text will be converted to HTML)
  if (data.customContent) {
    const htmlContent = data.customContent.replace(/\n/g, "<br />");
    try {
      await resend.emails.send({
        from: "noreply@vculture.com",
        to: data.email,
        subject: `Ερωτηματολόγιο για την Ευκαιρία: ${data.opportunityTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Ερωτηματολόγιο για την Ευκαιρία</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ ΓΙΑ ΕΥΚΑΙΡΙΑ</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; white-space: pre-wrap;">
                ${htmlContent}
              </div>
            </body>
          </html>
        `,
      });
      return;
    } catch (error) {
      console.error("Error sending custom questionnaire email:", error);
      throw error;
    }
  }

  const questionsHtml = data.questions.map((q, index) => `
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">${index + 1}. ${q.title}</h3>
      <p style="font-size: 16px; line-height: 1.8; margin: 10px 0;">${q.question}</p>
      ${q.description ? `<p style="font-size: 14px; color: #666; font-style: italic; margin-top: 10px;">${q.description}</p>` : ""}
    </div>
  `).join("");

  try {
    await resend.emails.send({
      from: "noreply@vculture.com", // Update with your verified domain
      to: data.email,
      subject: `Ερωτηματολόγιο για την Ευκαιρία: ${data.opportunityTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ερωτηματολόγιο για την Ευκαιρία</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ ΓΙΑ ΕΥΚΑΙΡΙΑ</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Καλησπέρα ${data.contactName},</p>
              <p>Σας ενημερώνουμε ότι για την ευκαιρία <strong>${data.opportunityTitle}</strong> της εταιρείας <strong>${data.companyName}</strong>, χρειαζόμαστε τις απαντήσεις σας στις παρακάτω ερωτήσεις:</p>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-weight: bold; color: #856404;">ΣΗΜΑΝΤΙΚΟ:</p>
                <p style="margin: 5px 0 0 0; color: #856404;">Παρακαλούμε απαντήστε σε όλες τις ερωτήσεις με λεπτομέρεια. Οι απαντήσεις σας θα μας βοηθήσουν να προετοιμάσουμε μια πλήρη και ακριβή πρόταση για την ευκαιρία.</p>
              </div>

              ${questionsHtml}

              <p style="margin-top: 30px;">Παρακαλούμε απαντήστε σε όλες τις ερωτήσεις μέσω του παρακάτω συνδέσμου:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.opportunityUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">ΑΠΑΝΤΗΣΤΕ ΣΤΟ ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ</a>
              </div>
              
              <p style="font-size: 12px; color: #666;">Ή αντιγράψτε και επικολλήστε τον παρακάτω σύνδεσμο στον browser σας:</p>
              <p style="font-size: 12px; color: #666; word-break: break-all;">${data.opportunityUrl}</p>
              
              <p style="margin-top: 30px;">Ευχαριστούμε για τον χρόνο σας.</p>
              <p style="margin-top: 5px;">Με εκτίμηση,<br>Η Ομάδα</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send questionnaire email:", error);
    throw error;
  }
}

