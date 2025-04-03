
import { z } from 'zod';

export const purchasePropertySchema = z.object({
    property_id: z.string().nonempty()
})

