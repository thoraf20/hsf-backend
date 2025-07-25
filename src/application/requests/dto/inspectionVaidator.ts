import { z } from 'zod'
import {
  MeetingPlatform,
  InspectionMeetingType,
  InspectionStatus,
} from '@domain/enums/propertyEnum'
import { InspectionRescheduleRequestStatusEnum } from '@domain/enums/inspectionEnum'
import { withPaginateSchema } from '@shared/utils/paginate'
// import { DateTime } from 'luxon';

// const toUTC = (date: string, time: string, timezone: string) => {
//     const localDateTime = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: timezone });
//     return localDateTime.toUTC().toISO(); // Convert to UTC ISO format
//   };
// Helper function to check if a date is in the future
const isFutureDate = (dateString: string) => {
  const inputDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate >= today
}

export const inspectionSchema = z.object({
  payment_type: z.string().optional(),
  inspection_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(isFutureDate, {
      message: 'Inspection date must be in the future.',
    }),

  inspection_time: z
    .string()
    .regex(
      /^\d{2}:\d{2}(:\d{2})?$/,
      'Time must be in HH:MM or HH:MM:SS format',
    ),

  full_name: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters long.' })
    .max(100, { message: 'Full name must not exceed 100 characters.' })
    .trim()
    .nonempty(),

  email: z
    .string()
    .email({ message: 'Invalid email format.' })
    .nonempty()
    .max(100, { message: 'Email must not exceed 100 characters.' })
    .transform((email) => email.toLowerCase().trim()),

  contact_number: z
    .string()
    .regex(
      /^\+?\d{7,15}$/,
      'Phone number must be between 7-15 digits and may start with "+".',
    )
    .nonempty(),

  meeting_platform: z
    .nativeEnum(MeetingPlatform, {
      errorMap: () => ({
        message:
          'Invalid meeting platform. Choose from WhatsApp, Google Meet, Zoom, Teams, or FaceTime.',
      }),
    })
    .nullable()
    .optional(),

  inspection_meeting_type: z
    .nativeEnum(InspectionMeetingType, {
      errorMap: () => ({
        message: 'Invalid meeting type. Choose In Person or Video Chat.',
      }),
    })
    .optional(),

  product_code: z.string().nonempty().optional(),

  amount: z.coerce.number().positive().optional(),

  property_id: z.string(),

  availability_slot_id: z.string().nonempty(),
})

export const reponseToReschedule = z.object({
  status: z.enum([
    InspectionRescheduleRequestStatusEnum.AcceptedByUser,
    InspectionRescheduleRequestStatusEnum.RejectedByUser,
  ]),
  user_rejection_reason: z.string().optional(),
})
export type ScheduleInspectionInput = z.infer<typeof inspectionSchema>

export const updateInspectionStatusSchema = z.object({
  status: z.enum([InspectionStatus.COMPLETED, InspectionStatus.CANCELED]),
})

export type UpdateInspectionStatusPayload = z.infer<
  typeof updateInspectionStatusSchema
>

export const inspectionFiltersSchema = withPaginateSchema(
  z.object({
    user_id: z.string().nonempty().optional(),
    organization_id: z.string().nonempty().optional(),
    status: z.nativeEnum(InspectionStatus).optional(),
  }),
)

export type InspectionFilters = z.infer<typeof inspectionFiltersSchema>
