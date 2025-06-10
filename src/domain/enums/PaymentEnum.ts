export enum PaymentEnum {
  PAYPAL = 'PAYPAL',
  PAYSTACK = 'PAYSTACK',
  FLUTTERWARE = 'FLUTTERWARE',
}

export enum MortgagePaymentType {
  DUE_DILIGENT = 'Due Diligent',
  BROKER_FEE = 'Broker Fee',
  MANAGEMENT_FEE = 'Management Fee',
}

export enum PaymentType {
  BROKER_FEE = MortgagePaymentType.BROKER_FEE,
  INSPECTION = 'PAYMENT_FOR_INSPECTION',
  MANAGEMENT_FEE = MortgagePaymentType.MANAGEMENT_FEE,
  DUE_DILIGENT = MortgagePaymentType.DUE_DILIGENT,
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
