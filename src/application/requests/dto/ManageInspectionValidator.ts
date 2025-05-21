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
  day_availability_id: z.string().uuid(),
});

export const reschedule = z.object({
  day_availability_slot_id: z.string().uuid(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
});
export const DayAvailabilitySchema = z.object({
  time_slot: z.string(),
});

export const SchduleTimeSchema = DayAvailabilitySchema.merge(DayAvailabilitySlotSchema);
export type DayAvailabilitySlot = z.infer<typeof DayAvailabilitySlotSchema>;