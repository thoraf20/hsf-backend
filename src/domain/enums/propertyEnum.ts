export enum FinancialOptionsEnum {
  MORTGAGE = 'Mortgage',
  OUTRIGHT = 'Outright Purchase',
  INSTALLMENT = 'Installment',
}

export enum PreQualifierEnum {
  MORTGAGE = 'Mortgage',
  INSTALLMENT = 'Installment',
}

export enum PropertyRequestTypeEnum {
  OfferLetter = 'Offer Letter',
  INITIATE = 'Initiate',
  PROPERTY_CLOSSING = 'Property Closing',
  ELIGIBILITY_CHECK = 'Eligibility Check',
  ESCROW_ATTENDANCE = 'Escrow Attendance',
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

export enum propertyApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
}

export enum EscrowMeetingStatus {
  AWAITING = 'Awaiting',
  CONFIRMED = 'Confirmed',
  DECLINED = 'Declined',
}

export enum LoanOfferStatus {
  ACCEPTED = 'Accepted',
  DECLINED = 'Declined',
}

export enum InspectionStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELED = 'Canceled',
}

export enum DIPStatus {
  DECLINED = 'Declined',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}
