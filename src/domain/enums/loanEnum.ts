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

export enum LoanRepaymentFrequencyEnum {
  Quarterly = 'Quarterly',
  Annually = 'Annually',
}

export enum LoanRepaymentScheduleStatusEnum {
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Skipped = 'Skipped',
}
