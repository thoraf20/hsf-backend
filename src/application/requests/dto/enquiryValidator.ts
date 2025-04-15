import { z } from 'zod'

export const enquirySchema = z.object({
  property_id: z.string().nonempty(),
  full_name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  message: z.string().nonempty(),
})

export const continueEnquirySchema = z.object({
  enquiry_id: z.string().nonempty(),
  message: z.string().nonempty(),
})
