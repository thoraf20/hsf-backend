import { PreQualifierEnum } from "@domain/enums/propertyEnum";
import { z } from "zod";

export const preQualifySchema = z
  .object({
    type:z.nativeEnum(PreQualifierEnum),
    est_money_payment: z.string().optional(),
    house_price: z.string().optional(),
    interest_rate: z.string().optional(),
    terms: z.string().optional(),
    repayment_type: z.string().optional(),
    first_name: z.string().min(1, "First name is required").nonempty(),
    last_name: z.string().min(1, "Last name is required").nonempty(),
    email: z.string().email("Invalid email address").nonempty(),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits").nonempty(),
    gender: z.enum(["Male", "Female", "Other"]),
    marital_status: z.string().min(1, "Marital status is required").nonempty(),
    house_number: z.string().optional(),
    street_address: z.string().min(1, "Street address is required").nonempty(),
    state: z.string().min(1, "State is required").nonempty(),
    city: z.string().min(1, "City is required").nonempty(),
    employment_confirmation: z.enum(["Yes", "No"]),
    employment_position: z.string().min(1, "Employment position is required").nonempty(),
    employer_address: z.string().min(1, "Employer address is required").nonempty(),
    employer_state: z.string().min(1, "Employer state is required").nonempty(),
    years_to_retirement: z.number().min(0, "Years to retirement must be non-negative"),
    net_income: z.number().min(0, "Net income must be non-negative"),
    industry_type: z.string().min(1, "Industry type is required"),
    employment_type: z.string().min(1, "Employment type is required"),
    existing_loan_obligation: z.enum(["Yes", "No"]),
    rsa: z.string().min(1, "RSA is required"),
    preferred_developer: z.string().optional(),
    property_name: z.string().min(1, "Property name is required"),
    preferred_lender: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type.includes(PreQualifierEnum.INSTALLMENT)) {
      const requiredFields = [
        "est_money_payment",
        "house_price",
        "interest_rate",
        "terms", 
        "repayment_type",
      ];

      requiredFields.forEach((field) => {
        if (!data[field as keyof typeof data]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field.replace(/_/g, " ")} is required when type is Installment`,
          });
        }
      });
    }
  });
