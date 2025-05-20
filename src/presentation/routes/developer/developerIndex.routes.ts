import { Router } from "express";
import manageInpespectionRouter from "./manageInpection.routes";
import developerRoutes from "./developer.routes";


export const developerIndexRoutes : Router = Router()

developerIndexRoutes.use('/', manageInpespectionRouter)
developerIndexRoutes.use('/', developerRoutes)

export default developerIndexRoutes

