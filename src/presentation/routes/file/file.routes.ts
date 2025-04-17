import { FileController } from '@controllers/File.controller'
// import { getEnv } from '@infrastructure/config/env/env.config'
import { FileRepository } from '@infrastructure/services/file.system.service'
// import { S3Service } from '@infrastructure/services/s3.service'
import { File, fileMiddleware, FileSize } from '@providers/fileupload'
import { Router, Request, Response } from 'express'
import path from 'path'
import { ulid } from 'ulid'

// const s3Service = new S3Service(
//   getEnv('AWS_ACCESS_KEY_ID'),
//   getEnv('AWS_BUCKET_NAME'),
//   {
//     accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
//     secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
//   },
// )

const fileService = new FileRepository(path.join(process.cwd(), 'uploads'))
const fileController = new FileController(fileService)

const router = Router()

router
  .route('/single')
  .post(
    fileMiddleware(
      'single',
      { fieldName: 'file' },
      { limits: { fieldSize: FileSize.MB * 10 } },
    ),
    async (req: Request | any, res: Response) => {
      const multerFile = req.file!
      const ext = multerFile.mimetype.split('/').pop()!

      const file: File = {
        name: multerFile.filename || `${ulid()}.${ext}`,
        content: multerFile.buffer,
        type: multerFile.mimetype,
        size: multerFile.size,
        extension: ext,
      }

      const response = await fileController.uploadSingleFile(file)

      res.status(response.statusCode).json(response)
    },
  )

export default router
