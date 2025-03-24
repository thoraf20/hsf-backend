import { Worker } from "worker_threads";
import path from "path";
import { emailTemplates } from "../../infrastructure/email/templates";
import { Email } from "../../domain/entities/Email";

export class EmailService {
  static sendEmail(emailType: string, input: Email) {
    const template = emailTemplates[emailType];
    if (!template) {
      throw new Error(`Email template for ${emailType} not found.`);
    }

    // Generate email content using Handlebars
    const emailData = {
      to: input.recipient,
      subject: EmailService.getEmailSubject(emailType),
      html: template(input.html), 
    };

    // Create a worker thread to send email
    const worker = new Worker(path.join(__dirname, "../../workers/EmailWorker.js"), {
      workerData: emailData,
    });

    worker.on("message", (msg) => console.log("Worker:", msg));
    worker.on("error", (err) => console.error("Worker Error:", err));
  }

  private static getEmailSubject(emailType: string): string {
    const subjects: Record<string, string> = {
      registration: "Welcome to YourApp – Verify Your Email",
      resetPassword: "Reset Your Password",
      welcome: "Welcome to YourApp",
      inviteAgent: "You've Been Invited as an Agent",
    };
    return subjects[emailType] || "YourApp Notification";
  }
}
