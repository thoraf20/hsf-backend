import {  OfferLetterStatusEnum, PurchaseEnum } from '@domain/enums/propertyEnum'
import { z } from 'zod'

const DocumentSchema = z.object({
  type: z.string(),
  document_img_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .or(z.string().url('Invalid document URL')),
})

export const purchasePropertySchema = z.object({
  property_id: z.string().nonempty(),
  purchase_type: z.nativeEnum(OfferLetterStatusEnum),
  request_type: z.nativeEnum(PurchaseEnum),
  escrow_id: z.string().optional(),
  dip_status: z.string().optional(),
  document: z.array(DocumentSchema).optional()
})
