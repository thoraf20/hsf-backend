export enum PreQualifierEnum {
  MORTGAGE = 'Mortgage',
  INSTALLMENT = 'Installment',
}

export enum PropertyRequestTypeEnum {
  OfferLetter = 'Offer Letter',
  INITIATE = 'Initiate',
  PROPERTY_CLOSSING = 'Property Closing',
  ELIGIBILITY_CHECK = 'Eligibility Check',
  REJECT_ESCOW_MEETING = 'Reject escrow meeting',
  ACCEPT_ESCOW_MEETING = 'Accept escrow meeting',
  DUE_DELIGENT = 'PAYMENT_FOR_DUE_DELIGENT',
  BROKER_FEE = 'PAYMENT_FOR_BROKER_FEE',
  MANAGEMENT_FEE = 'PAYMENT_FOR_MANAGEMENT_FEE',
  ACCEPT_DIP = 'Accept Dip',
  DOCUMENT_UPLOAD = 'Document Upload',
  PRECEDENT_DOC = 'Precendent Upload',
  ACCEPT_LOAN = 'Accept Loan',
}

export enum OfferLetterStatusEnum {
  OUTRIGHT = 'Outright Purchase',
  INSTALLMENT = 'Installment',
  Mortgage = 'Mortgage',
}

export enum ApplicationPurchaseType {
  OUTRIGHT = 'Outright',
  INSTALLMENT = 'Installment',
  MORTGAGE = 'Mortgage',
}

export enum PropertyFeatureEnum {
  AIRCONDITION = 'Air Condition',
  PARKING_SPACE = 'Parking Space',
  PLAYGROUND = 'Playground',
  SPA = 'Spa',
  LOBBY = 'Lobby',
  WIFI = 'Wifi',
  LUADRY = 'Laundry',
  SAUNA = 'Sauna',
  FAMILYROOM = 'Family Room',
}

export enum DocumentTypeEnum {
  LEGAL_REPORT = 'Legal Report',
  VERIFICATION_REPORT = 'Verification Report',
}

export enum MeetingPlatform {
  WHATSAPP = 'WhatsApp',
  GOOGLE_MEET = 'Google Meet',
  ZOOM = 'Zoom',
  TEAMS = 'Teams',
  FACE_TIME = 'FaceTime',
}

export enum InspectionMeetingType {
  IN_PERSON = 'In Person',
  VIDEO_CHAT = 'Video Chat',
}

export enum InspectionRescheduleStatusEnum {
  Rejected = 'Rejected',
  Accepted = 'Accepted',
}

export enum PropertyApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
}

export enum EscrowMeetingStatus {
  AWAITING = 'Awaiting',
  CONFIRMED = 'Confirmed',
  DECLINED = 'Declined',
  AWAITING_ACCEPTANCE = 'Awaiting Acceptance',
}

export enum LoanOfferStatus {
  ACCEPTED = 'Accepted',
  PENDING = 'Pending',
  DECLINED = 'Declined',
}

export enum LoanRepaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
}

export enum InspectionStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELED = 'Canceled',
}

export enum DIPStatus {
  Generated = 'Generated',
  AwaitingUserAction = 'Awaiting User Action',
  AwaitingLenderAction = 'Awaiting Lender Action',
  PaymentPending = 'Payment Pending',
  DocumentsPending = 'Documents Pending',
  DocumentReviewing = 'Document Reviewing',
  Completed = 'Completed',
}

export enum DipDocumentReviewStatus {
  NotUploaded = 'Not Uploaded',
  Reviewing = 'Reviewing',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum DIPLenderStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum UserAction {
  Accept = 'Accept',
  Reject = 'Reject',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}

export enum OfferLetterStatus {
  Approved = 'Approved',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

export enum PropertyClosingStatus {
  Approved = 'Approved',
  Pending = 'Pending',
  Rejected = 'Rejected',
}
