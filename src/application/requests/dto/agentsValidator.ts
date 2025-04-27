import { propertyApprovalStatus } from '@domain/enums/propertyEnum'
import { adminRole, subAdminRole } from '@domain/enums/rolesEmun'
import { z } from 'zod'

const isFutureDate = (dateString: string) => {
  const inputDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate >= today
}



export const AdminSchema = z.object({
  first_name: z.string().min(2, 'Firstname must have at least 2 characters').nonempty(),
  last_name: z.string().min(2, 'Lastname must have at least 2 characters').nonempty(),
  email: z.string().email('Invalid email format').nonempty(),
  phone_number: z
    .string()
    .min(10, 'Phone number must have at least 10 digits')
    .nonempty(),
  image: z.string().url('Invalid image URL').optional(),
  role: z.nativeEnum(adminRole),
  street_address: z.string().nonempty(),
  city: z.string().nonempty(),
  state: z.string().nonempty(),
  landmark: z.string().optional(),
  country: z.string().nonempty(),

});

export const SubAdminSchema = z.object({
  first_name: z.string().min(2, 'Firstname must have at least 2 characters').nonempty(),
  last_name: z.string().min(2, 'Lastname must have at least 2 characters').nonempty(),
  email: z.string().email('Invalid email format').nonempty(),
  phone_number: z.string().min(10, 'Phone number must have at least 10 digits').nonempty(),
  image: z.string().url('Invalid image URL').optional(),
  role: z.nativeEnum(subAdminRole),
  street_address: z.string().nonempty(),
  city: z.string().nonempty(),
  state: z.string().nonempty(),
  landmark: z.string().optional(),
  country: z.string().nonempty(),

});


export const  AgentPasswordChangeSchema = z.object({ 
  oldPassword: z.string().min(6, 'Password must be at least 6 characters long').nonempty(),
  newPassword: z.string().min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character").nonempty(),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters long').nonempty(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
})
export const acceptInviteSchema = z.object({
  invite_code: z.string().nonempty(),
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
  property_buyer_id: z.string().nonempty(),
})
export const confirmPropertyPurchase = z.object({
  property_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
})

export const approvePrequalifyRequestSchema = z.object({
  is_approved: z.boolean(),
  user_id: z.string().nonempty(),
})

export type ApprovePrequalifyRequestInput = z.infer<
  typeof approvePrequalifyRequestSchema
>

export const changeOfferLetterStatusSchema = z.object({
  offer_letter_status: z.nativeEnum(propertyApprovalStatus),
  offer_letter_id: z.string().nonempty(),
  offer_letter_doc: z.string().nonempty(),
})
