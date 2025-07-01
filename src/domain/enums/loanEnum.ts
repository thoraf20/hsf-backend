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
  /**
   * The initial stage where the loan agreement is created but not yet fully prepared
   * or sent for any official action. It's still in an editable, preliminary state.
   */
  Draft = 'Draft',
  /**
   * At this stage, the loan agreement has been initiated, and the next step is
   * for the lender to upload the official loan agreement document.
   */
  LenderUploadPending = 'Lender Upload Pending',
  /**
   * Once the lender has uploaded the loan agreement, it moves to this stage,
   * where it awaits review and approval from the relevant parties, typically the borrower.
   */
  PendingApproval = 'Pending Approval',
  /**
   * After the loan agreement has been reviewed and provisionally approved,
   * the borrower needs to digitally sign the agreement and then upload the signed version back into the system.
   */
  BorrowerSignAndUploadPending = 'Borrower Sign & Upload Pending',
  /**
   * This stage signifies that all necessary parties (both lender and borrower) have approved
   * the loan agreement, and all required documents, including the signed agreement,
   * have been successfully uploaded and verified.
   */
  Approved = 'Approved',
  /**
   * The loan agreement is now fully executed, and the loan itself is considered "active."
   * This usually means the funds have been disbursed or are in the process of being disbursed,
   * and the terms of the loan are in effect.
   */
  Active = 'Active',
  /**
   * The loan agreement has reached its natural conclusion. This typically means the loan has
   * been fully repaid, or all obligations defined within the agreement have been met.
   */
  Completed = 'Completed',
  /**
   * This stage indicates that the loan agreement process was terminated prematurely for any
   * reason before it reached completion or activation.
   */
  Cancelled = 'Cancelled',
}
