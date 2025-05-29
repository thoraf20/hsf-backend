import { OrganizationType } from '@domain/enums/organizationEnum'
import { DIPLenderStatus, OfferLetterStatus } from '@domain/enums/propertyEnum'
import { createResponse } from '@presentation/response/responseType'
import { AuthInfo } from '@shared/utils/permission-policy'
import { ApplicationService } from '@use-cases/Application/application'
import { ManageDipUseCase } from '@use-cases/Developer/ManageDip'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import {
  CreateApplicationInput,
  DipFilters,
  LenderDipResponse,
  OfferLetterFilters,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
  UpdateDipLoanInput,
} from '@validators/applicationValidator'
import { InspectionFilters } from '@validators/inspectionVaidator'
import { PropertyFilters } from '@validators/propertyValidator'
import { StatusCodes } from 'http-status-codes'

export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly manageInspectionService: ManageInspectionUseCase,
    private readonly manageDipService: ManageDipUseCase,
  ) {}

  async create(userId: string, input: CreateApplicationInput) {
    const application = await this.applicationService.create(userId, input)
    return createResponse(
      StatusCodes.CREATED,
      'Application intiated successfully',
      { application },
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

  async getAllPropertyClosingsByHSF(filter: PropertyFilters) {
    const propertyClosings =
      await this.applicationService.getAllPropertyClosingsByHSF(filter)

    return createResponse(
      StatusCodes.OK,
      'Property closings retrieved successfully',
      propertyClosings,
    )
  }

  async getById(id: string, authInfo: AuthInfo) {
    const application = await this.applicationService.getById(id, authInfo)

    return createResponse(StatusCodes.OK, 'Application retrived successfully', {
      application,
    })
  }

  async getByDeveloperOrg(organizationId: string, filter: PropertyFilters) {
    const applicationContents = await this.applicationService.getByDeveloperOrg(
      organizationId,
      filter,
    )

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async getByHSF(filter: PropertyFilters) {
    const applicationContents = await this.applicationService.getByHSF(filter)

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

    return createResponse(
      StatusCodes.CREATED,
      'Request for offer letter successful',
      {
        offer_letter: offerLetter,
      },
    )
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

    return createResponse(StatusCodes.OK, 'Property closing status updated', {
      property_closing: propertyClosing,
    })
  }

  async requestOfferLetterRespond(
    organizationId: string,
    userId: string,
    applicationId: string,
    input: RequestOfferLetterRespondInput,
  ) {
    const offerLetter = await this.applicationService.requestOfferLetterRespond(
      organizationId,
      userId,
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
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingInput,
  ) {
    const escrowAttendance =
      await this.applicationService.scheduleEscrowMeeting(
        applicationId,
        authInfo,
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

  async getEscrowMeetingStatus(applicationId: string, authInfo: AuthInfo) {
    const escrowMeetingStatus =
      await this.applicationService.getEscrowMeetingStatus(
        applicationId,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      'Escrow Meeting status fetched successfully',
      escrowMeetingStatus,
    )
  }

  async scheduleEscrowMeetingRespond(
    applicationId: string,
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingRespondInput,
  ) {
    const escrowMeeting =
      await this.applicationService.scheduleEscrowMeetingRespond(
        applicationId,
        authInfo,
        input,
      )

    return createResponse(StatusCodes.FORBIDDEN, '', {
      escrow_meeting: escrowMeeting,
    })
  }

  async getOfferLetter(authInfo: AuthInfo, filters: OfferLetterFilters) {
    const offerLetters = await this.applicationService.getOfferLetters(
      authInfo,
      filters,
    )

    return createResponse(
      StatusCodes.OK,
      'Offer Letter retrieved successfully',
      offerLetters,
    )
  }

  async getRequiredDoc(applicationId: string, authInfo: AuthInfo) {
    const contents = await this.applicationService.getRequiredDoc(
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Document Required fetched successfully',
      { documents: contents },
    )
  }

  async getInspectionsByApplicationId(
    applicationId: string,
    authInfo: AuthInfo,
  ) {
    const contents =
      await this.manageInspectionService.getInspectionByApplicationId(
        applicationId,
      )

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getInspections(authInfo: AuthInfo, filters: InspectionFilters) {
    const contents = await this.manageInspectionService.getAllInspections({
      ...filters,
      ...(authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY
        ? { organization_id: authInfo.currentOrganizationId }
        : null),
    })

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getInspect(applicationId: string, authInfo: AuthInfo) {
    const contents =
      await this.manageInspectionService.getAllInspectionList(applicationId)

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getDips(authInfo: AuthInfo, filters: DipFilters) {
    const dipContents = await this.manageDipService.getDips(authInfo, filters)

    return createResponse(
      StatusCodes.OK,
      'Dips retrived successfully',
      dipContents,
    )
  }

  async getApplicationDipById(applicationId: string, dipId: string) {
    const dip = await this.manageDipService.getDipById(applicationId, dipId)

    return createResponse(StatusCodes.OK, 'Dip retrived succesfully', dip)
  }

  async updateApplicationDipById(
    applicationId: string,
    dipId: string,
    input: UpdateDipLoanInput,
  ) {
    const updatedDip = await this.manageDipService.updateDip(
      applicationId,
      dipId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      'Dip updated successfully',
      updatedDip,
    )
  }

  async lenderDipRespond(
    applicationId: string,
    dipId: string,
    input: LenderDipResponse,
  ) {
    const updatedDip = await this.manageDipService.lenderDipResponse(
      applicationId,
      dipId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      updatedDip.dip_lender_status === DIPLenderStatus.Accepted
        ? 'Dip approved successfully'
        : 'Dip rejected successfully',
      updatedDip,
    )
  }
}
