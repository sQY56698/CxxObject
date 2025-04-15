export interface UploadResponse {
  identifier: string;
  chunkSize: number;
  message: string;
}

export interface MergeResponse {
  filePath: string;
  fileUrl: string;
  message: string;
} 