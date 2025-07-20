import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { PropertyService } from '@application/useCases/Properties/Property'
import { Router } from 'express'
import { PropertyController } from '@controllers/property/Property.controller'
import {
  asyncMiddleware,
  authenticate,
  Role,
  validateRequest,
} from '../index.t'
import {
  propertyFiltersSchema,
  createPropertySchema,
  sharePropertySchema,
  UpdateSchema,
} from '@application/requests/dto/propertyValidator'
import { ApplicationRepository } from '@repositories/property/ApplicationRepository'
import { authorize } from '@middleware/authorization'
import {
  All,
  isHomeBuyer,
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { limiter } from '@middleware/security'
import { optionalAuth } from '@middleware/authMiddleware'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { validateRequestQuery } from '@shared/utils/paginate'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { DeveloperRepository } from '@repositories/Agents/DeveloperRepository'
import { DocumentRepository } from '@repositories/property/DocumentRepository'
import { ElasticSearchRepository } from '@repositories/Elastic Search/ElasticSearchRepository'

const propertyRoute: Router = Router()
const application = new ApplicationRepository()
const elasticSearch = new ElasticSearchRepository()
const service = new PropertyService(
  new PropertyRepository(),
  application,
  new OrganizationRepository(),
  new LenderRepository(),
  new UserRepository(),
  new DeveloperRepository(),
  new DocumentRepository(),
  elasticSearch
)
const controller = new PropertyController(service)

propertyRoute.post(
  '/create',
  authenticate,
  authorize(
    All(
      requireOrganizationType(
        OrganizationType.DEVELOPER_COMPANY,
        OrganizationType.HSF_INTERNAL,
      ),
      requireOrganizationRole([
        Role.HSF_ADMIN,
        Role.SUPER_ADMIN,
        Role.DEVELOPER_ADMIN,
        Role.DEVELOPER_AGENT,
      ]),
    ),
  ),
  limiter,
  validateRequest(createPropertySchema),
  asyncMiddleware(async (req, res) => {
    const { body, authInfo } = req
    const property = await controller.createProperty(
      { ...body, listed_by_id: authInfo.userId },
      authInfo.currentOrganizationId,
    )
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.get(
  '/required-reports-doc',
  authenticate,
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),
  limiter,
  asyncMiddleware(async (_, res) => {
    const response = await controller.getPropertyReportDocs()
    res.status(response.statusCode).json(response)
  }),
)

propertyRoute.get(
  '/all',
  optionalAuth,
  validateRequestQuery(propertyFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const { query, user } = req as any
    const properties = await controller.getAllProperties(
      query,
      user?.role,
      user?.id,
    )
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/developer-properties',
  authenticate,
  validateRequestQuery(propertyFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const properties = await controller.getPropertyByDeveloperOrgId(
      authInfo.currentOrganizationId,
      query,
    )
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/lenders',
  asyncMiddleware(async (req, res) => {
    const response = await controller.getLenders()
    res.status(response.statusCode).json(response)
  }),
)

propertyRoute.get(
  '/admin-properties',
  authenticate,
  validateRequestQuery(propertyFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  limiter,
  async (req, res) => {
    const { query } = req
    const properties = await controller.getPropertyByHSFAdmin(query)
    res.status(properties.statusCode).json(properties)
  },
)

propertyRoute.get(
  '/watchlist',
  authenticate,
  authorize(isHomeBuyer),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { user, query } = req

    const properties = await controller.getWatchlistProperty(user.id, query)
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/:id',
  limiter,
  optionalAuth,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req as any
    const property = await controller.getPropertyById(
      params.id,
      user?.id,
      user?.role,
    )
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.put(
  '/update/:id',
  authenticate,
  authorize(
    All(
      requireOrganizationType(OrganizationType.DEVELOPER_COMPANY),
      requireOrganizationRole([Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT]),
    ),
  ),
  limiter,
  validateRequest(UpdateSchema),
  asyncMiddleware(async (req, res) => {
    const { body, params, user } = req
    const property = await controller.updateProperty(body, params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.delete(
  '/delete/:id',
  authenticate,
  authorize(
    All(
      requireOrganizationType(
        OrganizationType.DEVELOPER_COMPANY,
        OrganizationType.HSF_INTERNAL,
      ),
      requireOrganizationRole([
        Role.DEVELOPER_ADMIN,
        Role.DEVELOPER_AGENT,
        Role.SUPER_ADMIN,
        Role.HSF_ADMIN,
      ]),
    ),
  ),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req
    const property = await controller.deleteProperty(params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)
propertyRoute.delete(
  '/remove-watchlist/:property_id',
  authenticate,
  authorize(isHomeBuyer),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req
    const property = await controller.removeFromWatchList(
      params.property_id,
      user.id,
    )
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.delete(
  '/soft-delete/:id',
  authenticate,
  authorize(
    All(
      requireOrganizationType(
        OrganizationType.DEVELOPER_COMPANY,
        OrganizationType.HSF_INTERNAL,
      ),
      requireOrganizationRole([
        Role.DEVELOPER_ADMIN,
        Role.DEVELOPER_AGENT,
        Role.SUPER_ADMIN,
        Role.HSF_ADMIN,
      ]),
    ),
  ),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req
    const property = await controller.softDeleteProperty(params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.post(
  '/add-watchlist/:property_id',
  authenticate,
  authorize(isHomeBuyer),
  limiter,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req

    const property = await controller.addWatchlistProperty(
      params.property_id,
      user.id,
    )
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.get(
  '/application/all',
  authenticate,
  authorize(isHomeBuyer),
  asyncMiddleware(async (req, res) => {
    const { user, query } = req
    const property = await controller.propertyApplication(user.id, query)
    res.status(property.statusCode).json(property)
  }),
)
propertyRoute.get(
  '/application/:application_id',
  authenticate,
  // authorize(isHomeBuyer),
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const property = await controller.getApplicationById(params.application_id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.post(
  '/share',
  authenticate,
  validateRequest(sharePropertySchema),
  asyncMiddleware(async (req, res) => {
    const { body, user } = req
    const property = await controller.propertyShare(body, user.id)
    res.status(property.statusCode).json(property)
  }),
)
propertyRoute.get(
  '/view/:property_id',
  authenticate,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req
    const property = await controller.viewProperty(params.property_id, user.id)
    res.status(property.statusCode).json(property)
  }),
)
export default propertyRoute
