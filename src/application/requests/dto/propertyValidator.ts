import {
  DocumentTypeEnum,
  FinancialOptionsEnum,
  PropertyFeatureEnum,
} from '../../../domain/enums/propertyEnum'
import { z } from 'zod'

// Define the schema for a single document object
const DocumentSchema = z.object({
  type: z.nativeEnum(DocumentTypeEnum),
  document_img_url: z
    .string()
    .optional()
    .or(z.literal("")) 
    .or(z.string().url('Invalid document URL')), 
});

// Property Address Validation
export const PropertySchema = z.object({
  street_address: z
    .string()
    .min(3, 'Street address must be at least 3 characters long'),
  city: z.string().min(2, 'City name is too short'),
  unit_number: z.string(),
  state: z.string(),
  postal_code: z.string().min(4, 'Postal code must be valid'),
  landmark: z.string(),
  property_name: z
    .string()
    .min(3, 'Property name must be at least 3 characters long'),
  property_type: z
    .string()
    .min(3, 'Property type must be at least 3 characters long'),
  property_size: z.string().min(1, 'Property size is required'),
  property_price: z
    .string()
    .regex(/^\d+$/, 'Property price must be a valid number'),
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
  financial_types: z.array(z.nativeEnum(FinancialOptionsEnum)),
  property_feature: z.array(z.nativeEnum(PropertyFeatureEnum)),
  property_images: z.array(z.string().url('Invalid image URL')),
  documents: z.array(DocumentSchema), 
  payment_duration: z.string().optional(),
});



export const UpdateSchema = z.object({
  street_address: z
    .string()
    .min(3, 'Street address must be at least 3 characters long').optional(),

  city: z.string().min(2, 'City name is too short').optional(),
  unit_number: z.string().optional(), 
  state: z.string().optional(),
  postal_code: z.string().min(4, 'Postal code must be valid').optional(),
  landmark: z.string().optional(),
  property_name: z
    .string()
    .min(3, 'Property name must be at least 3 characters long').optional(),
  property_type: z
    .string()
    .min(3, 'Property type must be at least 3 characters long').optional(),
  property_size: z.string().min(1, 'Property size is required').optional(),
  property_price: z
    .string()
    .regex(/^\d+$/, 'Property price must be a valid number').optional(),
  property_description: z.string().optional().optional(),
  numbers_of_bedroom: z
    .number()
    .int()
    .min(0, 'Bedrooms must be a positive number').optional(),
  numbers_of_bathroom: z
    .number()
    .int()
    .min(0, 'Bathrooms must be a positive number').optional(),
  property_condition: z
    .string()
    .min(3, 'Condition must be at least 3 characters long').optional(),
  financial_types: z.array(z.nativeEnum(FinancialOptionsEnum)).optional(),
  property_feature: z.array(z.nativeEnum(PropertyFeatureEnum)).optional(),
  property_images: z.array(z.string().url('Invalid image URL')).optional(),
  documents: z.array(DocumentSchema).optional(), // ✅ Updated: documents should be an array of objects
  payment_duration: z.string().optional(),
});
