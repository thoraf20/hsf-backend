import { z } from 'zod'

export const createServiceOfferingSchema = z.object({
  service_name: z.string().min(2).max(100),
  description: z.string().min(2).max(500),
  base_price: z.number().min(0),
  image_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  currency: z.string().min(2).max(3),
})

export type CreateServiceOfferingInput = z.infer<
  typeof createServiceOfferingSchema
>

export const updateServiceOfferingSchema = createServiceOfferingSchema

export type UpdateServiceOfferingInput = z.infer<
  typeof updateServiceOfferingSchema
>
