import { z } from 'zod';


export const UserSchema = z.object({
  first_name: z.string().min(2, "Firstname must have at least 2 characters"),
  last_name: z.string().min(2, "Lastname must have at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone_number: z.string().min(10, "Phone number must have at least 10 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  role: z.number().optional(), // Default role as 'home_buyer'
  profile: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
  userAgent: z.string().optional(),
  failedLoginAttempts: z.number().int().min(0).default(0),
  isEmailVerified: z.boolean().default(false),
  isPhoneVerified: z.boolean().default(false),
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

export const resendOtpOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const RequestPasswordResetOtpSchema = z.object({ 
  email: z.string().email("Invalid email format"),
})

export const ResetPasswordOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
     otp: z.string().length(6, "OTP must be 6 digits")
});


export const loginSchema = z.object({ 
  identifier: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

export const verifyMfaSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(8, "Password must be at least 8 characters long"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(2, "Firstname must have at least 2 characters").optional(),
  last_name: z.string().min(2, "Lastname must have at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone_number: z.string().min(10, "Phone number must have at least 10 digits").optional(),
  profile: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),

});