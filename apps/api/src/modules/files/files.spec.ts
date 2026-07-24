import { describe, expect, it } from "vitest";
import { UploadService } from "../../shared/services/upload.service";

describe("Files & UploadService", () => {
  it("should generate presigned upload metadata for allowed image mime types", async () => {
    const res = await UploadService.requestUpload({
      fileName: "queijo-canastra.jpg",
      mimeType: "image/jpeg",
      size: 1024 * 500, // 500 KB
      purpose: "product_image",
    });

    expect(res).toBeDefined();
    expect(res.fileId).toBeDefined();
    expect(res.objectKey).toContain("uploads/product_image/");
    expect(res.uploadUrl).toBeDefined();
  });

  it("should reject upload requests for disallowed file formats (e.g. SVG / script)", async () => {
    await expect(
      UploadService.requestUpload({
        fileName: "malicious.svg",
        mimeType: "image/svg+xml",
        size: 1024,
        purpose: "product_image",
      }),
    ).rejects.toThrow("Formato de arquivo não suportado");
  });

  it("should reject upload requests exceeding 5 MB file size limit", async () => {
    await expect(
      UploadService.requestUpload({
        fileName: "huge.jpg",
        mimeType: "image/jpeg",
        size: 10 * 1024 * 1024, // 10 MB
        purpose: "product_image",
      }),
    ).rejects.toThrow("excede o limite máximo permitido de 5 MB");
  });

  it("should finalize pending upload and approve file status", async () => {
    const request = await UploadService.requestUpload({
      fileName: "doce.png",
      mimeType: "image/png",
      size: 200 * 1024,
      purpose: "product_image",
    });

    const finalized = await UploadService.finalizeUpload(request.fileId);

    expect(finalized.status).toBe("approved");
    expect(finalized.checksum).toBeDefined();
  });
});
