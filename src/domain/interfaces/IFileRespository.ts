import { File, UploadedFile } from '@providers/fileupload'

export interface IFileRepository {
  upload(files: File[]): Promise<UploadedFile[]>
}
