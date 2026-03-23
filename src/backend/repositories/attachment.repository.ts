import { prisma } from "@/backend/lib/prisma";

export class AttachmentRepository {
  static async create(data: {
    taskId: string;
    filename: string;
    blobUrl: string;
    fileType: string;
    fileSize: number;
  }) {
    return prisma.attachment.create({ data });
  }

  static async findByTask(taskId: string) {
    return prisma.attachment.findMany({ where: { taskId } });
  }

  static async delete(attachmentId: string) {
    return prisma.attachment.delete({ where: { id: attachmentId } });
  }
}
