import { MiscController } from '@controllers/Misc.Controller'
import { DeclineReasonRepository } from '@repositories/DeclineRequest/DeclineReasonRepository'
import { validateRequestQuery } from '@shared/utils/paginate'
import { MiscService } from '@use-cases/Misc'
import { declineRequestFiltersSchema } from '@validators/declineRequestValidator'
import { Router } from 'express'

const miscRoutes = Router()
const miscService = new MiscService(new DeclineReasonRepository())
const miscController = new MiscController(miscService)

miscRoutes.get(
  '/declined-reasons',
  validateRequestQuery(declineRequestFiltersSchema),
  async (req, res) => {
    const { query } = req
    const response = await miscController.getDeclineReasons(query)
    res.status(response.statusCode).json(response)
  },
)

export default miscRoutes
