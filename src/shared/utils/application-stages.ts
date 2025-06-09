import { ApplicationPurchaseType } from '@domain/enums/propertyEnum'
import {
  ApplicationStage,
  OutrightApplicationStage,
  MortgageApplicationStage,
  InstallmentApplicationStage,
} from '@domain/entities/Application'

export const getApplicationStages = (
  applicationType: ApplicationPurchaseType,
): ApplicationStage[] => {
  switch (applicationType) {
    case ApplicationPurchaseType.OUTRIGHT:
      return [
        new ApplicationStage(OutrightApplicationStage.OfferLetter),
        new ApplicationStage(OutrightApplicationStage.PropertyClosing),
        new ApplicationStage(OutrightApplicationStage.EscrowMeeting),
        new ApplicationStage(OutrightApplicationStage.PaymentTracker),
        new ApplicationStage(OutrightApplicationStage.Purchased),
      ]
    case ApplicationPurchaseType.MORTGAGE:
      return [
        new ApplicationStage(MortgageApplicationStage.PreQualification),
        new ApplicationStage(MortgageApplicationStage.DecisionInPrinciple),
        new ApplicationStage(MortgageApplicationStage.UploadDocument),
        new ApplicationStage(MortgageApplicationStage.LoanDecision),
        new ApplicationStage(MortgageApplicationStage.LoanOffer),
        new ApplicationStage(MortgageApplicationStage.ConditionPrecedent),
        new ApplicationStage(MortgageApplicationStage.Repayment),
        new ApplicationStage(MortgageApplicationStage.Purchased),
      ]
    case ApplicationPurchaseType.INSTALLMENT:
      return [
        new ApplicationStage(InstallmentApplicationStage.PaymentCalculator),
        new ApplicationStage(InstallmentApplicationStage.PreQualification),
        new ApplicationStage(InstallmentApplicationStage.OfferLetter),
        new ApplicationStage(InstallmentApplicationStage.PropertyClosing),
        new ApplicationStage(InstallmentApplicationStage.Repayment),
        new ApplicationStage(InstallmentApplicationStage.Purchased),
      ]
    default:
      return []
  }
}

export const getNextStage = (
  applicationType: ApplicationPurchaseType,
  currentStage: ApplicationStage,
): ApplicationStage | null => {
  switch (applicationType) {
    case ApplicationPurchaseType.OUTRIGHT:
      switch (currentStage.stage) {
        case OutrightApplicationStage.OfferLetter:
          return new ApplicationStage(OutrightApplicationStage.PropertyClosing)
        case OutrightApplicationStage.PropertyClosing:
          return new ApplicationStage(OutrightApplicationStage.EscrowMeeting)
        case OutrightApplicationStage.EscrowMeeting:
          return new ApplicationStage(OutrightApplicationStage.PaymentTracker)
        case OutrightApplicationStage.PaymentTracker:
          return new ApplicationStage(OutrightApplicationStage.Purchased)
        case OutrightApplicationStage.Purchased:
          return null
        default:
          return null
      }
    case ApplicationPurchaseType.MORTGAGE:
      switch (currentStage.stage) {
        case MortgageApplicationStage.PreQualification:
          return new ApplicationStage(
            MortgageApplicationStage.DecisionInPrinciple,
          )
        case MortgageApplicationStage.DecisionInPrinciple:
          return new ApplicationStage(MortgageApplicationStage.UploadDocument)
        case MortgageApplicationStage.UploadDocument:
          return new ApplicationStage(MortgageApplicationStage.LoanDecision)
        case MortgageApplicationStage.LoanDecision:
          return new ApplicationStage(MortgageApplicationStage.LoanOffer)
        case MortgageApplicationStage.LoanOffer:
          return new ApplicationStage(
            MortgageApplicationStage.ConditionPrecedent,
          )
        case MortgageApplicationStage.ConditionPrecedent:
          return new ApplicationStage(MortgageApplicationStage.Repayment)
        case MortgageApplicationStage.Repayment:
          return new ApplicationStage(MortgageApplicationStage.Purchased)
        case MortgageApplicationStage.Purchased:
          return null // No next stage
        default:
          return null
      }
    case ApplicationPurchaseType.INSTALLMENT:
      switch (currentStage.stage) {
        case InstallmentApplicationStage.PaymentCalculator:
          return new ApplicationStage(
            InstallmentApplicationStage.PreQualification,
          )
        case InstallmentApplicationStage.PreQualification:
          return new ApplicationStage(InstallmentApplicationStage.OfferLetter)
        case InstallmentApplicationStage.OfferLetter:
          return new ApplicationStage(
            InstallmentApplicationStage.PropertyClosing,
          )
        case InstallmentApplicationStage.PropertyClosing:
          return new ApplicationStage(InstallmentApplicationStage.Repayment)
        case InstallmentApplicationStage.Repayment:
          return new ApplicationStage(InstallmentApplicationStage.Purchased)
        case InstallmentApplicationStage.Purchased:
          return null // No next stage
        default:
          return null
      }
    default:
      return null
  }
}
