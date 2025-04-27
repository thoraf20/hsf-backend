import { Developer, DevelopeReg } from '@entities/Developer'
import db from '@infrastructure/database/knex'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'


export  class DeveloperRespository implements IDeveloperRepository {
    private readonly tableName = 'developers_profile'
    
    async createDeveloperProfile(data: Developer): Promise<DevelopeReg> {
        const [developer] = await db(this.tableName).insert(data).returning('*')
        return new Developer(developer) ? developer : null
    }
    async getCompanyName(company_name: string): Promise<Developer> {
        const developer = await db(this.tableName)
          .where('company_name', company_name)
          .first()
      
        console.log(developer)
        return developer ? new Developer(developer) : null
      }
      
      async getCompanyRegistrationNumber(company_registration_number: string): Promise<Developer> {
        const developer = await db(this.tableName)
          .where('company_registration_number', company_registration_number)
          .first()
      
        return developer ? new Developer(developer) : null
      }
      
      async getCompanyEmail(company_email: string): Promise<Developer> {
        const developer = await db(this.tableName)
          .where('company_email', company_email)
          .first()
      
        return developer ? new Developer(developer) : null
      }
    }      
