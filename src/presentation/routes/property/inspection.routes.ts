import { Router } from "express";
import { InspectionRepository } from "../../../infrastructure/repositories/property/Inspection";
import { InspectionService } from "../../../application/useCases/Inspection";
import { InspectionController } from "../../../presentation/controllers/Inspection.controller";
import { asyncMiddleware,  requireRole, Role, validateRequest } from '../index.t'
import { inspectionSchema } from "../../../application/requests/dto/inspectionVaidator";


const inspectionRoutes: Router = Router()
const inspectionRepo = new InspectionRepository()
const service = new InspectionService(inspectionRepo)
const inspectionController =  new InspectionController(service)

inspectionRoutes.post('/property/schedule', requireRole(Role.HOME_BUYER), validateRequest(inspectionSchema),  asyncMiddleware(async (req, res) => {
       const {user, body } =  req 
       const schedule = await inspectionController.scheduleInspectionController(body, user.id)
       res.status(schedule.statusCode).json(schedule)
}))


inspectionRoutes.get('/fetch-all', requireRole(Role.HOME_BUYER),  asyncMiddleware(async (req, res) => {
       const {user} = req 
       const inspection = await inspectionController.getScheduleInspection(user.id)
       res.status(inspection.statusCode).json(inspection)
}))
inspectionRoutes.get('/developer/fetch-all', requireRole(Role.DEVELOPER),  asyncMiddleware(async (req, res) => {
       const {user} = req 
       const inspection = await inspectionController.getDevScheduleInspection(user.id)
       res.status(inspection.statusCode).json(inspection)
}))

inspectionRoutes.get('/single/:inspection_id',  asyncMiddleware(async (req, res) => {
       const {params} = req 
       const inspection = await inspectionController.getInspectionById(params.inspection_id)
       res.status(inspection.statusCode).json(inspection)
}))


export default inspectionRoutes 
