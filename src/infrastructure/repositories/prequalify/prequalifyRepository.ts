import { employmentInformation, financialInformation, personalinformation, preQualify, prequalifyStatus, propertyInformation } from "@entities/prequalify/prequalify";
import db from "@infrastructure/database/knex";
import { IPreQualify } from "@interfaces/IpreQualifyRepoitory";

export class PrequalifyRepository implements IPreQualify {
      public  async storePropertyInfo(input: propertyInformation): Promise<propertyInformation> {
        const [property] = await db('prequalify_property_information').insert(input).returning("*")
        return new propertyInformation(property) ? property : null
          
      }

      public async storePersonaInfo(input: personalinformation): Promise<personalinformation> {
          const [personalInformation] = await db('prequalify_personal_information').insert(input).returning("*")
          return new personalinformation(personalInformation) ? personalInformation :  null
      }

      public async storeEmploymentInfo(input: employmentInformation): Promise<employmentInformation> {
          const [employment] = await db('prequalify_employment_information').insert(input).returning('*')
          return new employmentInformation(employment) ? employment : null
      }

      public async storeFinancialInfo(input: financialInformation): Promise<financialInformation> {
          const [financial] = await db('prequalify_financial_information').insert(input).returning('*')
          return new financialInformation(financial) ? financial : null
      }

      public async  storePreQualifyStatus(input: prequalifyStatus): Promise<prequalifyStatus> {
         const [status] = await db('prequalify_status').insert(input).returning('*')
         return new prequalifyStatus(status) ? status : null
          
      }

      public async findIfApplyForLoanAlready(loaner_id: string): Promise<any> {
        return await db('prequalify_status').where('loaner_id', loaner_id).whereIn('status', ["Pending", "Declined"]).first()
      }

      public async updatePrequalifyStatus(loaner_id: string, input: Partial<preQualify>): Promise<void> {
             await db('prequalify_status').update(input).where('loaner_id', loaner_id)
      }
}
