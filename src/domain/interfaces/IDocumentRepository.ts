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
} from '@domain/enums/documentEnum' // Import enums for specific queries

// Union type for all possible document type enum values
type AllDocumentTypes =
  | DeveloperVerificationDocType
  | ConditionPrecedentDocType
  | MortgageUploadDocType

export interface IDocumentRepository {
  // --- DocumentGroup Operations ---
  findDocumentGroupById(id: string): Promise<DocumentGroup | undefined>
  findDocumentGroupByTag(
    tag: DocumentGroupEnum,
  ): Promise<DocumentGroup | undefined>
  findAllDocumentGroups(): Promise<DocumentGroup[]>
  createDocumentGroup(group: Partial<DocumentGroup>): Promise<DocumentGroup>
  updateDocumentGroup(
    id: string,
    updates: Partial<DocumentGroup>,
  ): Promise<DocumentGroup | undefined>
  deleteDocumentGroup(id: string): Promise<void>

  // --- GroupDocumentType Operations ---
  findGroupDocumentTypeById(id: string): Promise<GroupDocumentType | undefined>
  findGroupDocumentTypesByGroupId(groupId: string): Promise<GroupDocumentType[]>
  findGroupDocumentTypeByGroupIdAndDocumentType(
    groupId: string,
    documentType: AllDocumentTypes,
  ): Promise<GroupDocumentType | undefined>
  findAllGroupDocumentTypes(): Promise<GroupDocumentType[]>
  createGroupDocumentType(
    type: Partial<GroupDocumentType>,
  ): Promise<GroupDocumentType>
  updateGroupDocumentType(
    id: string,
    updates: Partial<GroupDocumentType>,
  ): Promise<GroupDocumentType | undefined>
  deleteGroupDocumentType(id: string): Promise<void>

  // --- ApplicationDocumentEntry Operations ---
  findApplicationDocumentEntryById(
    id: string,
  ): Promise<ApplicationDocumentEntry | undefined>
  findApplicationDocumentEntriesByApplicationId(
    applicationId: string,
  ): Promise<ApplicationDocumentEntry[]>
  findApplicationDocumentEntriesByApplicationIdAndGroupTypeId(
    applicationId: string,
    documentGroupTypeId: string,
  ): Promise<ApplicationDocumentEntry[]> // Might return multiple entries if tracking history/statuses

  findAllApplicationDocumentEntries(): Promise<ApplicationDocumentEntry[]> // Be cautious with large tables
  createApplicationDocumentEntry(
    entry: Partial<ApplicationDocumentEntry>,
  ): Promise<ApplicationDocumentEntry>
  updateApplicationDocumentEntry(
    id: string,
    updates: Partial<ApplicationDocumentEntry>,
  ): Promise<ApplicationDocumentEntry | undefined>
  deleteApplicationDocumentEntry(id: string): Promise<void>
}
