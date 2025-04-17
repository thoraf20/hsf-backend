import { Application } from "@entities/Application";
import { Properties } from "@entities/Property";
import db from "@infrastructure/database/knex";
import { IApplicationRespository } from "@interfaces/IApplicationRespository";


export class ApplicationRepository implements IApplicationRespository {
    private readonly tableName = 'application'
   async createApplication(input: Application): Promise<Application> {
       const [application] = await db(this.tableName).insert(input).returning('*')
       return new Application(application) ? application : null
    }

    async  getAllUserApplication(user_id: string): Promise<Properties[]> {
        const result = await db('properties as p')
        .leftJoin('escrow_status as es', function () {
          this.on('es.property_id', '=', 'p.id').andOn('es.user_id', '=', 'p.user_id')
        })
        .leftJoin('property_closing as pc', function () {
          this.on('pc.property_id', '=', 'p.id').andOn('pc.user_id', '=', 'p.user_id')
        })
        .leftJoin('prequalify_status as ps', function () {
          this.on('ps.loaner_id', '=', 'p.user_id')
        })
        .select(
          'p.*',
        //   'es.escrow_status',
        //   'es.is_escrow_set',
        //   'pc.closing_status',
        //   'ps.status as prequalify_status',
        //   'ps.verification'
        )
        .where('p.user_id', user_id)
        return result
    }

    async getApplicationById(application_id: string): Promise<Properties> {
        const result = await db('properties as p')
        .leftJoin('escrow_status as es', function () {
          this.on('es.property_id', '=', 'p.id').andOn('es.user_id', '=', 'p.user_id')
        })
        .leftJoin('property_closing as pc', function () {
          this.on('pc.property_id', '=', 'p.id').andOn('pc.user_id', '=', 'p.user_id')
        })
        .leftJoin('prequalify_status as ps', function () {
          this.on('ps.loaner_id', '=', 'p.user_id')
        })
        .select(
          'p.*',
          'es.escrow_status',
          'es.is_escrow_set',
          'pc.closing_status',
          'ps.status as prequalify_status',
          'ps.verification'
        )
        .where('p.application_id', application_id)
        .first()
        return result
    } 

    async updateApplication(input: Application): Promise<void> {
      await db('application').update(input).where('property_id', input.property_id).andWhere('user_id', input.user_id)
    }

    async getIfApplicationIsRecorded(property_id: string, user_id: string): Promise<Application> {
       return await db('application').select('*').where('property_id', property_id).andWhere('user_id', user_id).first()   
    }
}