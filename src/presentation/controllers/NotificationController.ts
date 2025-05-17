import { NotificationService } from '@application/useCases/Notification/NotificationService' // Adjust path as necessary
import { ApiResponse, createResponse } from '../response/responseType' // Adjust path as necessary
import { StatusCodes } from 'http-status-codes'
// Removed Request, Response import as controller methods no longer directly use them

export class NotificationController {
  private notificationService: NotificationService

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService
  }

  /**
   * Get all available notification types.
   */
  public async getNotificationTypes(): Promise<ApiResponse<any>> {
    const types = await this.notificationService.getAvailableNotificationTypes()
    return createResponse(
      StatusCodes.OK,
      'Available notification types retrieved successfully',
      types,
    )
  }

  /**
   * Get all available notification mediums.
   */
  public async getNotificationMediums(): Promise<ApiResponse<any>> {
    const mediums =
      await this.notificationService.getAvailableNotificationMediums()
    return createResponse(
      StatusCodes.OK,
      'Available notification mediums retrieved successfully',
      mediums,
    )
  }

  /**
   * Get all available notification frequencies.
   */
  public async getFrequencies(): Promise<ApiResponse<any>> {
    const frequencies = await this.notificationService.getAvailableFrequencies()
    return createResponse(
      StatusCodes.OK,
      'Available frequencies retrieved successfully',
      frequencies,
    )
  }

  /**
   * Get a user\'s enabled notification mediums.\n   * @param userId The ID of the user.
   */
  public async getUserEnabledMediums(
    userId: string,
  ): Promise<ApiResponse<any>> {
    const enabledMediums =
      await this.notificationService.getUserEnabledMediums(userId)
    return createResponse(
      StatusCodes.OK,
      'User enabled mediums retrieved successfully',
      enabledMediums,
    )
  }

  /**
   * Enable a notification medium for the authenticated user.\n   * @param userId The ID of the user.
   * @param mediumId The ID of the medium to enable.
   */
  public async enableMediumForUser(
    userId: string,
    mediumId: string,
  ): Promise<ApiResponse<any>> {
    await this.notificationService.enableMediumForUser(userId, mediumId)
    return createResponse(
      StatusCodes.OK,
      'Notification medium enabled for user successfully',
      {},
    )
  }

  /**
   * Disable a notification medium for the authenticated user.\n   * @param userId The ID of the user.
   * @param mediumId The ID of the medium to disable.
   */
  public async disableMediumForUser(
    userId: string,
    mediumId: string,
  ): Promise<ApiResponse<any>> {
    await this.notificationService.disableMediumForUser(userId, mediumId)
    return createResponse(
      StatusCodes.OK,
      'Notification medium disabled for user successfully',
      {},
    )
  }

  /**
   * Get a user\'s subscribed notification types.\n   * @param userId The ID of the user.
   */
  public async getUserSubscribedNotificationTypes(
    userId: string,
  ): Promise<ApiResponse<any>> {
    const subscribedTypes =
      await this.notificationService.getUserSubscribedNotificationTypes(userId)
    return createResponse(
      StatusCodes.OK,
      'User subscribed notification types retrieved successfully',
      subscribedTypes,
    )
  }

  /**
   * Subscribe the authenticated user to a notification type, optionally with a frequency.\n   * @param userId The ID of the user.
   * @param typeId The ID of the notification type.
   * @param frequencyId The optional ID of the desired frequency.
   */
  public async subscribeUserToNotificationType(
    userId: string,
    typeId: string,
    frequencyId?: string | null,
  ): Promise<ApiResponse<any>> {
    await this.notificationService.subscribeUserToNotificationType(
      userId,
      typeId,
      frequencyId,
    )

    return createResponse(
      StatusCodes.OK,
      'User subscribed to notification type successfully',
      {},
    )
  }

  /**
   * Unsubscribe the authenticated user from a notification type.\n   * @param userId The ID of the user.
   * @param typeId The ID of the notification type.
   */
  public async unsubscribeUserFromNotificationType(
    userId: string,
    typeId: string,
  ): Promise<ApiResponse<any>> {
    await this.notificationService.unsubscribeUserFromNotificationType(
      userId,
      typeId,
    )
    return createResponse(
      StatusCodes.OK,
      'User unsubscribed from notification type successfully',
      {},
    )
  }
}
