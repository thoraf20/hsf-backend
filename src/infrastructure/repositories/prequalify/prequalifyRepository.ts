import { Eligibility, employmentInformation,  payment_calculator, personalinformation, preQualify, prequalifyStatus } from "@entities/prequalify/prequalify";
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
        return await db('prequalify_status').where('loaner_id', loaner_id).where('is_prequalify_requested', true).first()
      }

      public async getSuccessfulPrequalifyRequestByUser(loaner_id: string): Promise<any> { 
        return await db('prequalify_status').where('loaner_id', loaner_id).where('is_prequalify_requested', true).first()
      }

      public async addEligibility(input: Eligibility): Promise<Eligibility> {
          const [eligiblity] = await db('eligibility').insert(input).returning("*")
          return new Eligibility(eligiblity) ? eligiblity : null
      }

      public async IsHomeBuyerEligible(property_id: string, user_id: string): Promise<Eligibility> {
        const eligible = await db('eligibility').select('*').where('property_id', property_id).andWhere('user_id', user_id).andWhere('is_eligible', true).first()
        return new Eligibility(eligible) ? eligible : null
      }

      public async findEligiblity(property_id: string, user_id: string): Promise<Eligibility> {
          const eligible = await db('eligibility').select('*').where('property_id', property_id).andWhere('user_id', user_id).first()
          return new Eligibility(eligible) ? eligible : null
      }

      public async updatePrequalifyStatus(loaner_id: string, input: Partial<preQualify>): Promise<void> {
             await db('prequalify_status').update(input).where('loaner_id', loaner_id)
      }

      public async getPreQualifyRequest(): Promise<any[]> {
        const prequalify =  await db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('users as u', 'ps.loaner_id', 'u.id')
        .select(
            'ps.*', 
            'ppi.*', 
            'u.full_name as loaner_name', 
            'u.email as loaner_email'
        );
        return prequalify
      }

      public async getPreQualifyRequestByUser(user_id: string): Promise<any[]> {
        const prequalify = await db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('prequalify_other_info as info', 'ps.personal_information_id', 'info.personal_information_id')
        .where('ps.loaner_id', user_id)
        .select(
            'ps.*', 
            'ppi.*',
            'info.*'
        )
        return  prequalify
      }


      public async getPreQualifyRequestById(id: string): Promise<preQualify> {
       const prequalify = await  db('prequalify_status as ps')
        .join('prequalify_personal_information as ppi', 'ps.personal_information_id', 'ppi.personal_information_id')
        .join('prequalify_other_info as info', 'ps.personal_information_id', 'info.personal_information_id')
        .join('users as u', 'ps.loaner_id', 'u.id')
        .where('ps.status_id', id)
        .select(
            'ps.*', 
            'ppi.*',
            'info.*'
        )
        .first();

        return prequalify
      }

}
