import { Developer, DevelopeReg } from '@entities/Developer'
import db from '@infrastructure/database/knex'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'


export  class DeveloperRespository implements IDeveloperRepository {
    private readonly tableName = 'developer_profile'
    
    async createDeveloperProfile(data: Developer): Promise<DevelopeReg> {
        const [developer] = await db(this.tableName).insert(data).returning('*')
        return new Developer(developer) ? developer : null
    }
    async getCompanyName(company_name: string): Promise<Developer> {
        const [developer] = await db(this.tableName).where({ company_name }).select('*')
        return new Developer(developer) ? developer : null
    }
    async getCompanyRegistrationNumber(company_registration_number: string): Promise<Developer> {
        const [developer] = await db(this.tableName).where({ company_registration_number }).select('*')
        return new Developer(developer) ? developer : null
    }

    async getCompanyEmail(company_email: string): Promise<Developer> {
        const [developer] = await db(this.tableName).where({ company_email }).select('*')
        return new Developer(developer) ? developer : null
    }
}
