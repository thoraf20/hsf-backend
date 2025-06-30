import { createResponse } from '@presentation/response/responseType'
import { MiscService } from '@use-cases/Misc'
import { DeclineReasonFilters } from '@validators/declineRequestValidator'
import { StatusCodes } from 'http-status-codes'

export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  async getDeclineReasons(filters: DeclineReasonFilters) {
    const declinedReasons = await this.miscService.getDeclineReasons(filters)
    return createResponse(
      StatusCodes.OK,
      'Document declined reasons retrieved successfully',
      declinedReasons,
    )
  }
}
