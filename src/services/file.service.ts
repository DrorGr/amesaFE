import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface FileDto {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
  tags?: string[];
}

export interface UploadFileRequest {
  file: File;
  isPublic?: boolean;
  tags?: string[];
  folder?: string;
}

export interface UpdateFileRequest {
  fileName?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface FileSearchParams {
  page?: number;
  limit?: number;
  mimeType?: string;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
  uploadedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private apiService: ApiService) {}

  // File Upload
  uploadFile(uploadData: UploadFileRequest): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    
    if (uploadData.isPublic !== undefined) {
      formData.append('isPublic', uploadData.isPublic.toString());
    }
    
    if (uploadData.tags && uploadData.tags.length > 0) {
      formData.append('tags', JSON.stringify(uploadData.tags));
    }
    
    if (uploadData.folder) {
      formData.append('folder', uploadData.folder);
    }

    return this.apiService.post<FileUploadResponse>('files/upload', formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to upload file');
      }),
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Multiple file upload
  uploadMultipleFiles(files: File[], options?: {
    isPublic?: boolean;
    tags?: string[];
    folder?: string;
  }): Observable<FileUploadResponse[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    if (options?.isPublic !== undefined) {
      formData.append('isPublic', options.isPublic.toString());
    }
    
    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', JSON.stringify(options.tags));
    }
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    return this.apiService.post<FileUploadResponse[]>('files/upload-multiple', formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to upload files');
      }),
      catchError(error => {
        console.error('Error uploading files:', error);
        return throwError(() => error);
      })
    );
  }

  // File Management
  getFiles(params?: FileSearchParams): Observable<{ files: FileDto[]; totalCount: number }> {
    return this.apiService.get<{ files: FileDto[]; totalCount: number }>('files', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch files');
      }),
      catchError(error => {
        console.error('Error fetching files:', error);
        return throwError(() => error);
      })
    );
  }

  getFileById(id: string): Observable<FileDto> {
    return this.apiService.get<FileDto>(`files/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch file');
      }),
      catchError(error => {
        console.error('Error fetching file:', error);
        return throwError(() => error);
      })
    );
  }

  updateFile(id: string, updateData: UpdateFileRequest): Observable<FileDto> {
    return this.apiService.put<FileDto>(`files/${id}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update file');
      }),
      catchError(error => {
        console.error('Error updating file:', error);
        return throwError(() => error);
      })
    );
  }

  deleteFile(id: string): Observable<boolean> {
    return this.apiService.delete(`files/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting file:', error);
        return throwError(() => error);
      })
    );
  }

  // File Download
  downloadFile(id: string): Observable<Blob> {
    return this.apiService.get<Blob>(`files/${id}/download`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to download file');
      }),
      catchError(error => {
        console.error('Error downloading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Generate file URL
  getFileUrl(id: string, thumbnail?: boolean): string {
    const baseUrl = this.apiService.getBaseUrl();
    const endpoint = thumbnail ? 'thumbnail' : 'file';
    return `${baseUrl}/files/${id}/${endpoint}`;
  }

  // Image processing
  generateThumbnail(id: string, width?: number, height?: number): Observable<FileUploadResponse> {
    const params: any = {};
    if (width) params.width = width;
    if (height) params.height = height;

    return this.apiService.post<FileUploadResponse>(`files/${id}/thumbnail`, params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to generate thumbnail');
      }),
      catchError(error => {
        console.error('Error generating thumbnail:', error);
        return throwError(() => error);
      })
    );
  }

  // File validation
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    return documentTypes.includes(mimeType);
  }
}
