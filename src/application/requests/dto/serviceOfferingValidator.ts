import { ServiceOfferingComputeType } from '@domain/enums/serviceOfferingEnum'
import { z } from 'zod'

export const createServiceOfferingSchema = z
  .object({
    service_name: z.string().min(2).max(100),
    description: z.string().min(2).max(500),
    compute_type: z.nativeEnum(ServiceOfferingComputeType).nullable(),
    percentage: z.coerce.number().optional().nullable(),
    base_price: z.number().min(0),
    image_url: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
    currency: z.string().min(2).max(3),
  })
  .refine(
    ({ compute_type, percentage }) =>
      compute_type !== ServiceOfferingComputeType.Percent ||
      typeof percentage === 'number',
    {
      path: ['percentage'],
      message:
        'Percentage not provide for compute type of ' +
        ServiceOfferingComputeType.Percent,
    },
  )
  .refine(
    ({ compute_type, base_price }) =>
      compute_type !== ServiceOfferingComputeType.Fixed ||
      (typeof base_price === 'number' && base_price > 0),
    {
      path: ['base_price'],
      message:
        'Base price is required and must be greater than 0 for Fixed compute type',
    },
  )

export type CreateServiceOfferingInput = z.infer<
  typeof createServiceOfferingSchema
>

export const updateServiceOfferingSchema = createServiceOfferingSchema

export type UpdateServiceOfferingInput = z.infer<
  typeof updateServiceOfferingSchema
>
