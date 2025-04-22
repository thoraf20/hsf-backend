import { User } from "./User"


export class Developer extends User{ 
    profile_id?: string
    company_name: string
    company_registration_number: string
    office_address: string
    company_email: string
    state: string
    city: string
    developer_role: string
    years_in_business: string
    specialization: string
    region_of_operation: string
    company_image: string
    documents: any[]
    created_at?: Date
    updated_at?: Date
    developers_profile_id?: string
    constructor(data: Partial<Developer>) {
        super(data); 
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            documents:
            typeof data.documents === 'string'
              ? JSON.stringify(data.documents)
              : Array.isArray(data.documents)
                ? data.documents
                : [],
            ...data
        });
    }
}


export type DevelopeReg =  Partial<Developer> & Partial<User>