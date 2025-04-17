import { IFileRepository } from '@interfaces/IFileRespository'
import { File, UploadedFile } from '@providers/fileupload'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export class FileRepository implements IFileRepository {
  private readonly uploadDirectory: string

  constructor(uploadDirectory: string) {
    this.uploadDirectory = uploadDirectory
    this.ensureDirectoryExists()
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDirectory, { recursive: true })
    } catch (error) {
      console.error(`Error creating upload directory: ${error}`)
      throw error // Re-throw the error to prevent the application from starting.
    }
  }

  async upload(files: File[]): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
      const filename = `${uuidv4()}.${file.extension}`
      const filePath = path.join(this.uploadDirectory, filename)

      try {
        await fs.writeFile(filePath, file.content)
        // Change this to a public-facing URL
        const publicPath = `/uploads/${filename}` // Construct the public URL
        uploadedFiles.push({ path: publicPath }) // Store the URL, not the absolute file path
      } catch (error) {
        console.error(`Error writing file ${filename}: ${error}`)
        throw error
      }
    }

    return uploadedFiles
  }

  async delete(filePath: string): Promise<void> {
    try {
      // Important:  The filePath here should now be a public URL (e.g., '/uploads/...')
      // To delete, you'll need to convert this back to the absolute file path
      const absoluteFilePath = path.join(
        this.uploadDirectory,
        path.basename(filePath),
      )
      await fs.unlink(absoluteFilePath)
    } catch (error) {
      console.error(`Error deleting file ${filePath}: ${error}`)
      throw error
    }
  }
}
