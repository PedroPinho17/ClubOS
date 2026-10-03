import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "clubos";
    const accessKey = process.env.S3_ACCESS_KEY?.trim();
    const secretKey = process.env.S3_SECRET_KEY?.trim();
    const isProd = process.env.NODE_ENV === "production";

    if (isProd && (!accessKey || !secretKey)) {
      throw new Error(
        "S3_ACCESS_KEY e S3_SECRET_KEY sao obrigatorios em producao.",
      );
    }

    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
      region: process.env.S3_REGION ?? "eu-west-1",
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
      credentials: {
        accessKeyId: accessKey || "clubos",
        secretAccessKey: secretKey || "dev-only-minio-secret-change-me",
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`Bucket "${this.bucket}" criado.`);
      } catch (err) {
        this.logger.warn(
          `Nao foi possivel garantir o bucket "${this.bucket}": ${(err as Error).message}`,
        );
      }
    }
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  /** URL temporaria de leitura (para o browser mostrar imagens privadas). */
  async getUrl(
    key: string | null | undefined,
    expiresIn = 3600,
  ): Promise<string | null> {
    if (!key) return null;
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      {
        expiresIn,
      },
    );
  }

  /** Remove um objeto (ex.: foto de socio no erase RGPD). Ignora key vazia. */
  async deleteObject(key: string | null | undefined): Promise<void> {
    if (!key) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(
        `Falha ao apagar objeto "${key}": ${(err as Error).message}`,
      );
      throw err;
    }
  }

  /** Leitura direta do objeto (ex.: favicon via API autenticada). */
  async getObject(
    key: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error("Objeto vazio no storage.");
    }
    return {
      buffer: Buffer.from(bytes),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  }
}
