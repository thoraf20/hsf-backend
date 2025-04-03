import { z } from 'zod'
import {
  MeetingPlatform,
  InspectionMeetingType,
  FinancialOptionsEnum,
} from '@domain/enums/propertyEnum'
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

export const inspectionSchema = z
  .object({
    purchase_plan_type: z.nativeEnum(FinancialOptionsEnum, {
      errorMap: () => ({
        message:
          'Invalid purchase plan type. Choose from Mortgage, Outright Purchase, or Installment.',
      }),
    }),

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
      .trim().nonempty(),

    email: z
      .string()
      .email({ message: 'Invalid email format.' }).nonempty()
      .max(100, { message: 'Email must not exceed 100 characters.' })
      .transform((email) => email.toLowerCase().trim()),

    contact_number: z
      .string()
      .regex(
        /^\+?\d{7,15}$/,
        'Phone number must be between 7-15 digits and may start with "+".',
      ).nonempty(),

    meeting_platform: z
      .nativeEnum(MeetingPlatform, {
        errorMap: () => ({
          message:
            'Invalid meeting platform. Choose from WhatsApp, Google Meet, Zoom, Teams, or FaceTime.',
        }),
      })
      .optional(),

    inspection_meeting_type: z
      .nativeEnum(InspectionMeetingType, {
        errorMap: () => ({
          message: 'Invalid meeting type. Choose In Person or Video Chat.',
        }),
      })
      .optional(),

    inspection_fee_paid: z.boolean().default(false),
    amount: z
      .string()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Amount must be a valid number with up to 2 decimal places',
      )
      .refine((value) => parseFloat(value) > 0, {
        message: 'Amount must be a positive number.',
      })
      .optional(),
    meeting_link: z
      .string()
      .url({ message: 'Invalid meeting link format.' })
      .optional(),
    property_id: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.meeting_link) {
      const defaultLinks: Record<string, string> = {
        WhatsApp: 'https://wa.me/your-number',
        'Google Meet': 'https://meet.google.com/new',
        Zoom: 'https://zoom.us/start',
        Teams: 'https://teams.microsoft.com/l/meetup-join',
        FaceTime: 'https://www.apple.com/ios/facetime/',
      }

      data.meeting_link = defaultLinks[data.meeting_platform] || ''
    }
  })
