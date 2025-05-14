import { AddressType } from '@domain/enums/userEum'
import { z } from 'zod'

export const createAddressSchema = z.object({
  street_address: z.string().nonempty().max(500),
  city: z.string().nonempty().max(100),
  state: z.string().nonempty().max(100),
  country: z.string().nonempty().max(100),
  postal_code: z.string().nonempty().optional(),
  address_type: z.nativeEnum(AddressType).optional(),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>

export const updateAddressSchema = createAddressSchema
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
