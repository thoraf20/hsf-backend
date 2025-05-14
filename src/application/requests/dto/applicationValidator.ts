import {
  ApplicationPurchaseType,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
import { z } from 'zod'

export const createApplicationSchema = z
  .object({
    property_id: z.string().nonempty(),
    purchase_type: z.nativeEnum(ApplicationPurchaseType),

    payment_calculator: z
      .object({
        house_price: z.coerce.number().positive(),
        interest_rate: z.coerce.number().positive(),
        terms: z.string(),
        type: z.string(),
        repayment_type: z.string(),
        est_money_payment: z.coerce.number().positive(),
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
  attendees: z.array(z.string()),
})

export type ScheduleEscrowMeetingInput = z.infer<
  typeof scheduleEscrowMeetingSchema
>

export const scheduleEscrowMeetingRespondSchema = z.object({
  confirm_attendance: z.boolean(),
  reason: z.string().nonempty().optional(),
})

export type ScheduleEscrowMeetingRespondInput = z.infer<
  typeof scheduleEscrowMeetingRespondSchema
>
