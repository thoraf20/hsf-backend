import { Knex } from 'knex'
import {
  NotificationMedium,
  NotificationType,
  Frequency,
} from '../../src/domain/entities/Notification'
import {
  NotificationFrequencyKind,
  NotificationMediumKind,
  NotificationTypeKind, // Import the new enum
} from '../../src/domain/enums/notificationEnum'

export async function seed(knex: Knex): Promise<void> {
  // Inserts seed entries for frequencies
  const frequencies: { name: NotificationFrequencyKind }[] = [
    { name: NotificationFrequencyKind.Daily },
    { name: NotificationFrequencyKind.Weekly },
    { name: NotificationFrequencyKind.Monthly },
  ]

  await Promise.all(
    frequencies.map(async (frequency) => {
      const frequencyTable = knex.table<Frequency>('frequencies')
      const [existing] = await frequencyTable
        .select()
        .where({ name: frequency.name })

      if (existing) {
        return
      }

      await frequencyTable.insert({ name: frequency.name })
    }),
  )

  // Inserts seed entries for notification mediums based on the UI
  const notificationMediums: { name: NotificationMediumKind }[] = [
    { name: NotificationMediumKind.Email },
    { name: NotificationMediumKind.InApp },
    { name: NotificationMediumKind.SmsAlert },
  ]

  await Promise.all(
    notificationMediums.map(async (medium) => {
      const notificationMediumTable = knex.table<NotificationMedium>(
        'notification_mediums',
      )
      const [existing] = await notificationMediumTable
        .select()
        .where({ name: medium.name })

      if (existing) {
        return
      }

      await notificationMediumTable.insert({ name: medium.name }) // Corrected insert statement
    }),
  )

  const notificationTypes = [
    {
      name: NotificationTypeKind.PropertyListingAlerts,
      description:
        'Receive notifications for new property listings added by agents or developers.',
    },
    {
      name: NotificationTypeKind.LoanApplicationNotifications,
      description:
        'Receive notifications for new property listings added by agents or developers.',
    },
    {
      name: NotificationTypeKind.AgentDeveloperActivityReport,
      description:
        'Receive notifications for new property listings added by agents or developers.',
    },
    {
      name: NotificationTypeKind.ClientInquiryAlerts,
      description:
        'Receive notifications for new property listings added by agents or developers.',
    },
    {
      name: NotificationTypeKind.PaymentTransactionAlerts,
      description:
        'Receive notifications for successful or failed payment transactions on the platform',
    },
    {
      name: NotificationTypeKind.NotificationMethod,
      description:
        'Select your preferred notification method—email, SMS, or in-app—to stay informed about your account and property activities.',
    },
  ]

  await Promise.all(
    notificationTypes.map(async (type) => {
      const notificationTypeTable =
        knex.table<NotificationType>('notification_types')
      const [existing] = await notificationTypeTable
        .select()
        .where({ name: type.name })

      if (existing) {
        await notificationTypeTable
          .update({ description: type.description })
          .where({ notification_type_id: existing.notification_type_id })
        return
      }

      await notificationTypeTable.insert(type)
    }),
  )
}
