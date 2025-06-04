import { LoanOfferStatusEnum } from '@domain/enums/loanEnum'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const loanOfferFiltersSchema = withPaginateSchema(
  z.object({
    lender_org_id: z.string().optional(),
    status: z.nativeEnum(LoanOfferStatusEnum).optional(),
    organization_id: z.string().optional(),
    user_id: z.string().optional(),
  }),
)

export type LoanOfferFilters = z.infer<typeof loanOfferFiltersSchema>

export const loanFilterSchema = withPaginateSchema(
  z.object({
    lender_org_id: z.string().optional(),
    status: z.string().optional(),
    organization_id: z.string().optional(),
    user_id: z.string().optional(),
    application_id: z.string().optional(),
  }),
)

export type LoanFilters = z.infer<typeof loanFilterSchema>
