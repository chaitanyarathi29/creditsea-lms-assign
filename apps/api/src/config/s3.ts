import { S3Client } from '@aws-sdk/client-s3'

export const s3BucketName = process.env.S3_BUCKET_NAME!

export const s3Region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'

if (!s3BucketName) {
  throw new Error('S3_BUCKET_NAME is required for salary slip uploads')
}

export const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
