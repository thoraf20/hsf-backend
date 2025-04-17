import { IFileRepository } from '@interfaces/IFileRespository'
import { createResponse } from '@presentation/response/responseType'
import { File } from '@providers/fileupload'
import { StatusCodes } from 'http-status-codes'

export class FileController {
  constructor(private readonly fileService: IFileRepository) {}

  async uploadSingleFile(file: File) {
    const uploadedFile = await this.fileService.upload([file])
    return createResponse(StatusCodes.OK, 'Success', uploadedFile[0])
  }
}
