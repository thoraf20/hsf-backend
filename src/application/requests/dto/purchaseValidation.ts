import {
  ApplicationPurchaseType,
  DIPStatus,
  LoanOfferStatus,
  OfferLetterStatusEnum,
  PropertyRequestTypeEnum,
} from '@domain/enums/propertyEnum'
import { z } from 'zod'

export const DocumentSchema = z.object({
  type: z.string(),
  document_img_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .or(z.string().url('Invalid document URL')),
})
export const purchasePropertySchema = z
  .object({
    property_id: z.string().nonempty(),
    purchase_type: z.nativeEnum(ApplicationPurchaseType),
    request_type: z.nativeEnum(PropertyRequestTypeEnum),
    escrow_status_id: z.string().optional(),
    dip_status: z.nativeEnum(DIPStatus).optional(),
    email: z.string().email().optional(),
    loan_acceptance_status: z.nativeEnum(LoanOfferStatus).optional(),
    documents: z.array(DocumentSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const { request_type } = data

    if (
      [
        PropertyRequestTypeEnum.DUE_DELIGENT,
        PropertyRequestTypeEnum.BROKER_FEE,
        PropertyRequestTypeEnum.MANAGEMENT_FEE,
      ].includes(request_type)
    ) {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'email is required',
          path: ['email'],
        })
      }
    }

    if (
      request_type === PropertyRequestTypeEnum.ACCEPT_DIP &&
      !data.dip_status
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dip_status is required',
        path: ['dip_status'],
      })
    }

    if (
      (request_type === PropertyRequestTypeEnum.ACCEPT_ESCOW_MEETING &&
        !data.escrow_status_id) ||
      (request_type === PropertyRequestTypeEnum.REJECT_ESCOW_MEETING &&
        !data.escrow_status_id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'escrow_status_id is required',
        path: ['escrow_status_id'],
      })
    }

    if (
      [
        PropertyRequestTypeEnum.DOCUMENT_UPLOAD,
        PropertyRequestTypeEnum.PRECEDENT_DOC,
      ].includes(request_type) &&
      (!data.documents || data.documents.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'documents are required',
        path: ['documents'],
      })
    }

    if (
      request_type === PropertyRequestTypeEnum.ACCEPT_LOAN &&
      !data.loan_acceptance_status
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'loan_acceptance_status is required',
        path: ['loan_acceptance_status'],
      })
    }
  })

export type PurchasePropertyInput = z.infer<typeof purchasePropertySchema>
