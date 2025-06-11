// src/domain/services/loanCalculationService.ts
import { LoanRepaymentFrequency } from '@domain/enums/loanEnum'

interface LoanMetrics {
  periodicPayment: number
  totalPayable: number
  totalInterest: number
  totalPayments: number
}

const calculateLoanMetrics = (
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  frequency: LoanRepaymentFrequency,
): LoanMetrics => {
  const monthlyRate = interestRate / 100 / 12

  // Calculate number of payments based on frequency
  const paymentsPerMonth: { [key in LoanRepaymentFrequency]: number } = {
    [LoanRepaymentFrequency.DAILY]: 30.44, // approximately 365 days per year / 12 months
    [LoanRepaymentFrequency.WEEKLY]: 4.33, // approximately 52 weeks per year / 12 months
    [LoanRepaymentFrequency.BI_WEEKLY]: 2.17, // approximately 26 payments per year / 12 months
    [LoanRepaymentFrequency.MONTHLY]: 1,
    [LoanRepaymentFrequency.QUARTERLY]: 0.33, // 4 payments per year / 12 months
    [LoanRepaymentFrequency.SEMI_ANNUALLY]: 0.17, // 2 payments per year / 12 months
    [LoanRepaymentFrequency.ANNUALLY]: 0.083, // 1 payment per year / 12 months
  }

  const totalPayments = termMonths * paymentsPerMonth[frequency]
  const paymentRate = monthlyRate / paymentsPerMonth[frequency]

  // Calculate periodic payment using loan formula
  const periodicPayment =
    paymentRate > 0
      ? (loanAmount * paymentRate * Math.pow(1 + paymentRate, totalPayments)) /
        (Math.pow(1 + paymentRate, totalPayments) - 1)
      : loanAmount / totalPayments

  const totalPayable = periodicPayment * totalPayments
  const totalInterest = totalPayable - loanAmount

  return {
    periodicPayment: Math.round(periodicPayment * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round(totalPayments),
  }
}

export default calculateLoanMetrics
