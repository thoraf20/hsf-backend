import { Router } from "express";
import manageInpespectionRouter from "./manageInpection.routes";
import developerRoutes from "./developer.routes";


export const developerIndexRoutes : Router = Router()

developerIndexRoutes.use('/manage/inspection', manageInpespectionRouter)
developerIndexRoutes.use('/developer', developerRoutes)

export default developerIndexRoutes

