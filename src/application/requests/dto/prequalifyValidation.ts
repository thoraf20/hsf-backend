import { preQualifyStatus } from '@domain/enums/prequalifyEnum'
import { Gender, MartialStatus } from '@domain/enums/userEum'
import { QueryBoolean } from '@shared/utils/helpers'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const preQualifiyRequestSchema = z.object({
  first_name: z.string({
    message: 'First name is required',
  }),
  last_name: z.string({
    message: 'Last name is required',
  }),
  email: z
    .string({ message: 'Email is required' })
    .email({ message: 'Invalid email format' }),
  phone_number: z
    .string({
      message: 'Phone number is required',
    })
    .min(10, 'Phone number must be at least 10 digits'),
  gender: z.nativeEnum(Gender, {
    message: 'Gender is required',
  }),
  date_of_birth: z
    .string({
      message: 'Date of birth is required',
    })
    .date('Invalid date format'),
  marital_status: z.nativeEnum(MartialStatus, {
    message: 'Marital status is required',
  }),
  house_number: z.string({
    message: 'House number is required',
  }),
  street_address: z.string({
    message: 'Street address is required',
  }),
  state: z.string({ message: 'State is required' }),
  city: z.string({ message: 'City is required' }),
  employment_confirmation: z.nativeEnum(QueryBoolean, {
    message: 'Employment confirmation is required',
  }),
  employment_position: z.string({
    message: 'Employment position is required',
  }),
  years_to_retirement: z.coerce
    .number({
      message: 'Years to retirement is required and must be a number',
    })
    .int({ message: 'Years to retirement must be an integer' })
    .positive({ message: 'Years to retirement must be positive' }),
  employer_name: z.string({
    message: 'Employer name is required',
  }),
  employer_address: z.string({
    message: 'Employer address is required',
  }),
  employer_state: z.string({
    message: 'Employer state is required',
  }),
  net_income: z.coerce
    .number({ message: 'Net income is required and must be a number' })
    .positive({ message: 'Net income must be positive' }),
  industry_type: z.string().optional(),
  employment_type: z.string().optional(),
  existing_loan_obligation: z.nativeEnum(QueryBoolean).optional(),
  eligibility: z
    .object({
      property_id: z.string({
        message: 'Property ID is required',
      }),
      lender_id: z.string({
        message: 'Lender ID is required',
      }),
      rsa: z.string({ message: 'RSA is required' }),
    })
    .optional()
    .nullable(),
})

export type PreQualifyRequestInput = z.infer<typeof preQualifiyRequestSchema>

export const preQualifierEligibleSchema = z.object({
  eligibility_id: z.string(),
  is_eligible: z.boolean(),
})

export type PreQualifierEligibleInput = z.infer<
  typeof preQualifierEligibleSchema
>

export const preQualifierFiltersSchema = withPaginateSchema(
  z.object({
    status: z.nativeEnum(preQualifyStatus).optional(),
  }),
)

export type PreQualifyFilters = z.infer<typeof preQualifierFiltersSchema>

export const preQualifierStatusQuerySchema = z.object({
  property_id: z.string().optional(),
})

export type PreQualifierStatusQuery = z.infer<
  typeof preQualifierStatusQuerySchema
>
