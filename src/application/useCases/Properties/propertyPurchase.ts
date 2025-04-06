import { OfferLetterStatusEnum } from '@domain/enums/propertyEnum'
import { OfferLetter } from '@entities/PropertyPurchase'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private readonly preQualifieRepository: IPreQualify
  private readonly utilsProperty: PropertyBaseUtils
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
    preQualifieRepository: IPreQualify,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
    this.preQualifieRepository = preQualifieRepository
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
      console.log(property_id)
      await   this.utilsProperty.findIfPropertyExist(property_id)
    const [alreadyApprovedAndSoldOut, PendingRequest] = await Promise.all([
      this.purchaseRepository.checkIfRequestForOfferLetterIsApproved(
        property_id,
      ),
      this.purchaseRepository.checkIfRequestForOfferLetter(
        property_id,
        user_id,
      ),
    ])

    if (alreadyApprovedAndSoldOut) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'This property Has already been sold',
      )
    }

    if (PendingRequest) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Your request is under review',
      )
    }
  }

  public async requestForOfferLetter(
    input: OfferLetter,
    user_id: string,
  ): Promise<OfferLetter> {
    await this.checkoutDuplicate(input.property_id, user_id);
  
    const isOutright = input.purchase_type === OfferLetterStatusEnum.OUTRIGHT;
  
    if (!isOutright) {
      const preQualified = await this.preQualifieRepository.findIfApplyForLoanAlready(user_id);
      if (!preQualified) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'You must pre-qualify for a loan before requesting an offer letter',
        );
      }
  
      const approvedPreQualify = await this.preQualifieRepository.getSuccessfulPrequalifyRequestByUser(user_id);
      if (!approvedPreQualify) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Your pre-qualification request has not been approved',
        );
      }
    }
  
    const offerLetter = await this.purchaseRepository.requestForOfferLetter({
      property_id: input.property_id,
      user_id,
      offer_letter_requested: true,
      purchase_type: input.purchase_type,
    });
  
    return offerLetter;
  }
  
  public async changeOfferLetterStatus(input: OfferLetter, user_id: string): Promise<void> {
    const offerLetter = await this.purchaseRepository.getOfferLetterById(input.offer_letter_id);
    if (!offerLetter) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Offer letter not found',
      );
    }
  
    const preQualified = await this.preQualifieRepository.findIfApplyForLoanAlready(user_id);
    if (!preQualified) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'You must apply for a loan before changing the offer letter status',
      );
    }
  
    await this.purchaseRepository.updateOfferLetterStatus(
      input.offer_letter_id,
      {...input},
    );
  }
  
} 
  