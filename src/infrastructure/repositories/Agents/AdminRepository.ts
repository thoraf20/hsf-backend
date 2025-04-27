import { AgentProfile, UserRegProfile } from "@entities/User"
import db from "@infrastructure/database/knex"
import { IAdminRepository } from "@interfaces/IAdminRespository"


export class AdminRepository implements IAdminRepository { 
    private readonly tableName = 'admin_profile'
    
    async createAdminProfile(data: AgentProfile): Promise<UserRegProfile> {
        const [admin] = await db(this.tableName).insert(data).returning('*')
        return new AgentProfile(admin) ? admin : null
    }

}