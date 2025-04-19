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
export const purchasePropertySchema = z
  .object({
    property_id: z.string().nonempty(),
    purchase_type: z.nativeEnum(OfferLetterStatusEnum),
    request_type: z.nativeEnum(PurchaseEnum),
    escrow_id: z.string().optional(),
    dip_status: z.string().optional(),
    email: z.string().email().optional(),
    loan_acceptance_status: z.string().optional(),
    documents: z.array(DocumentSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const { request_type } = data;

    if (
      [PurchaseEnum.DUE_DELIGENT, PurchaseEnum.BROKER_FEE, PurchaseEnum.MANAGEMENT_FEE].includes(request_type)
    ) {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'email is required',
          path: ['email'],
        });
      }
    }

    if (request_type === PurchaseEnum.ACCEPT_DIP && !data.dip_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dip_status is required',
        path: ['dip_status'],
      });
    }

    if (request_type === PurchaseEnum.ESCROW_ATTENDANCE && !data.escrow_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'escrow_id is required',
        path: ['escrow_id'],
      });
    }

    if (
      [PurchaseEnum.DOCUMENT_UPLOAD, PurchaseEnum.PRECEDENT_DOC].includes(request_type) &&
      (!data.documents || data.documents.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'documents are required',
        path: ['documents'],
      });
    }

    if (request_type === PurchaseEnum.ACCEPT_LOAN && !data.loan_acceptance_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'loan_acceptance_status is required',
        path: ['loan_acceptance_status'],
      });
    }
  });
