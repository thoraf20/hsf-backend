import { Role } from '../../domain/enums/rolesEmun';
import { z } from 'zod';


export const AgentsSchema = z.object({
  first_name: z.string().min(2, "Firstname must have at least 2 characters"),
  last_name: z.string().min(2, "Lastname must have at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone_number: z.string().min(10, "Phone number must have at least 10 digits"),
  image: z.string().url("Invalid image URL").optional(),
  role: z.string(z.nativeEnum(Role))
});