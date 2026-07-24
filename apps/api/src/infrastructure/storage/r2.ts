import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { apiEnv } from "@verttex/env/api";

export class R2Storage {
  private s3: S3Client | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = apiEnv.R2_BUCKET_NAME || "verttex";
    if (
      apiEnv.R2_ENDPOINT &&
      apiEnv.R2_ACCESS_KEY_ID &&
      apiEnv.R2_SECRET_ACCESS_KEY
    ) {
      this.s3 = new S3Client({
        endpoint: apiEnv.R2_ENDPOINT,
        region: "auto",
        credentials: {
          accessKeyId: apiEnv.R2_ACCESS_KEY_ID,
          secretAccessKey: apiEnv.R2_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.s3) {
      console.warn("R2 Client is not configured. Simulating file upload.");
      return `http://localhost:3333/mock-storage/${key}`;
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return this.getFileUrl(key);
  }

  async getFileUrl(key: string): Promise<string> {
    const cleanKey = key.replace(/^\//, "");

    if (apiEnv.R2_PUBLIC_URL) {
      const cleanPublicUrl = apiEnv.R2_PUBLIC_URL.replace(/\/$/, "");
      return `${cleanPublicUrl}/${cleanKey}`;
    }

    if (apiEnv.R2_ENDPOINT) {
      const cleanEndpoint = apiEnv.R2_ENDPOINT.replace(/\/$/, "");
      return `${cleanEndpoint}/${this.bucketName}/${cleanKey}`;
    }

    return `http://localhost:3333/mock-storage/${cleanKey}`;
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.s3) {
      console.warn("R2 Client is not configured. Simulating file delete.");
      return;
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }
}
