import { employmentInformation,  payment_calculator, personalinformation, preQualify, prequalifyStatus } from "@entities/prequalify/prequalify";
import db from "@infrastructure/database/knex";
import { IPreQualify } from "@interfaces/IpreQualifyRepoitory";

export class PrequalifyRepository implements IPreQualify {

      public async storePersonaInfo(input: personalinformation): Promise<personalinformation> {
          const [personalInformation] = await db('prequalify_personal_information').insert(input).returning("*")
          return new personalinformation(personalInformation) ? personalInformation :  null
      }

      public async storeEmploymentInfo(input: employmentInformation): Promise<employmentInformation> {
          const [employment] = await db('prequalify_other_info').insert(input).returning('*')
          return new employmentInformation(employment) ? employment : null
      }

      public async  storePreQualifyStatus(input: prequalifyStatus): Promise<prequalifyStatus> {
         const [status] = await db('prequalify_status').insert(input).returning('*')
         return new prequalifyStatus(status) ? status : null
          
      }
      public async storePaymentCalculator(input: payment_calculator): Promise<payment_calculator> {
             const [paymentCalculator] = await db('prequalify_payment_calculator').insert(input).returning("*")
             return new payment_calculator(paymentCalculator) ? paymentCalculator : null
      }


      public async findIfApplyForLoanAlready(loaner_id: string): Promise<any> {
        return await db('prequalify_status').where('loaner_id', loaner_id).whereIn('status', ["Pending", "Declined"]).first()
      }

      public async updatePrequalifyStatus(loaner_id: string, input: Partial<preQualify>): Promise<void> {
             await db('prequalify_status').update(input).where('loaner_id', loaner_id)
      }

      public async getPreQualifyRequest(): Promise<any[]> {
        const prequalify =  await db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('properties as prop', 'ps.property_id', 'prop.id')
        .join('users as u', 'ps.loaner_id', 'u.id')
        .select(
            'ps.*', 
            'ppi.*', 
            'prop.property_name', 
            'u.full_name as loaner_name', 
            'u.email as loaner_email'
        );
        return prequalify
      }

      public async getPreQualifyRequestByUser(user_id: string): Promise<any[]> {
        const prequalify = await db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('properties as prop', 'ps.property_id', 'prop.id')
        .where('ps.loaner_id', user_id)
        .select(
            'ps.*', 
            'ppi.*', 
            'prop.property_name'
        )
        return  prequalify
      }


      public async getPreQualifyRequestById(id: string): Promise<preQualify> {
       const prequalify = await  db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('properties as prop', 'ps.property_id', 'prop.id')
        .join('users as u', 'ps.loaner_id', 'u.id')
        .where('ps.status_id', id)
        .select(
            'ps.*', 
            'ppi.*', 
            'prop.property_name'
        )
        .first();

        return prequalify
      }

}
