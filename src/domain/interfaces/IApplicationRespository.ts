import { Application } from "@entities/Application";
import { Properties } from "@entities/Property";



export interface IApplicationRespository {
    createApplication(input: Application): Promise<Application>
    getAllUserApplication(user_id: string): Promise<Properties[]>
    getApplicationById(application_id: string): Promise<Properties>
}