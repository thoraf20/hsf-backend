import { z } from 'zod';

export const enquirySchema = z.object({
    property_id: z.string(),
    message: z.string()
})

export const continueEnquirySchema = z.object({
    enquiry_id: z.string(),
    message: z.string()
})