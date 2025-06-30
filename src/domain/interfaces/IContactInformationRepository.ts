import { ContactInformation } from '@domain/entities/ContactInformation'

export interface IContactInformationRepository {
  create(data: Partial<ContactInformation>): Promise<ContactInformation>
  findById(id: string): Promise<ContactInformation | null>
  findByUserId(userId: string): Promise<ContactInformation | null>
  update(
    id: string,
    data: Partial<ContactInformation>,
  ): Promise<ContactInformation | null>
  delete(id: string): Promise<boolean>
}
