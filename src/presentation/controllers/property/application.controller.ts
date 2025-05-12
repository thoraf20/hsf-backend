import { OfferLetterStatus } from '@domain/enums/propertyEnum'
import { createResponse } from '@presentation/response/responseType'
import { PropertyFilters } from '@shared/types/repoTypes'
import { ApplicationService } from '@use-cases/Application/application'
import {
  CreateApplicationInput,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
} from '@validators/applicationValidator'
import { StatusCodes } from 'http-status-codes'

export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  async create(userId: string, input: CreateApplicationInput) {
    const application = await this.applicationService.create(userId, input)
    return createResponse(
      StatusCodes.CREATED,
      'Application intiated successfully',
      application,
    )
  }

  async getAllByUserId(userId: string, filter: PropertyFilters) {
    const applicationContents = await this.applicationService.getByUserId(
      userId,
      filter,
    )

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async requestOfferLetter(applicationId: string, userId: string) {
    const offerLetter = await this.applicationService.requestOfferLetter(
      applicationId,
      userId,
    )

    return createResponse(StatusCodes.CREATED, '', {
      offer_letter: offerLetter,
    })
  }

  async getApplicationOfferLetter(applicationId: string, userId: string) {
    const offerLetter =
      await this.applicationService.getOfferLetterByApplicationId(
        applicationId,
        userId,
      )

    return createResponse(StatusCodes.OK, '', { offer_letter: offerLetter })
  }

  async requestPropertyClosing(applicationId: string, userId: string) {
    const propertyClosing =
      await this.applicationService.requestPropertyClosing(
        applicationId,
        userId,
      )

    return createResponse(
      StatusCodes.OK,
      'Your request for propert closing is accepeted',
      {
        property_closing: propertyClosing,
      },
    )
  }

  async propertyClosingRespond(
    applicationId: string,
    input: RequestPropertyClosingInput,
  ) {
    const propertyClosing =
      await this.applicationService.propertyClosingRespond(applicationId, input)

    return createResponse(StatusCodes.OK, '', {
      property_closing: propertyClosing,
    })
  }

  async requestOfferLetterRespond(
    applicationId: string,
    input: RequestOfferLetterRespondInput,
  ) {
    const offerLetter = await this.applicationService.requestOfferLetterRespond(
      applicationId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      input.offer_letter_status === OfferLetterStatus.Approved
        ? 'Offer letter approved successfully'
        : 'Offer letter rejected successfully',
      { offer_letter: offerLetter },
    )
  }

  async scheduleEscrowMeeting(
    applicationId: string,
    userId: string,
    input: ScheduleEscrowMeetingInput,
  ) {
    const escrowAttendance =
      await this.applicationService.scheduleEscrowMeeting(
        applicationId,
        userId,
        input,
      )

    return createResponse(
      StatusCodes.CREATED,
      'Escrow attendance meeting placed successfully',
      {
        escrow_attendance: escrowAttendance,
      },
    )
  }

  async scheduleEscrowMeetingRespond(
    applicationId: string,
    userId: string,
    input: ScheduleEscrowMeetingRespondInput,
  ) {
    const escrowMeeting =
      await this.applicationService.scheduleEscrowMeetingRespond(
        applicationId,
        userId,
        input,
      )

    return createResponse(StatusCodes.FORBIDDEN, '', {
      escrow_meeting: escrowMeeting,
    })
  }
}
