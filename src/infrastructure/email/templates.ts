import Handlebars from "handlebars";

// Define email templates
const registrationTemplate = Handlebars.compile(`
  <h2>Welcome, {{name}}!</h2>
  <p>Thank you for joining {{appName}}. Click below to verify your email:</p>
  <a href="{{verificationLink}}">Verify Email</a>
`);

const resetPasswordTemplate = Handlebars.compile(`
  <h2>Reset Your Password</h2>
  <p>Click the link below to set a new password:</p>
  <a href="{{resetLink}}">Reset Password</a>
`);

const welcomeTemplate = Handlebars.compile(`
  <h2>Welcome to {{appName}}, {{name}}!</h2>
  <p>We're glad to have you on board.</p>
`);

const inviteAgentTemplate = Handlebars.compile(`
  <h2>Hello, {{name}}</h2>
  <p>You have been invited by {{adminName}} to join {{appName}}.</p>
  <a href="{{invitationLink}}">Accept Invitation</a>
`);

// Export templates
export const emailTemplates = {
  registration: registrationTemplate,
  resetPassword: resetPasswordTemplate,
  welcome: welcomeTemplate,
  inviteAgent: inviteAgentTemplate,
};
