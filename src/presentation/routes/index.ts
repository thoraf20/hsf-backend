import { Router } from 'express'
import routes from './index.routes'


const IndexRouters: Router = Router()

IndexRouters.use('/', routes)


export default IndexRouters
