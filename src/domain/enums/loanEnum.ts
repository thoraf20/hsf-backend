export enum LoanStatusEnum {
  Active = 'Active',
  PaidOff = 'PaidOff',
  Defaulted = 'Defaulted',
}

export enum LoanOfferStatusEnum {
  Pending = 'Pending',
  Offered = 'Offered',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum LoanRepaymentScheduleStatusEnum {
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Skipped = 'Skipped',
}

export enum LoanDecisionStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
  WITHDRAWN = 'Withdrawn',
}

export enum LoanOfferWorkflowStatus {
  GENERATED = 'Generated', // Initial state after creation
  UNDER_REVIEW = 'Under Review', // Lender is reviewing and inputting data
  READY = 'Ready', // Ready for user to accept or reject
}

export enum LoanRepaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI-WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI-ANNUALLY',
  ANNUALLY = 'ANNUALLY',
}

export enum LoanType {
  FIXED = 'fixed',
  VARIABLE = 'variable',
  ADJUSTABLE_RATE = 'adjustable_rate',
}

export enum LoanAgreementStatus {
  Draft = 'Draft',
  PendingApproval = 'Pending Approval',
  Approved = 'Approved',
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}
