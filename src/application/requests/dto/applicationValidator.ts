import {
  ApplicationPurchaseType,
  DIPStatus,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
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
    organization_id: z.string().nonempty().optional(),
  }),
)

export type DipFilters = z.infer<typeof dipFiltersSchema>
