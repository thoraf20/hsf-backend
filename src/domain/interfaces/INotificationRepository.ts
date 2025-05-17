import {
  NotificationType,
  NotificationMedium,
  Frequency,
  UserEnabledMedium,
  UserSubscribedNotificationType,
} from '../entities/Notification'; // Import entity classes

export interface INotificationRepository {
  // Methods for reading configuration data
  getNotificationTypes(): Promise<NotificationType[]>;
  getNotificationMediums(): Promise<NotificationMedium[]>;
  getFrequencies(): Promise<Frequency[]>;
  getFrequencyById(frequencyId: string): Promise<Frequency | null>;
  getNotificationTypeById(typeId: string): Promise<NotificationType | null>;
  getNotificationMediumById(
    mediumId: string,
  ): Promise<NotificationMedium | null>;

  // Methods for managing user preferences
  getUserEnabledMediums(userId: string): Promise<UserEnabledMedium[]>;
  enableMediumForUser(userId: string, mediumId: string): Promise<void>;
  disableMediumForUser(userId: string, mediumId: string): Promise<void>;
  isMediumEnabledForUser(userId: string, mediumId: string): Promise<boolean>;

  getUserSubscribedNotificationTypes(
    userId: string,
  ): Promise<UserSubscribedNotificationType[]>;
  subscribeUserToNotificationType(
    userId: string,
    typeId: string,
    frequencyId?: string | null,
  ): Promise<void>;
  unsubscribeUserFromNotificationType(
    userId: string,
    typeId: string,
  ): Promise<void>;
  isUserSubscribedToNotificationType(
    userId: string,
    typeId: string,
  ): Promise<boolean>;

  // Methods for querying for sending notifications
  findUsersSubscribedToType(
    typeId: string,
    frequencyId?: string | null,
  ): Promise<UserSubscribedNotificationType[]>;
  findEnabledMediumsForUsers(userIds: string[]): Promise<UserEnabledMedium[]>; // Helper to get mediums for multiple users efficiently
}
