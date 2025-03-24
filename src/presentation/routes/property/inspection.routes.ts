import { Router } from "express";
import { InspectionRepository } from "../../../infrastructure/repositories/property/Inspection";
import { InspectionService } from "../../../application/useCases/Inspection";
import { InspectionController } from "../../../presentation/controllers/Inspection.controller";
import { asyncMiddleware, authenticate, isHomeBuyer, validateRequest } from '../index.t'
import { inspectionSchema } from "../../../application/requests/dto/inspectionVaidator";


const inspectionRoutes: Router = Router()
const inspectionRepo = new InspectionRepository()
const service = new InspectionService(inspectionRepo)
const inspectionController =  new InspectionController(service)

inspectionRoutes.post('/property/schedule', authenticate, isHomeBuyer, validateRequest(inspectionSchema),  asyncMiddleware(async (req, res) => {
       const {user, body } =  req 
       const schedule = await inspectionController.scheduleInspectionController(body, user.id)
       res.status(schedule.statusCode).json(schedule)
}))



export default inspectionRoutes
