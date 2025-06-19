import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const loanAgreementFilterSchema = withPaginateSchema(
  z.object({
    lender_org_id: z.string().optional(),
    loan_id: z.string().optional(),
    loan_offer_id: z.string().optional(),
    status: z.string().optional(),
    organization_id: z.string().optional(),
    user_id: z.string().optional(),
    application_id: z.string().optional(),
  }),
)

export type LoanAgreementFilters = z.infer<typeof loanAgreementFilterSchema>

export const setLoanAgreementLetterSchema = z.object({
  application_id: z.string().nullish(),
  document: z
    .object({
      name: z.string().nullish(),
      url: z.string().url(),
      size: z.number().nullish(),
      ext: z.string().nullish(),
    })
    .nullable(),
})

export type SetLoanAgreementLetterInput = z.infer<
  typeof setLoanAgreementLetterSchema
>
