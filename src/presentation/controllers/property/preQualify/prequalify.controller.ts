import { preQualify } from '@entities/prequalify/prequalify'
import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { preQualifyService } from '@use-cases/Properties/preQualify/prequalify'
import { StatusCodes } from 'http-status-codes'

export class preQualifyController {
  constructor(private readonly service: preQualifyService) {}

  public async preQualifierController(
    input: preQualify,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const preQualifier = await this.service.storePreQualify(input, user_id)
    return createResponse(
      StatusCodes.CREATED,
      `Prequalifier was created successfully`,
      preQualifier,
    )
  }

  public async verification(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    await this.service.verification(input)
    return createResponse(StatusCodes.OK, `Verification was complete`, {})
  }
}
