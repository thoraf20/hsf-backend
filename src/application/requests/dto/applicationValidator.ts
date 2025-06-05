import { DocumentGroupKind } from '@domain/enums/documentEnum'
import { MortgagePaymentType, PaymentEnum } from '@domain/enums/PaymentEnum'
import {
  ApplicationPurchaseType,
  ApplicationStatus,
  DIPStatus,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
import { ReviewRequestApprovalStatus } from '@entities/Request'
import { QueryBoolean } from '@shared/utils/helpers'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const createApplicationSchema = z
  .object({
    property_id: z.string().nonempty(),
    purchase_type: z.nativeEnum(ApplicationPurchaseType),

    payment_calculator: z
      .object({
        interest_rate: z.coerce.number().positive(),
        terms: z.number(),
        repayment_type: z.string(),
      })
      .optional()
      .nullable(),
  })
  .refine(
    (form) =>
      form.purchase_type === ApplicationPurchaseType.INSTALLMENT
        ? !!form.payment_calculator
        : true,
    {
      message: 'payment calculated information required for Installment option',
      path: ['payment_calculator'],
    },
  )

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>

export const requestPropertyClosingSchema = z.object({
  closing_status: z.enum([
    PropertyClosingStatus.Approved,
    PropertyClosingStatus.Rejected,
  ]),

  reason: z.string().nonempty().optional(),
})

export type RequestPropertyClosingInput = z.infer<
  typeof requestPropertyClosingSchema
>

export const requestOfferLetterRespondSchema = z.object({
  approval_id: z.string().nonempty(),
  offer_letter_status: z.enum([
    OfferLetterStatus.Approved,
    OfferLetterStatus.Rejected,
  ]),
  reasons: z.string().nonempty().optional(),
})

export type RequestOfferLetterRespondInput = z.infer<
  typeof requestOfferLetterRespondSchema
>

export const scheduleEscrowMeetingSchema = z.object({
  date: z.string().date(),
  time: z.string().time(),
  location: z.string().nonempty(),
  attendees: z.array(z.string()).nonempty({
    message: 'need, you need to select at least one person',
  }),
})

export type ScheduleEscrowMeetingInput = z.infer<
  typeof scheduleEscrowMeetingSchema
>

export const scheduleEscrowMeetingRespondSchema = z.object({
  approval_id: z.string().nonempty(),
  confirm_attendance: z.boolean(),
  reason: z.string().nonempty().optional(),
})

export type ScheduleEscrowMeetingRespondInput = z.infer<
  typeof scheduleEscrowMeetingRespondSchema
>

export const offerLetterFiltersSchema = withPaginateSchema(
  z.object({
    status: z.string().optional(),
    user_id: z.string().nonempty().optional(),
    organization_id: z.string().nonempty().optional(),
  }),
)

export type OfferLetterFilters = z.infer<typeof offerLetterFiltersSchema> &
  Partial<{
    approver_id: string
  }>

export const dipFiltersSchema = withPaginateSchema(
  z.object({
    status: z.nativeEnum(DIPStatus).optional(),
    user_id: z.string().nonempty().optional(),
    property_id: z.string().nonempty().optional(),
    lender_id: z.string().nonempty().optional(),
    organization_id: z.string().nonempty().optional(),
  }),
)

export type DipFilters = z.infer<typeof dipFiltersSchema>

export const updateDipLoanSchema = z.object({
  approved_loan_amount: z.coerce.number(),
  interest_rate: z.coerce.number(),
  loan_term: z.coerce.number().int(),
})

export type UpdateDipLoanInput = z.infer<typeof updateDipLoanSchema>

export const lenderDipResponseSchema = z.object({
  approve: z.nativeEnum(QueryBoolean),
  dip_id: z.string().nonempty(),
})

export type LenderDipResponse = z.infer<typeof lenderDipResponseSchema>

export const userDipResponseSchema = z.object({
  approve: z.nativeEnum(QueryBoolean),
  dip_id: z.string().nonempty(),
})

export type UserDipResponse = z.infer<typeof userDipResponseSchema>

export const initiateMortgagePaymentSchema = z.object({
  payment_for: z.nativeEnum(MortgagePaymentType),
  amount: z.coerce.number(),
  product_code: z.string().nonempty(),
  payment_method: z.nativeEnum(PaymentEnum).default(PaymentEnum.PAYSTACK),
})

export type InitiateMortgagePayment = z.infer<
  typeof initiateMortgagePaymentSchema
>

export const applicationDocFilterSchema = z.object({
  group: z
    .enum([
      DocumentGroupKind.MortgageUpload,
      DocumentGroupKind.ConditionPrecedent,
    ])
    .optional(),

  pending: z.nativeEnum(QueryBoolean).optional(),
})

export type ApplicationDocFilters = z.infer<typeof applicationDocFilterSchema>

export const applicationDocUploadsSchema = z.object({
  group: z.enum([
    DocumentGroupKind.MortgageUpload,
    DocumentGroupKind.ConditionPrecedent,
  ]),
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        document_group_type_id: z.string().nonempty(),
        file_url: z.string().url(),
        file_name: z.string(),
        file_size: z.number().optional(),
        file_ext: z.string().optional(),
      }),
    )
    .nonempty(),
})

export type ApplicationDocUploadsInput = z.infer<
  typeof applicationDocUploadsSchema
>

export const applicationFilterSchema = withPaginateSchema(
  z.object({
    search: z.string().optional(),
    property_type: z.string().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    user_id: z.string().optional(),
    financing_type: z.string().optional(),
    organization_id: z.string().optional(),
    offer_letter_id: z.string().optional(),
    lender_id: z.string().optional(),
  }),
)

export type ApplicationFilters = z.infer<typeof applicationFilterSchema>

export const applicationDocApprovalSchema = z.object({
  approval_id: z.string().nonempty(),
  application_doc_id: z.string().nonempty(),
  approval: z.nativeEnum(ReviewRequestApprovalStatus),
})

export type ApplicationDocApprovalInput = z.infer<
  typeof applicationDocApprovalSchema
>

export const completeApplicationDocReviewSchema = z.object({
  group: z.nativeEnum(DocumentGroupKind),
})

export type CompleteApplicationDocReviewInput = z.infer<
  typeof completeApplicationDocReviewSchema
>

export const homeBuyerLoanOfferRespondSchema = z.object({
  accepts: z.boolean(),
  loan_offer_id: z.string().nonempty(),
})

export type HomeBuyserLoanOfferRespondInput = z.infer<
  typeof homeBuyerLoanOfferRespondSchema
>

export const submitSignedLoanOfferLetterSchema = z.object({
  signed_loan_offer_letter_url: z.string().url(),
  loan_offer_id: z.string().nonempty(),
})

export type SubmitSignedLoanOfferLetterInput = z.infer<
  typeof submitSignedLoanOfferLetterSchema
>
