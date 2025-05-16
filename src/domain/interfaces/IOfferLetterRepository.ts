import { OfferLetter } from '@entities/PropertyPurchase'
import { SeekPaginationResult } from '@shared/types/paginate'
import { OfferLetterFilters } from '@validators/applicationValidator'

export interface IOfferLetterRepository {
  create(input: Partial<OfferLetter>): Promise<OfferLetter>
  getByUserId(id: string): Promise<Array<OfferLetter>>
  getByRequestId(id: string): Promise<OfferLetter>
  getById(id: string): Promise<OfferLetter>
  getAll(
    filters: OfferLetterFilters,
  ): Promise<SeekPaginationResult<OfferLetter>>
  update(id: string, data: Partial<OfferLetter>): Promise<OfferLetter>
  delete(id: string): Promise<OfferLetter>
}
