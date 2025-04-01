import { z } from "zod";

export const UserApplicationSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone_number: z.string().min(10).max(15), // Adjust min/max based on expected format
  gender: z.enum(["Male", "Female", "Other"]),
  marital_status: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  house_number: z.string(),
  street_address: z.string(),
  state: z.string(),
  city: z.string(),
  employment_confirmation: z.enum(["Yes", "No"]),
  employment_position: z.string(),
  employer_address: z.string(),
  employer_state: z.string(),
  years_to_retirement: z.number().int().positive(),
  net_income: z.number().positive(),
  industry_type: z.string(),
  employment_type: z.enum(["Full-time", "Part-time", "Contract", "Freelance"]),
  existing_loan_obligation: z.enum(["Yes", "No"]),
  rsa: z.string(),
  preferred_developer: z.string(),
  property_name: z.string(),
  preferred_lender: z.string(),
  property_id: z.string().uuid(),
});


