import {
  ApplicationPurchaseType,
  ApplicationStatus,
  DocumentTypeEnum,
  propertyApprovalStatus,
  PropertyFeatureEnum,
} from '@domain/enums/propertyEnum'
import {
  propertyStatusFilter,
  SearchType,
  SortDateBy,
} from '@shared/types/repoTypes'
import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

// Define the schema for a single document object
const DocumentSchema = z.object({
  type: z.nativeEnum(DocumentTypeEnum),
  document_img_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .or(z.string().url('Invalid document URL')),
})

// Property Address Validation
export const createPropertySchema = z
  .object({
    street_address: z
      .string()
      .min(3, 'Street address must be at least 3 characters long'),
    city: z.string().min(2, 'City name is too short'),
    unit_number: z.string().default('1'),
    state: z.string(),
    postal_code: z.string().min(4, 'Postal code must be valid').optional(),
    landmark: z.string().optional().default(''),
    property_name: z
      .string()
      .min(3, 'Property name must be at least 3 characters long'),
    property_type: z
      .string()
      .min(3, 'Property type must be at least 3 characters long'),
    property_size: z.string().min(1, 'Property size is required'),
    property_price: z.coerce.number(),
    // down_payment: z.coerce.number().optional().nullable(),
    property_description: z.string().optional(),
    numbers_of_bedroom: z
      .number()
      .int()
      .min(0, 'Bedrooms must be a positive number'),
    numbers_of_bathroom: z
      .number()
      .int()
      .min(0, 'Bathrooms must be a positive number'),
    property_condition: z
      .string()
      .min(3, 'Condition must be at least 3 characters long'),
    financial_types: z.array(z.nativeEnum(ApplicationPurchaseType)),
    property_feature: z.array(z.nativeEnum(PropertyFeatureEnum)),
    property_images: z.array(z.string().url('Invalid image URL')),
    documents: z
      .array(
        z.object({
          id: z.string().nonempty(),
          file_url: z.string().url(),
          file_name: z.string(),
          file_size: z.number().optional(),
          file_ext: z.string().optional(),
        }),
      )
      .nonempty(),
    payment_duration: z.string().optional(),
  })
  .strip()

export type CreatePropertyInput = z.infer<typeof createPropertySchema> & {
  listed_by_id: string
}

export const UpdateSchema = z.object({
  street_address: z
    .string()
    .min(3, 'Street address must be at least 3 characters long')
    .optional(),

  city: z.string().min(2, 'City name is too short').optional(),
  unit_number: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().min(4, 'Postal code must be valid').optional(),
  landmark: z.string().optional(),
  property_name: z
    .string()
    .min(3, 'Property name must be at least 3 characters long')
    .optional(),
  property_type: z
    .string()
    .min(3, 'Property type must be at least 3 characters long')
    .optional(),
  property_size: z.string().min(1, 'Property size is required').optional(),
  property_price: z
    .string()
    .regex(/^\d+$/, 'Property price must be a valid number')
    .optional(),
  property_description: z.string().optional().optional(),
  numbers_of_bedroom: z
    .number()
    .int()
    .min(0, 'Bedrooms must be a positive number')
    .optional(),
  numbers_of_bathroom: z
    .number()
    .int()
    .min(0, 'Bathrooms must be a positive number')
    .optional(),
  property_condition: z
    .string()
    .min(3, 'Condition must be at least 3 characters long')
    .optional(),
  financial_types: z.array(z.nativeEnum(ApplicationPurchaseType)).optional(),
  property_feature: z.array(z.nativeEnum(PropertyFeatureEnum)).optional(),
  property_images: z.array(z.string().url('Invalid image URL')).optional(),
  documents: z.array(DocumentSchema).optional(), // ✅ Updated: documents should be an array of objects
  payment_duration: z.string().optional(),
})

export const UpdatePropertyStatus = z.object({
  status: z.nativeEnum(propertyApprovalStatus),
})

export const sharePropertySchema = z.object({
  message: z.string().optional(),
  property_id: z.string().nonempty(),
  sender_email: z.string().email('Invalid email format'),
  recipient_email: z.string().email('Invalid email format'),
})

export const viewPropertySchema = z.object({
  property_id: z.string().nonempty(),
})
export const approvePropertyClosingSchema = z.object({
  property_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
})

export const propertyFiltersSchema = withPaginateSchema(
  z.object({
    search_type: z.nativeEnum(SearchType).optional(),
    sort_by: z.nativeEnum(SortDateBy).optional(),
    search: z.string().optional(),
    location: z.string().optional(),
    property_type: z.string().optional(),
    bedrooms: z.coerce.number().int().positive().optional(),
    bathrooms: z.coerce.number().int().positive().optional(),
    user_id: z.string().optional(),
    min_price: z.coerce.number().positive().optional(),
    max_price: z.coerce.number().positive().optional(),
    financing_type: z.string().optional(),
    property_status: z.nativeEnum(propertyStatusFilter).optional(),
    property_features: z.string().optional(),
    organization_id: z.string().optional(),
  }),
)

export type PropertyFilters = z.infer<typeof propertyFiltersSchema> & {
  offer_letter_id?: string
} & { status?: ApplicationStatus }
