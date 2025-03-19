import { Router } from "express";
import authRoutes from "./authRoutes/auth.routes";


const IndexRouters: Router = Router()

IndexRouters.use('/auth', authRoutes)


export default IndexRouters