import { AgentsInformation } from '@entities/IManageAgents'
import db from '@infrastructure/database/knex'
import { IManageAgentsRespository } from '@interfaces/IManageAgentsRespository'
import { Role } from '@routes/index.t'
import { exculedPasswordUserInfo } from '@shared/respositoryValues'
import { SeekPaginationResult } from '@shared/types/paginate'
import { AgentsFilters } from '@shared/types/repoTypes'

export class ManageAgentRepository implements IManageAgentsRespository {
  async getAllAgents(
    filters?: AgentsFilters,
  ): Promise<SeekPaginationResult<AgentsInformation[]>> {
    const query = db('users as u')
      .leftJoin('roles as r', 'u.role_id', '=', 'r.id')
      .select(...exculedPasswordUserInfo, 'r.name as role')
    if (filters?.role) {
      query.where('r.name', '=', filters.role)
    }

    const agents = await query

    return {
      result: agents,
      page: 1,
      total_records: agents.length,
      total_pages: 1,
      next_page: null,
      prev_page: null,
      result_per_page: agents.length,
    }
  }

  async getAgentById(agent_id: string, role: Role): Promise<any> {
    let query = db('users as u')
      .leftJoin('roles as r', 'u.role_id', '=', 'r.id')
      .select(...exculedPasswordUserInfo, 'r.name as role')
      .where('u.id', agent_id)
      .first()
    switch (role) {
      case Role.DEVELOPER_ADMIN:
        query = query
          .join('developers_profile as dp', 'u.id', 'dp.developers_profile_id')
          .select('dp.*')
        break
      case Role.LENDER_ADMIN:
        query = query
          .join('lenders_profile as lp', 'u.id', 'lp.user_id')
          .select('lp.*')
        break
      default:
        query = query
          .join('agents_profile as ap', 'u.id', 'ap.user_id')
          .select('ap.*')
    }
    const result = await query
    return result
  }

  async updateAgent(agent_id: string, data: Partial<any>): Promise<any> {
    return null
  }
}
