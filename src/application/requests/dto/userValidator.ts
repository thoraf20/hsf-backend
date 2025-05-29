import { MfaFlow } from '@domain/enums/userEum'
import { QueryBoolean } from '@shared/utils/helpers'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const UserSchema = z.object({
  tempId: z.string(),
  first_name: z.string().min(2, 'Firstname must have at least 2 characters'),
  last_name: z.string().min(2, 'Lastname must have at least 2 characters'),
  phone_number: z.string().min(10, 'Phone number must have at least 10 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
  role: z.number().optional(), // Default role as 'home_buyer'
  profile: z.string().optional(),
  image: z.string().url('Invalid image URL').optional(),
  userAgent: z.string().optional(),

})

export const RegisterEmail = z.object({
  email: z.string().email('Invalid email format'),
})

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})
export const verifyTokenSchema = z.object({
  token: z.string().nonempty(),
})

export const resendOtpOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const RequestPasswordResetOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const ResetPasswordOtpSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
  tempId: z.string().nonempty(),
})

export const loginSchema = z.object({
  identifier: z.string().nonempty(),
  password: z.string().nonempty(),
})

export const verifyInitMfaSetupSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const verifyLoginMfaSchema = z.object({
  code: z.string().nonempty(),
  flow: z.nativeEnum(MfaFlow),
  token: z.string().nonempty(),
})

export const changePasswordCompleteSchema = z.object({
  token: z.string().nonempty(),
})

export type ChangePasswordCompleteInput = z.infer<
  typeof changePasswordCompleteSchema
>

export type VerifyLoginMfaInput = z.infer<typeof verifyLoginMfaSchema>

export const sendMfaOtpSchema = z.object({
  token: z.string().nonempty(),
})

export type SendMfaOtpInput = z.infer<typeof sendMfaOtpSchema>

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
})

export const updateProfileSchema = z
  .object({
    first_name: z.string().min(2, 'Firstname must have at least 2 characters'),
    last_name: z.string().min(2, 'Lastname must have at least 2 characters'),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.coerce.date().nullable(),
    image: z.string().url('Invalid image URL'),
  })
  .partial()

export const updateProfileImageSchema = z.object({
  image: z.string().nonempty().url().nullable(),
})

export type UpdateProfileImageInput = z.infer<typeof updateProfileImageSchema>

export const changeUserPasswordSchema = z
  .object({
    current_password: z.string().min(8).max(100),
    new_password: z.string().min(8).max(100),
    confirm_password: z.string().min(8).max(100),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ChangePasswordInput = z.infer<typeof changeUserPasswordSchema>

export const getUserFiltersSchema = withPaginateSchema(
  z.object({
    deleted: z.nativeEnum(QueryBoolean).default(QueryBoolean.NO),
  }),
)

export const getUserByIdSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
})
export type UserFilters = z.infer<typeof getUserFiltersSchema>
export type UserFilter = z.infer<typeof getUserByIdSchema>
