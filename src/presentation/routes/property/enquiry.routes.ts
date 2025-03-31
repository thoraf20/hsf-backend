import { EnquiryController } from "@controllers/property/enquiry.controller";
import { requireRoles } from "@middleware/permissionMiddleware";
import { EnquiryRepository } from "@repositories/property/enquiries";
import { PropertyRepository } from "@repositories/property/PropertyRepository";
import { asyncMiddleware, Role, validateRequest } from "@routes/index.t";
import { EnquiryService } from "@use-cases/Properties/enquiries";
import { continueEnquirySchema, enquirySchema } from "@validators/enquiryValidator";
import { Router } from "express";



const enquiryRoutes: Router = Router()
const service = new EnquiryService(new EnquiryRepository(), new PropertyRepository())
const enquiryController = new EnquiryController(service)


enquiryRoutes.post(
    '/property',
    requireRoles(Role.HOME_BUYER),
    validateRequest(enquirySchema),
    asyncMiddleware(async (req, res) => {
      const { user, body } = req
      const enquiry = await enquiryController.startEnquiryTrail(
        user.id,
        body
      )
      res.status(enquiry.statusCode).json(enquiry)
    }),
  )

  enquiryRoutes.patch(
    '/property',
    requireRoles([Role.HOME_BUYER, Role.DEVELOPER]),
    validateRequest(continueEnquirySchema),
    asyncMiddleware(async (req, res) => {
      const { user, body } = req
      const enquiry = await enquiryController.continueEnquiryTrail(
        user.id,
        body
      )
      res.status(enquiry.statusCode).json(enquiry)
    }),
  )

  enquiryRoutes.post(
    '/property/close/:id',
    requireRoles([Role.HOME_BUYER, Role.DEVELOPER]),
    asyncMiddleware(async (req, res) => {
      const { user, params } = req
      const enquiry = await enquiryController.closeEnquiry(
        user.id,
        params.id
      )
      res.status(enquiry.statusCode).json(enquiry)
    }),
  )

  enquiryRoutes.get(
    '/property/:id',
    requireRoles([Role.HOME_BUYER, Role.DEVELOPER]),
    asyncMiddleware(async (req, res) => {
      const { user, params } = req
      const enquiry = await enquiryController.getEnquiryInfo(
        user.id,
        params.id
      )
      res.status(enquiry.statusCode).json(enquiry)
    }),
  )

  enquiryRoutes.get(
    '/property',
    requireRoles([Role.HOME_BUYER, Role.DEVELOPER]),
    asyncMiddleware(async (req, res) => {
      const { user } = req
      const enquiry = await enquiryController.getEnquiries(
        user.id
      );
      res.status(enquiry.statusCode).json(enquiry)
    }),
  )


export default enquiryRoutes