import { ApplicationError } from '@shared/utils/error'
import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import multer from 'multer'
import path from 'path'

export enum FileSize {
  BYTE = 1,
  KB = 1_024 * BYTE,
  MB = 1_024 * KB,
}
export interface UploadedFile {
  path: string
}

export interface FileUpload {
  upload: (files: File[] | File) => Promise<UploadedFile[]>
}

const defaultStorage = multer.memoryStorage()
const defaultFileSizeLimit = 5 * FileSize.MB

const defaultMulterInstance = multer({
  storage: defaultStorage,
  limits: { fileSize: defaultFileSizeLimit },
})

function configureMulterInstance(options: multer.Options = {}): multer.Multer {
  if (options != null && options.storage == null) {
    options.storage = defaultStorage
  }

  if (options != null) {
    return multer(options)
  }

  return defaultMulterInstance
}

export type FileExtension =
  | '.jpg'
  | '.png'
  | '.jpeg'
  | '.pdf'
  | '.csv'
  | '.xls'
  | '.xlsx'

export const allowedFileExtensions: Array<FileExtension> = [
  '.jpg',
  '.png',
  '.jpeg',
  '.pdf',
  '.csv',
  '.xls',
  '.xlsx',
]

export function fileTypeFilter(supportedExt: FileExtension[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ) => {
    const ext = path.extname(file.originalname)

    const isSupported = supportedExt.some((s) => ext == s)

    if (!isSupported) {
      return callback(
        new ApplicationError(
          `${file.fieldname} can either be a ${allowedFileExtensions.join(',')}`,
          StatusCodes.BAD_REQUEST,
        ),
      )
    }

    callback(null, true)
  }
}

export type UploadMethods = keyof multer.Multer

export type UploadArgs = Partial<{
  fieldName: string
  maxCount: number
  fields: readonly multer.Field[]
}>

export function fileMiddleware<T extends UploadMethods = UploadMethods>(
  method: T,
  args: UploadArgs &
    (
      | (T extends 'single' ? Pick<Required<UploadArgs>, 'fieldName'> : never)
      | (T extends 'fields' ? Pick<Required<UploadArgs>, 'fields'> : never)
      | (T extends 'array' ? Pick<Required<UploadArgs>, 'fieldName'> : never)
    ),
  options?: multer.Options &
    Partial<{
      /**
       * @description - whether to ignore unknown field or throw an error
       */
      ignoreUnknownField: boolean
    }>,
): RequestHandler {
  const multerInstance = configureMulterInstance(options)

  let handler: RequestHandler

  switch (method) {
    case 'single':
      handler = multerInstance.single(args.fieldName!)
      break
    case 'fields':
      handler = multerInstance.fields(args.fields!)
      break
    case 'array':
      handler = multerInstance.array(args.fieldName!, args.maxCount)
      break
    case 'any':
      handler = multerInstance.any()
      break
    case 'none':
      handler = multerInstance.none()
  }

  const ignoreUnknown = options?.ignoreUnknownField ?? true

  return (req, res, next) => {
    handler(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (err.code === 'LIMIT_UNEXPECTED_FILE' && ignoreUnknown) {
          next()
          return
        }

        next(
          new ApplicationError(
            `${err.message} ${err.field}`,
            StatusCodes.BAD_REQUEST,
          ),
        )
      } else if (err) {
        next(err)
      }

      next()
    })
  }
}
