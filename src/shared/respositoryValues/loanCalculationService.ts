// src/domain/services/loanCalculationService.ts
import { LoanRepaymentFrequency, LoanType } from '@domain/enums/loanEnum'

interface LoanMetrics {
  periodicPayment: number
  totalPayable: number
  totalInterest: number
  totalPayments: number
}

const calculateLoanMetrics = (
  loanAmount: number,
  annualInterestRate: number,
  termMonths: number,
  frequency: LoanRepaymentFrequency,
  loanType: LoanType = LoanType.FIXED,
): LoanMetrics => {
  // Apply loan type adjustment to base rate
  let adjustedAnnualRate = annualInterestRate

  switch (loanType) {
    case LoanType.VARIABLE:
    case LoanType.ADJUSTABLE_RATE:
      adjustedAnnualRate = annualInterestRate + 1 // Add 1% for variable/adjustable loans
      break
    case LoanType.FIXED:
      // No adjustment for fixed rate
      break
    default:
      break
  }

  // Convert annual rate to decimal
  const annualRateDecimal = adjustedAnnualRate / 100

  // Calculate payments per year and periodic interest rate based on frequency
  let paymentsPerYear: number
  let periodicRate: number

  switch (frequency) {
    case LoanRepaymentFrequency.DAILY:
      paymentsPerYear = 365
      periodicRate = annualRateDecimal / 365
      break
    case LoanRepaymentFrequency.WEEKLY:
      paymentsPerYear = 52
      periodicRate = annualRateDecimal / 52
      break
    case LoanRepaymentFrequency.BI_WEEKLY:
      paymentsPerYear = 26
      periodicRate = annualRateDecimal / 26
      break
    case LoanRepaymentFrequency.MONTHLY:
      paymentsPerYear = 12
      periodicRate = annualRateDecimal / 12
      break
    case LoanRepaymentFrequency.QUARTERLY:
      paymentsPerYear = 4
      periodicRate = annualRateDecimal / 4
      break
    case LoanRepaymentFrequency.SEMI_ANNUALLY:
      paymentsPerYear = 2
      periodicRate = annualRateDecimal / 2
      break
    case LoanRepaymentFrequency.ANNUALLY:
      paymentsPerYear = 1
      periodicRate = annualRateDecimal
      break
    default:
      throw new Error(`Unsupported payment frequency: ${frequency}`)
  }

  // Calculate total number of payments
  const totalPayments = Math.round((termMonths / 12) * paymentsPerYear)

  // Calculate periodic payment using the standard loan payment formula
  let periodicPayment: number

  if (periodicRate > 0) {
    // Standard amortization formula: PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
    const powerTerm = Math.pow(1 + periodicRate, totalPayments)
    periodicPayment =
      (loanAmount * (periodicRate * powerTerm)) / (powerTerm - 1)
  } else {
    // If interest rate is 0, simple division
    periodicPayment = loanAmount / totalPayments
  }

  // Calculate totals
  const totalPayable = periodicPayment * totalPayments
  const totalInterest = totalPayable - loanAmount

  return {
    periodicPayment: Math.round(periodicPayment * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: totalPayments,
  }
}

export default calculateLoanMetrics
