import { z } from 'zod';

export const enquirySchema = z.object({
    property_id: z.string().nonempty(),
    message: z.string().nonempty()
})

export const continueEnquirySchema = z.object({
    enquiry_id: z.string().nonempty(),
    message: z.string().nonempty()
})