import { File, FileUpload, UploadedFile } from '@providers/fileupload'
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'

export type UploadParams = {
  key: string
  file: Buffer //| string;
  content_type?: string
  content_length?: any
}

export class S3Service implements FileUpload {
  private readonly s3Client: S3Client
  constructor(
    private readonly region: string,
    private readonly bucketName: string,
    private readonly credentials: {
      accessKeyId: string
      secretAccessKey: string
    },
  ) {
    this.s3Client = new S3Client({
      region: this.region,
      credentials: this.credentials,
    })
  }

  public async uploadFile({
    key,
    file,
    content_length,
    content_type,
  }: UploadParams) {
    const params = {
      Body: file,
      Bucket: this.bucketName,
      Key: key,
      ContentLength: content_length,
      ContentType: content_type,
      ContentEncoding: 'binary',
    }
    const command = new PutObjectCommand(params)
    await this.s3Client.send(command)
    let url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
    return { url }
  }

  public async upload(files: File[]): Promise<UploadedFile[]> {
    const uploadPromises = files.map(async (file) => {
      const params: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: file.name,
        Body: file.content,
        ContentLength: file.size,
        ContentType: file.type,
        ContentEncoding: 'binary',
      }

      const command = new PutObjectCommand(params)
      await this.s3Client.send(command)
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${file.name}` // Use file.name here

      return { path: url }
    })

    const results = await Promise.all(uploadPromises)
    return results
  }
}
