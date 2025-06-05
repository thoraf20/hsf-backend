export enum PaymentEnum {
  PAYPAL = 'PAYPAL',
  PAYSTACK = 'PAYSTACK',
  FLUTTERWARE = 'FLUTTERWARE',
}

export enum MortgagePaymentType {
  DUE_DILIGENT = 'PAYMENT_FOR_DUE_DILIGENT',
  BROKER_FEE = 'PAYMENT_FOR_BROKER_FEE',
  DECISION_IN_PRINCIPLE = 'Decision In Principle',
  MANAGEMENT_FEE = 'Management Fee',
}

export enum PaymentType {
  DUE_DILIGENT = MortgagePaymentType.DECISION_IN_PRINCIPLE,
  BROKER_FEE = MortgagePaymentType.BROKER_FEE,
  INSPECTION = 'PAYMENT_FOR_INSPECTION',
  MANAGEMENT_FEE = MortgagePaymentType.MANAGEMENT_FEE,
}

export enum PaymentStatus {
  ABANDONED = 'abandoned',
  FAILED = 'failed',
  ONGOING = 'ongoing',
  PENDING = 'pending',
  PROCESSING = 'processing',
  QUEUED = 'queued',
  REVERSED = 'reversed',
  SUCCESS = 'success',
}

export enum DipPaymentStatus {
  Completed = 'Completed',
  Failed = 'Failed',
  Pending = 'Pending',
}
