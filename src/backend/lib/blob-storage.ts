import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClient: ContainerClient | null = null;

export function getContainerClient(): ContainerClient {
  if (!containerClient) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER || "dev"
    );
  }
  return containerClient;
}

export async function uploadBlob(filename: string, data: Buffer, contentType: string): Promise<string> {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(filename);
  await blockBlobClient.upload(data, data.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return blockBlobClient.url;
}

export async function deleteBlob(filename: string): Promise<void> {
  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(filename);
  await blockBlobClient.deleteIfExists();
}
