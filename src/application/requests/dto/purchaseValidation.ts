import { OfferLetterStatusEnum, PurchaseEnum } from '@domain/enums/propertyEnum'
import { z } from 'zod'

export const purchasePropertySchema = z.object({
  property_id: z.string().nonempty(),
  purchase_type: z.nativeEnum(OfferLetterStatusEnum),
  request_type: z.nativeEnum(PurchaseEnum),
  escrow_id: z.string().optional(),
})
