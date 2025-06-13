import { LoanOfferWorkflowStatus } from '@domain/enums/loanEnum'
import { LoanRepaymentFrequency } from '@domain/enums/propertyEnum'
import { z } from 'zod'

export const updateLoanOfferSchema = z.object({
  loan_amount: z.coerce.number(),
  interest_rate: z.coerce.number().max(1),
  loan_term_months: z.coerce.number(),
  repayment_frequency: z.nativeEnum(LoanRepaymentFrequency),
  offer_date: z.coerce.date(),
  expiry_date: z.coerce.date(),
  total_interest_estimate: z.number().optional(),
  total_payable_estimate: z.number().optional(),
  estimated_periodic_payment: z.number().optional(),
  late_payment_penalty_details: z.string().optional(),
  financing_details: z.string().optional(),
  repayment_method_details: z.string().optional(),
  lender_comments: z.array(z.string()).optional(),
})

export type UpdateLoanOfferInput = z.infer<typeof updateLoanOfferSchema>

export const setLoanOfferWorkflowStatusSchema = z.object({
  workflow_status: z.enum([
    LoanOfferWorkflowStatus.READY,
    LoanOfferWorkflowStatus.UNDER_REVIEW,
  ]),
  loan_offer_letter_url: z.string().url().optional(),
})

export type SetLoanOfferWorkflowStatusInput = z.infer<
  typeof setLoanOfferWorkflowStatusSchema
>
