import { User } from "../../domain/entities/User";



export interface IAdminRepository { 
     inviteAgents(input: User): Promise<User>
}