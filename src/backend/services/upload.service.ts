import { uploadBlob } from "@/backend/lib/blob-storage";
import { AttachmentRepository } from "@/backend/repositories/attachment.repository";

export class UploadService {
  static async uploadFile(file: File, taskId: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${taskId}/${Date.now()}-${file.name}`;
    const blobUrl = await uploadBlob(filename, buffer, file.type);

    return AttachmentRepository.create({
      taskId,
      filename: file.name,
      blobUrl,
      fileType: file.type,
      fileSize: file.size,
    });
  }

  static async deleteFile(attachmentId: string) {
    return AttachmentRepository.delete(attachmentId);
  }
}
