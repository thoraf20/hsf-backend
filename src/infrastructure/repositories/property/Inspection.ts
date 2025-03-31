import { Properties } from "../../../domain/entities/Property";
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

  async getSchedulesInspectionForProperty(property_ids: string[]): Promise<Inspection[]> {
    if( property_ids.length < 1){
        return []
    }
    let query = db('inspection');
    let index = 0;
    for(var  property_id of property_ids){
        if (index == 0){
            query = query.where({ property_id });
        } else {
            query = query.and.where({ property_id });
        }
        index++
        
    }
    const foundInspection = await query.select("*").then((inspections) => inspections.map(inspection => new Inspection(inspection)));
    return foundInspection
}

  async getAllScheduleInspection(user_id: string, filter?: Record<string, any>): Promise<(Inspection & Properties)[]> {
             const inspections =   await db("inspection")
             .select(
                 "inspection.id as inspection_id",
                 "inspection.user_id as home_buyer_id",
                 "inspection.*",
                 "properties.id as property_id",
                 "properties.*",  // Ensure this matches the actual column name
                 "inspection.inspection_date",
                 "properties.user_id as developer_id"
             )
             .join("properties", "inspection.property_id", "properties.id")
             .join("users", "inspection.user_id", "users.id")
             .where("properties.user_id", user_id);
     
         return inspections.map((inspection) => ({
             ...new Inspection(inspection),  // Ensure `Inspection` constructor accepts this format
             ...new Properties(inspection), // Ensure `Properties` constructor accepts this format
         }));
  }

async getScheduleInspection(user_id: string): Promise<(Inspection & Properties)[]> {
    const inspections = await db("inspection")
        .select(
            "inspection.id as inspection_id",
            "inspection.user_id as home_buyer_id",
            "inspection.*",
            "properties.id as property_id",
            "properties.*",  
            "inspection.inspection_date",
            "properties.user_id as developer_id"
        )
        .join("properties", "inspection.property_id", "properties.id")
        .join("users", "inspection.user_id", "users.id")
        .where("inspection.user_id", user_id);

    return inspections.map((inspection) => ({
        ...new Inspection(inspection),  // Ensure `Inspection` constructor accepts this format
        ...new Properties(inspection), // Ensure `Properties` constructor accepts this format
    }));


    
}

async getScheduleInspectionById(inspection_id: string): Promise<Inspection & Properties> {
    const inspection = await db("inspection")
        .select(
            "inspection.id as inspection_id",
            "inspection.user_id as home_buyer_id",
            "inspection.*",
            "properties.id as property_id",
            "properties.*",  
            "inspection.inspection_date",
            "properties.user_id as developer_id"
        )
        .join("properties", "inspection.property_id", "properties.id")
        .join("users", "inspection.user_id", "users.id")
        .where("inspection.id", inspection_id)
        .first(); 

    if (!inspection) return null; 

    return {
        ...new Inspection(inspection), 
        ...new Properties(inspection),  
    };
}





}
