import { propertyApprovalStatus } from '@domain/enums/propertyEnum'
import { Role } from '@domain/enums/rolesEmun'
import { z } from 'zod'

const isFutureDate = (dateString: string) => {
  const inputDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate >= today
}

export const AgentsSchema = z.object({
  first_name: z.string().min(2, 'Firstname must have at least 2 characters').nonempty(),
  last_name: z.string().min(2, 'Lastname must have at least 2 characters').nonempty(),
  email: z.string().email('Invalid email format').nonempty(),
  phone_number: z.string().min(10, 'Phone number must have at least 10 digits').nonempty(),
  image: z.string().url('Invalid image URL').optional(),
  role: z.string(z.nativeEnum(Role)).nonempty(),
}) 

export const SetEscrowMeetingSchema = z.object({
        date: z
           .string()
           .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
           .refine(isFutureDate, {
             message: 'Inspection date must be in the future.',
           }),
     
          time: z
           .string()
           .regex(
             /^\d{2}:\d{2}(:\d{2})?$/,
             'Time must be in HH:MM or HH:MM:SS format',
           ),
           location: z.string().nonempty(),
           attendees: z.string().nonempty(),
           property_name: z.string().nonempty(),
           property_types: z.string().nonempty(),
           property_id: z.string().nonempty(),
           property_buyer_id: z.string().nonempty()  
})
export const confirmPropertyPurchase = z.object({
  property_id: z.string().nonempty(),
  user_id: z.string().nonempty()  
})


export const approvePrequalifyRequestSchema = z.object({
  status : z.nativeEnum(propertyApprovalStatus),
  user_id: z.string().nonempty()
})

export const changeOfferLetterStatusSchema = z.object({
  offer_letter_status : z.nativeEnum(propertyApprovalStatus),
  offer_letter_id: z.string().nonempty(),
  offer_letter_doc: z.string().nonempty()
})