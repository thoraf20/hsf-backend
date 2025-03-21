import { Request, Response, NextFunction } from 'express'
async function tryCatchWrapper(
  asyncFunction: () => Promise<any>,
): Promise<any> {
  try {
    return await asyncFunction()
  } catch (error) {
    throw error
  }
}

const asyncMiddleware =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    tryCatchWrapper(() => fn(req, res, next)).catch(next)
  }

export default asyncMiddleware
