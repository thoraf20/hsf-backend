import { Request, Response, NextFunction } from 'express'
import { AsyncLocalStorage } from 'async_hooks'

const requestStorage = new AsyncLocalStorage<Map<string, any>>()

export function requestContextMiddleware(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  const store = new Map<string, any>()
  store.set('ipAddress', req.ip)
  store.set('userAgent', req.get('user-agent'))

  requestStorage.run(store, () => {
    next()
  })
}

export function getRequestStorage(): AsyncLocalStorage<Map<string, any>> {
  return requestStorage
}
