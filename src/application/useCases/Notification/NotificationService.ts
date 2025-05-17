import { INotificationRepository } from '@domain/interfaces/INotificationRepository'
import {
  Frequency,
  NotificationMedium,
  NotificationType,
  UserEnabledMedium,
  UserSubscribedNotificationType,
} from '@domain/entities/Notification'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError' // Adjust path as necessary
import { IUserRepository } from '@domain/interfaces/IUserRepository' // Need to check if user exists

export class NotificationService {
  private notificationRepository: INotificationRepository
  private userRepository: IUserRepository // Assuming you have a user repository to validate user existence

  constructor(
    notificationRepository: INotificationRepository,
    userRepository: IUserRepository,
  ) {
    this.notificationRepository = notificationRepository
    this.userRepository = userRepository
  }

  /**
   * Get all available notification types.
   */
  public async getAvailableNotificationTypes(): Promise<NotificationType[]> {
    return this.notificationRepository.getNotificationTypes()
  }

  /**
   * Get all available notification mediums.
   */
  public async getAvailableNotificationMediums(): Promise<
    NotificationMedium[]
  > {
    return this.notificationRepository.getNotificationMediums()
  }

  /**
   * Get all available notification frequencies.
   */
  public async getAvailableFrequencies(): Promise<Frequency[]> {
    return this.notificationRepository.getFrequencies()
  }

  /**
   * Get a user's enabled notification mediums.
   * @param userId The ID of the user.
   */
  public async getUserEnabledMediums(
    userId: string,
  ): Promise<UserEnabledMedium[]> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return this.notificationRepository.getUserEnabledMediums(userId)
  }

  /**
   * Enable a notification medium for a user.
   * @param userId The ID of the user.
   * @param mediumId The ID of the medium to enable.
   */
  public async enableMediumForUser(
    userId: string,
    mediumId: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    const medium =
      await this.notificationRepository.getNotificationMediumById(mediumId)
    if (!medium) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Medium not found',
      )
    }

    await this.notificationRepository.enableMediumForUser(userId, mediumId)
  }

  /**
   * Disable a notification medium for a user.
   * @param userId The ID of the user.
   * @param mediumId The ID of the medium to disable.
   */
  public async disableMediumForUser(
    userId: string,
    mediumId: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    await this.notificationRepository.disableMediumForUser(userId, mediumId)
  }

  /**
   * Get a user's subscribed notification types.
   * @param userId The ID of the user.
   */
  public async getUserSubscribedNotificationTypes(
    userId: string,
  ): Promise<UserSubscribedNotificationType[]> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return this.notificationRepository.getUserSubscribedNotificationTypes(
      userId,
    )
  }

  /**
   * Subscribe a user to a notification type, optionally with a frequency.
   * @param userId The ID of the user.
   * @param typeId The ID of the notification type.
   * @param frequencyId The optional ID of the desired frequency.
   */
  public async subscribeUserToNotificationType(
    userId: string,
    typeId: string,
    frequencyId?: string | null,
    unique = true,
  ): Promise<void> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const type =
      await this.notificationRepository.getNotificationTypeById(typeId)
    if (!type) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Notification type not found',
      )
    }

    // Validate frequency existence if provided
    if (frequencyId !== undefined && frequencyId !== null) {
      const frequency =
        await this.notificationRepository.getFrequencyById(frequencyId)
      if (!frequency) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Frequency not found',
        )
      }

      if (unique) {
        await this.notificationRepository
          .getFrequencies()
          .then(async (freqs) => {
            const userSubscribedNotifications =
              await this.notificationRepository.getUserSubscribedNotificationTypes(
                userId,
              )

            await Promise.all(
              userSubscribedNotifications
                .filter((sub) => sub.notification_type_id === typeId)
                .map((sub) =>
                  this.notificationRepository.unsubscribeUserFromNotificationType(
                    userId,
                    sub.notification_type_id,
                  ),
                ),
            )
          })
      }
    }

    // this.notificationRepository.findUsersSubscribedToType(typeId)
    await this.notificationRepository.subscribeUserToNotificationType(
      userId,
      typeId,
      frequencyId,
    )
  }

  /**
   * Unsubscribe a user from a notification type.
   * @param userId The ID of the user.
   * @param typeId The ID of the notification type.
   */
  public async unsubscribeUserFromNotificationType(
    userId: string,
    typeId: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(String(userId)) // Assuming userId is string in UserRepository
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    await this.notificationRepository.unsubscribeUserFromNotificationType(
      userId,
      typeId,
    )
  }

  // Note: Methods for triggering/sending notifications based on preferences
  // would likely reside in a separate service (e.g., NotificationSenderService)
  // that depends on this NotificationService and the NotificationRepository
  // to query preferences when an event occurs.
}
