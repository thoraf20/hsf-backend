import { Properties } from "../../domain/entities/Property";
import { Inspection } from "../../domain/entities/Inspection";



export interface IInspectionRepository {
    createInpection (input: Inspection): Promise<Inspection>
    getAlreadySchedulesInspection (property_id: string, user_id: string) : Promise<Inspection> 
    getScheduleInspection (user_id: string): Promise<Inspection[] & Properties[]> 
    getAllScheduleInspection ( user_id: string, filter?: Record<string, any>): Promise<Inspection[] & Properties[]> 
    getScheduleInspectionById (inspection_id: string): Promise<Inspection & Properties> 
    

}