export enum NotificationMediumKind {
  Email = 'Email',
  InApp = 'In-app',
  SmsAlert = 'SMS Alerts',
}

export enum NotificationTypeKind {
  PropertyListingAlerts = 'Property Listing Alerts',
  LoanApplicationNotifications = 'Loan Application Notifications',
  AgentDeveloperActivityReport = 'Agent/Developer Activity Report',
  ClientInquiryAlerts = 'Client Inquiry Alerts',
  PaymentTransactionAlerts = 'Payment/Transaction Alerts',
}

export enum NotificationFrequencyKind {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}
