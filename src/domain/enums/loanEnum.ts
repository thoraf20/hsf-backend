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
