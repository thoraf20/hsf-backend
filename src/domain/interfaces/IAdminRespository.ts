import { AgentProfile, UserRegProfile } from "@entities/User";

export interface IAdminRepository {
    createAdminProfile(input: AgentProfile): Promise<UserRegProfile>
}