import { Inspection } from "../../domain/entities/Inspection";



export interface IInspectionRepository {
    createInpection (input: Inspection): Promise<Inspection>
    getAlreadySchedulesInspection (property_id: string, user_id: string) : Promise<Inspection> 

}