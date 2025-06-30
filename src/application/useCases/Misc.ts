import { IDeclineReasonRepository } from '@interfaces/IDeclineReasonRepository'
import { DeclineReasonFilters } from '@validators/declineRequestValidator'

export class MiscService {
  constructor(private readonly declineRespository: IDeclineReasonRepository) {}
  async getDeclineReasons(filters: DeclineReasonFilters) {
    return this.declineRespository.findByCategory(filters.category)
  }
}
