import { UserClientView } from "@entities/User";
import { SeekPaginationResult } from "@shared/types/paginate";
import { UserFilter } from "@validators/userValidator";

export interface IManageClientRepository {
    getAllCustomers(filters :UserFilter): Promise<SeekPaginationResult<UserClientView>>
    getMetaData(user_id: string): Promise<any> 
}