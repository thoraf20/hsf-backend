import { z } from 'zod';

export const DayOfWeekEnum = z.enum([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]);

export const DayAvailabilitySlotSchema = z.object({
  day: DayOfWeekEnum,
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  is_available: z.boolean(),
  day_availability_id: z.string().uuid(),
});

export const DayAvailabilitySchema = z.object({
  time_slot: z.string(),
});

export const SchduleTimeSchema = DayAvailabilitySchema.merge(DayAvailabilitySlotSchema);
export type DayAvailabilitySlot = z.infer<typeof DayAvailabilitySlotSchema>;