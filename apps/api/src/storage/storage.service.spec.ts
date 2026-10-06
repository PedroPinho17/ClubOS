import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
const getSignedUrl = vi.hoisted(() =>
  vi.fn().mockResolvedValue("https://signed.example/obj"),
);

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = send;
  },
  HeadBucketCommand: class {
    constructor(public input: unknown) {}
  },
  CreateBucketCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl,
}));

describe("StorageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.S3_ENDPOINT = "http://localhost:3900";
    process.env.S3_ACCESS_KEY = "key";
    process.env.S3_SECRET_KEY = "secret";
    process.env.S3_BUCKET = "clubos";
    delete process.env.NODE_ENV;
  });

  async function loadService() {
    const { StorageService } = await import("./storage.service");
    return new StorageService();
  }

  it("upload e getUrl", async () => {
    send.mockResolvedValue({});
    const service = await loadService();
    await expect(
      service.upload("k", Buffer.from("x"), "image/png"),
    ).resolves.toBe("k");
    await expect(service.getUrl("k")).resolves.toBe(
      "https://signed.example/obj",
    );
    await expect(service.getUrl(null)).resolves.toBeNull();
  });

  it("deleteObject ignora key vazia e propaga erro", async () => {
    const service = await loadService();
    await service.deleteObject(null);
    expect(send).not.toHaveBeenCalled();

    send.mockRejectedValue(new Error("boom"));
    await expect(service.deleteObject("k")).rejects.toThrow(/boom/);
  });

  it("getObject le bytes", async () => {
    send.mockResolvedValue({
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      },
      ContentType: "image/png",
    });
    const service = await loadService();
    const out = await service.getObject("k");
    expect(out.contentType).toBe("image/png");
    expect(out.buffer.equals(Buffer.from([1, 2, 3]))).toBe(true);
  });

  it("getObject rejeita corpo vazio", async () => {
    send.mockResolvedValue({ Body: undefined });
    const service = await loadService();
    await expect(service.getObject("k")).rejects.toThrow(/vazio/i);
  });

  it("ping ok via HeadBucket", async () => {
    send.mockResolvedValue({});
    const service = await loadService();
    await expect(service.ping(500)).resolves.toBe("ok");
  });

  it("ping cria bucket se HeadBucket falhar", async () => {
    send
      .mockRejectedValueOnce(new Error("NoSuchBucket"))
      .mockResolvedValueOnce({});
    const service = await loadService();
    await expect(service.ping(500)).resolves.toBe("ok");
  });

  it("ping falha se S3 inacessivel", async () => {
    send.mockRejectedValue(new Error("ECONNREFUSED"));
    const service = await loadService();
    await expect(service.ping(200)).rejects.toThrow(/ECONNREFUSED|S3/);
  });

  it("onModuleInit cria bucket se necessario", async () => {
    send.mockRejectedValueOnce(new Error("missing")).mockResolvedValueOnce({});
    const service = await loadService();
    await service.onModuleInit();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("exige S3_ENDPOINT em producao", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.S3_ENDPOINT;
    process.env.S3_ACCESS_KEY = "a";
    process.env.S3_SECRET_KEY = "b";
    await expect(loadService()).rejects.toThrow(/S3_ENDPOINT/);
  });
});
