export enum DocumentApprovalEnum {
  Pending = 'Pending',
  Reviewing = 'Reviewing',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum DocumentGroupKind {
  DeveloperVerification = 'DeveloperVerification',
  ConditionPrecedent = 'ConditionPrecedent',
  MortgageUpload = 'MortgageUpload',
  PropertyReport = 'PropertyReport',
  LoanAgreement = 'LoanAgreement',
}

export enum DeveloperVerificationDocType {
  ApplicationLetterSigned = 'ApplicationLetterSigned',
  CAC = 'Cac',
  MemorandumAndArticlesOfAssociation = 'MemorandumAndArticlesOfAssociation',
  CompanyFinancialBankStatement = 'CompanyFinancialBankStatement',
  CompanyAuditFinancials = 'CompanyAuditFinancials',
  TaxCertificate = 'TaxCertificate',
  PropertySurveyAndTitle = 'PropertySurveyAndTitle',
  BillOfQuantity = 'BillOfQuantity',
  ConstructionContractorsAndServiceAgreements = 'ConstructionContractorsAndServiceAgreements',
  CashFlowProjectAndProfitabilityAnalysis = 'CashFlowProjectAndProfitabilityAnalysis',
  MarketingStrategyAndListOfOffTakers = 'MarketingStrategyAndListOfOffTakers',
  ProjectImplementationPlan = 'ProjectImplementationPlan',
  FundUtilizationPlan = 'FundUtilizationPlan',
}

export enum ConditionPrecedentDocType {
  SignedLoanOfferLetter = 'SignedLoanOfferLetter',
  InsurancePaymentConfirmation = 'InsurancePaymentConfirmation',
  FinalBankApproval = 'FinalBankApproval',
  LegalAndComplianceDocuments = 'LegalAndComplianceDocuments',
}

export enum MortgageUploadDocType {
  PassportPhotograph = 'PassportPhotograph',
  LoanApplicationForm = 'LoanApplicationForm',
  LoanAgreement = 'LoanAgreement',
  FireAndSpecialPerilsInsurance = 'FireAndSpecialPerilsInsurance',
  RecentPaySlip = 'RecentPaySlip',
  TaxReturn = 'TaxReturn',
  EmploymentLetter = 'EmploymentLetter',
  EmploymentLetterOfIntroduction = 'EmploymentLetterOfIntroduction',
  BankStatements = 'BankStatements',
  SixUndatedCheque = 'SixUndatedCheque', // Renamed slightly for clarity
}

export enum PropertyReportDocType {
  LandReport = 'LandReport',
  VerificationReport = 'VerificationReport',
}

export enum LoanAgreementType {
  LenderSignedAgreementLetter = 'LenderSignedAgreementLetter',
  BuyerSignedAgreementLetter = 'BuyerSignedAgreementLetter',
}
