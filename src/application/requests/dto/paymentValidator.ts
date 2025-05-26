import { PaymentStatus, PaymentType } from '@domain/enums/PaymentEnum'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const paymentFiltersSchema = withPaginateSchema(
  z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    user_id: z.string().optional(),
    payment_type: z.nativeEnum(PaymentType).optional(),
    q: z.string().optional(),
  }),
)

export type PaymentFilters = z.infer<typeof paymentFiltersSchema>
