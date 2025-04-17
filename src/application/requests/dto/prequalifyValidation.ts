import { z } from 'zod'

export const preQualifySchema = z.object({
  property_id: z.string().optional(),
  est_money_payment: z.string().optional(),
  house_price: z.string().optional(),
  interest_rate: z.string().optional(),
  terms: z.string().optional(),
  repayment_type: z.string().optional(),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone_number: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  marital_status: z.string().min(1, 'Marital status is required').optional(),
  house_number: z.string().optional(),
  street_address: z.string().min(1, 'Street address is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  employment_confirmation: z.enum(['Yes', 'No']).optional(),
  employment_position: z
    .string()
    .min(1, 'Employment position is required')
    .optional(),
  employer_address: z
    .string()
    .min(1, 'Employer address is required')
    .optional(),
  employer_state: z.string().min(1, 'Employer state is required').optional(),
  years_to_retirement: z
    .number()
    .min(0, 'Years to retirement must be non-negative')
    .optional(),
  net_income: z.number().min(0, 'Net income must be non-negative').optional(),
  industry_type: z.string().min(1, 'Industry type is required').optional(),
  employment_type: z.string().min(1, 'Employment type is required').optional(),
  existing_loan_obligation: z.enum(['Yes', 'No']).optional(),
  rsa: z.string().min(1, 'RSA is required').optional(),
  preferred_developer: z.string().optional(),
  property_name: z.string().min(1, 'Property name is required').optional(),
  preferred_lender: z.string().optional(),
})
