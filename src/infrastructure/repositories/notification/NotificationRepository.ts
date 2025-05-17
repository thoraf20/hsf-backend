import { Knex } from 'knex'
import db from '@infrastructure/database/knex'
import { INotificationRepository } from '@domain/interfaces/INotificationRepository'
import {
  NotificationType,
  NotificationMedium,
  Frequency,
  UserEnabledMedium,
  UserSubscribedNotificationType,
} from '@domain/entities/Notification'

export class NotificationRepository implements INotificationRepository {
  private readonly knex: Knex = db

  async getNotificationTypes(): Promise<NotificationType[]> {
    return this.knex<NotificationType>('notification_types').select('*')
  }

  async getNotificationMediums(): Promise<NotificationMedium[]> {
    return this.knex<NotificationMedium>('notification_mediums').select('*')
  }

  async getFrequencies(): Promise<Frequency[]> {
    return this.knex<Frequency>('frequencies').select('*')
  }

  async getFrequencyById(frequencyId: string): Promise<Frequency | null> {
    return this.knex<Frequency>('frequencies')
      .where({ frequency_id: frequencyId })
      .first()
  }

  async getNotificationTypeById(
    typeId: string,
  ): Promise<NotificationType | null> {
    return this.knex<NotificationType>('notification_types')
      .where({ notification_type_id: typeId })
      .first()
  }

  async getNotificationMediumById(
    mediumId: string,
  ): Promise<NotificationMedium | null> {
    return this.knex<NotificationMedium>('notification_mediums')
      .where({ notification_medium_id: mediumId })
      .first()
  }

  // Methods for managing user preferences
  async getUserEnabledMediums(userId: string): Promise<UserEnabledMedium[]> {
    return this.knex<UserEnabledMedium>('user_enabled_mediums')
      .where({ user_id: userId })
      .select('*')
  }

  async enableMediumForUser(userId: string, mediumId: string): Promise<void> {
    // Use insert ignore or similar based on your DB or handle conflict
    await this.knex('user_enabled_mediums')
      .insert({ user_id: userId, notification_medium_id: mediumId })
      .onConflict(['user_id', 'notification_medium_id'])
      .ignore() // Assuming PostgreSQL or similar syntax, adjust if needed
  }

  async disableMediumForUser(userId: string, mediumId: string): Promise<void> {
    await this.knex('user_enabled_mediums')
      .where({ user_id: userId, notification_medium_id: mediumId })
      .delete()
  }

  async isMediumEnabledForUser(
    userId: string,
    mediumId: string,
  ): Promise<boolean> {
    const count = await this.knex('user_enabled_mediums')
      .where({ user_id: userId, notification_medium_id: mediumId })
      .count('* as count')
      .first()
    return (count ? Number(count.count) : 0) > 0
  }

  async getUserSubscribedNotificationTypes(
    userId: string,
  ): Promise<UserSubscribedNotificationType[]> {
    return this.knex<UserSubscribedNotificationType>(
      'user_subscribed_notification_types',
    )
      .where({ user_id: userId })
      .select('*')
  }

  async subscribeUserToNotificationType(
    userId: string,
    typeId: string,
    frequencyId?: string | null,
  ): Promise<void> {
    await this.knex('user_subscribed_notification_types')
      .insert({
        user_id: userId,
        notification_type_id: typeId,
        frequency_id: frequencyId,
      })
      .onConflict(['user_id', 'notification_type_id'])
      .merge(['frequency_id'])
  }

  async unsubscribeUserFromNotificationType(
    userId: string,
    typeId: string,
  ): Promise<void> {
    await this.knex('user_subscribed_notification_types')
      .where({ user_id: userId, notification_type_id: typeId })
      .delete()
  }

  async isUserSubscribedToNotificationType(
    userId: string,
    typeId: string,
  ): Promise<boolean> {
    const count = await this.knex('user_subscribed_notification_types')
      .where({ user_id: userId, notification_type_id: typeId })
      .count('* as count')
      .first()
    return (count ? Number(count.count) : 0) > 0
  }

  // Methods for querying for sending notifications
  async findUsersSubscribedToType(
    typeId: string,
    frequencyId?: string | null,
  ): Promise<UserSubscribedNotificationType[]> {
    const query = this.knex<UserSubscribedNotificationType>(
      'user_subscribed_notification_types',
    ).where({ notification_type_id: typeId })

    if (frequencyId !== undefined) {
      query.where({ frequency_id: frequencyId })
    } else {
      // Handle cases where frequency_id is null (for instant notifications)
      query.whereNull('frequency_id')
    }

    return query.select('user_id', 'notification_type_id', 'frequency_id')
  }

  async findEnabledMediumsForUsers(
    userIds: string[],
  ): Promise<UserEnabledMedium[]> {
    if (userIds.length === 0) {
      return []
    }
    return this.knex<UserEnabledMedium>('user_enabled_mediums')
      .whereIn('user_id', userIds)
      .select('*')
  }
}
