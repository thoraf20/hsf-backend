import { Inspection } from "../../../domain/entities/Inspection";
import { IInspectionRepository } from "../../../domain/interfaces/IInspectionRepository";
import db from '../../database/knex'


export class InspectionRepository implements IInspectionRepository {
  async createInpection(inspection: Inspection): Promise<Inspection> {
      const [newInspection] = await db('inspection')
          .insert({
              ...inspection,
              created_at: new Date(),
              updated_at: new Date()
          })
          .returning('*');
      return new Inspection(newInspection);
  }

  async getAlreadySchedulesInspection(property_id: string, user_id: string): Promise<Inspection | null> {
      const foundInspection = await db('inspection')
          .where({ property_id, user_id })
          .first();
      return foundInspection ? new Inspection(foundInspection) : null;
  }
}
