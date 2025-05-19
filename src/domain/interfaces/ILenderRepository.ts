import { Lender, LenderProfile } from '@entities/Lender'
import { LenderFilters } from '@application/requests/dto/organizationValidator'
import { SeekPaginationResult } from '@shared/types/paginate'

export interface ILenderRepository {
  createLender(lender: Lender): Promise<LenderProfile>
  getLenderById(id: string): Promise<Lender | null>
  getAllLenders(filters: LenderFilters): Promise<SeekPaginationResult<Lender>>
  updateLender(id: string, lender: Partial<Lender>): Promise<Lender | null>
  deleteLender(id: string): Promise<void>
  findLenderByName(lender_name: string): Promise<Lender | null>
  findLenderByCac(cac: string): Promise<Lender | null>
}
