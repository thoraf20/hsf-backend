import { Developer, DevelopeReg } from "@entities/Developer";

export interface IDeveloperRepository { 
     createDeveloperProfile: (data: Developer) => Promise<DevelopeReg>;
     getCompanyName: (company_name: string) => Promise<Developer>;
     getCompanyRegistrationNumber: (company_registration_number: string) => Promise<Developer>;
     getCompanyEmail: (company_email: string) => Promise<Developer>;
}