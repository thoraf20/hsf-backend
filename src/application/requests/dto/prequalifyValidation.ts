import { preQualifyStatus } from '@domain/enums/prequalifyEnum'
import { Gender, MartialStatus } from '@domain/enums/userEum'
import { QueryBoolean } from '@shared/utils/helpers'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const preQualifiyRequestSchema = z.object({
  first_name: z.string({
    message: 'First name is required for eligibility check',
  }),
  last_name: z.string({
    message: 'Last name is required for eligibility check',
  }),
  email: z
    .string({ message: 'Email is required for eligibility check' })
    .email(),
  phone_number: z
    .string({
      message: 'Phone number is required for eligibility check',
    })
    .min(10, 'Phone number must be at least 10 digits'),
  gender: z.nativeEnum(Gender, {
    message: 'Gender is required for eligibility check',
  }),
  marital_status: z.nativeEnum(MartialStatus, {
    message: 'Marital status is required for eligibility check',
  }),

  house_number: z.string({
    message: 'House number is required for eligibility check',
  }),

  street_address: z.string({
    message: 'Street address is required for eligibility check',
  }),
  state: z.string({ message: 'State is required for eligibility check' }),
  city: z.string({ message: 'City is required for eligibility check' }),
  employment_confirmation: z.nativeEnum(QueryBoolean, {
    message: 'Employment confirmation is required for eligibility check',
  }),
  employment_position: z.string({
    message: 'Employment position is required for eligibility check',
  }),
  years_to_retirement: z.coerce
    .number({
      message: 'Years to retirement is required for eligibility check',
    })
    .int()
    .positive(),
  employer_address: z.string({
    message: 'Employer address is required for eligibility check',
  }),
  employer_state: z.string({
    message: 'Employer state is required for eligibility check',
  }),
  net_income: z.coerce
    .number({ message: 'Net income is required for eligibility check' })
    .positive(),
  industry_type: z.string(),
  employment_type: z.string(),
  existing_loan_obligation: z.nativeEnum(QueryBoolean),
  eligibility: z
    .object({
      property_id: z.string({
        message: 'Property ID is required for eligibility check',
      }),
      lender_id: z.string({
        message: 'Lender ID is required for eligibility check',
      }),
      rsa: z.string({ message: 'RSA is required for eligibility check' }),
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
