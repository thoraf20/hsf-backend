import { Knex } from 'knex'
import { IDocumentRepository } from '@domain/interfaces/IDocumentRepository'
import {
  DocumentGroup,
  GroupDocumentType,
  ApplicationDocumentEntry,
} from '@domain/entities/ApplicationDocuments'
import {
  DocumentGroupKind as DocumentGroupEnum,
  DeveloperVerificationDocType,
  ConditionPrecedentDocType,
  MortgageUploadDocType,
} from '@domain/enums/documentEnum'
import db from '@infrastructure/database/knex'

type AllDocumentTypes =
  | DeveloperVerificationDocType
  | ConditionPrecedentDocType
  | MortgageUploadDocType

export class DocumentRepository implements IDocumentRepository {
  private readonly knex: Knex
  private readonly DOCUMENT_GROUPS_TABLE = 'document_groups'
  private readonly GROUP_DOCUMENT_TYPES_TABLE = 'group_document_types'
  private readonly APPLICATION_DOCUMENT_ENTRIES_TABLE =
    'application_document_entries'

  constructor() {
    this.knex = db
  }

  async findDocumentGroupById(id: string): Promise<DocumentGroup | undefined> {
    return this.knex<DocumentGroup>(this.DOCUMENT_GROUPS_TABLE)
      .where({ id })
      .first()
  }

  async findDocumentGroupByTag(
    tag: DocumentGroupEnum,
  ): Promise<DocumentGroup | undefined> {
    return this.knex<DocumentGroup>(this.DOCUMENT_GROUPS_TABLE)
      .where({ tag })
      .first()
  }

  async findAllDocumentGroups(): Promise<DocumentGroup[]> {
    return this.knex<DocumentGroup>(this.DOCUMENT_GROUPS_TABLE).select('*')
  }

  async createDocumentGroup(
    group: Partial<DocumentGroup>,
  ): Promise<DocumentGroup> {
    const { id, ...insertData } = group
    const [created] = await this.knex<DocumentGroup>(this.DOCUMENT_GROUPS_TABLE)
      .insert(insertData)
      .returning('*')
    return created
  }

  async updateDocumentGroup(
    id: string,
    updates: Partial<DocumentGroup>,
  ): Promise<DocumentGroup | undefined> {
    const { id: updateId, created_at, ...updateData } = updates
    const [updated] = await this.knex<DocumentGroup>(this.DOCUMENT_GROUPS_TABLE)
      .where({ id })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*')
    return updated
  }

  async deleteDocumentGroup(id: string): Promise<void> {
    await this.knex(this.DOCUMENT_GROUPS_TABLE).where({ id }).del()
  }

  // --- GroupDocumentType Operations ---
  async findGroupDocumentTypeById(
    id: string,
  ): Promise<GroupDocumentType | undefined> {
    return this.knex<GroupDocumentType>(this.GROUP_DOCUMENT_TYPES_TABLE)
      .where({ id })
      .first()
  }

  async findGroupDocumentTypesByGroupId(
    groupId: string,
  ): Promise<GroupDocumentType[]> {
    return this.knex<GroupDocumentType>(this.GROUP_DOCUMENT_TYPES_TABLE)
      .where({ group_id: groupId })
      .select('*')
  }

  async findGroupDocumentTypeByGroupIdAndDocumentType(
    groupId: string,
    documentType: AllDocumentTypes,
  ): Promise<GroupDocumentType | undefined> {
    // Correctly typed knex and returning result directly
    return this.knex<GroupDocumentType>(this.GROUP_DOCUMENT_TYPES_TABLE)
      .where({ group_id: groupId, document_type: documentType })
      .first()
  }

  async findAllGroupDocumentTypes(): Promise<GroupDocumentType[]> {
    // Correctly typed knex, select returns array of typed entities
    return this.knex<GroupDocumentType>(this.GROUP_DOCUMENT_TYPES_TABLE).select(
      '*',
    )
  }

  async createGroupDocumentType(
    type: Partial<GroupDocumentType>,
  ): Promise<GroupDocumentType> {
    const { id, created_at, updated_at, ...insertData } = type
    const [created] = await this.knex<GroupDocumentType>(
      this.GROUP_DOCUMENT_TYPES_TABLE,
    )
      .insert(insertData)
      .returning('*')
    return created // Returning result directly
  }

  async updateGroupDocumentType(
    id: string,
    updates: Partial<GroupDocumentType>,
  ): Promise<GroupDocumentType | undefined> {
    // Corrected: Removed mapTo call, added typing to knex update/returning
    const { id: updateId, created_at, ...updateData } = updates
    const [updated] = await this.knex<GroupDocumentType>(
      this.GROUP_DOCUMENT_TYPES_TABLE,
    )
      .where({ id })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*')
    return updated
  }

  async deleteGroupDocumentType(id: string): Promise<void> {
    await this.knex(this.GROUP_DOCUMENT_TYPES_TABLE).where({ id }).del()
  }

  // --- ApplicationDocumentEntry Operations ---

  async findApplicationDocumentEntryById(
    id: string,
  ): Promise<ApplicationDocumentEntry | undefined> {
    return this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    )
      .where({ id })
      .first()
  }

  async findApplicationDocumentEntriesByApplicationId(
    applicationId: string,
  ): Promise<ApplicationDocumentEntry[]> {
    return this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    )
      .where({ application_id: applicationId })
      .select('*')
  }

  async findApplicationDocumentEntriesByApplicationIdAndGroupTypeId(
    applicationId: string,
    documentGroupTypeId: string,
  ): Promise<ApplicationDocumentEntry[]> {
    return this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    )
      .where({
        application_id: applicationId,
        document_group_type_id: documentGroupTypeId,
      })
      .select('*')
      .orderBy('created_at', 'desc')
  }

  async findAllApplicationDocumentEntries(): Promise<
    ApplicationDocumentEntry[]
  > {
    return this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    ).select('*')
  }

  async createApplicationDocumentEntry(
    entry: Partial<ApplicationDocumentEntry>,
  ): Promise<ApplicationDocumentEntry> {
    const { id, created_at, updated_at, ...insertData } = entry
    const [created] = await this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    )
      .insert(insertData)
      .returning('*')
    return created
  }

  async updateApplicationDocumentEntry(
    id: string,
    updates: Partial<ApplicationDocumentEntry>,
  ): Promise<ApplicationDocumentEntry | undefined> {
    const { id: updateId, created_at, ...updateData } = updates
    const [updated] = await this.knex<ApplicationDocumentEntry>(
      this.APPLICATION_DOCUMENT_ENTRIES_TABLE,
    )
      .where({ id })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*')
    return updated
  }

  async deleteApplicationDocumentEntry(id: string): Promise<void> {
    await this.knex(this.APPLICATION_DOCUMENT_ENTRIES_TABLE).where({ id }).del()
  }
}
