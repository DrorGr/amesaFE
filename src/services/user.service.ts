import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, PagedResponse } from './api.service';
import { UserDto, UpdateUserProfileRequest } from '../models/house.model';

export interface UserAddressDto {
  id: string;
  userId: string;
  addressType: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface UserPhoneDto {
  id: string;
  userId: string;
  phoneNumber: string;
  phoneType: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface IdentityDocumentDto {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  isVerified: boolean;
  createdAt: Date;
}

export interface UserPreferencesDto {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressRequest {
  addressType: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  addressType?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CreatePhoneRequest {
  phoneNumber: string;
  phoneType: string;
  isDefault?: boolean;
}

export interface UpdatePhoneRequest {
  phoneNumber?: string;
  phoneType?: string;
  isDefault?: boolean;
}

export interface CreateIdentityDocumentRequest {
  documentType: string;
  documentNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
}

export interface UpdateIdentityDocumentRequest {
  documentType?: string;
  documentNumber?: string;
  issuedBy?: string;
  issuedDate?: Date;
  expiryDate?: Date;
}

export interface UpdateUserPreferencesRequest {
  language?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    marketing?: boolean;
  };
  privacy?: {
    profileVisibility?: string;
    showEmail?: boolean;
    showPhone?: boolean;
    showAddress?: boolean;
  };
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  verified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  // User Profile Management
  getUserProfile(): Observable<UserDto> {
    return this.apiService.get<UserDto>('users/profile').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user profile');
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserProfile(updateData: UpdateUserProfileRequest): Observable<UserDto> {
    return this.apiService.put<UserDto>('users/profile', updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update user profile');
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        return throwError(() => error);
      })
    );
  }

  uploadProfileImage(imageFile: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.apiService.post<{ imageUrl: string }>('users/profile/image', formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to upload profile image');
      }),
      catchError(error => {
        console.error('Error uploading profile image:', error);
        return throwError(() => error);
      })
    );
  }

  deleteProfileImage(): Observable<boolean> {
    return this.apiService.delete('users/profile/image').pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting profile image:', error);
        return throwError(() => error);
      })
    );
  }

  // Address Management
  getUserAddresses(): Observable<UserAddressDto[]> {
    return this.apiService.get<UserAddressDto[]>('users/addresses').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user addresses');
      }),
      catchError(error => {
        console.error('Error fetching user addresses:', error);
        return throwError(() => error);
      })
    );
  }

  addAddress(addressData: CreateAddressRequest): Observable<UserAddressDto> {
    return this.apiService.post<UserAddressDto>('users/addresses', addressData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to add address');
      }),
      catchError(error => {
        console.error('Error adding address:', error);
        return throwError(() => error);
      })
    );
  }

  updateAddress(addressId: string, updateData: UpdateAddressRequest): Observable<UserAddressDto> {
    return this.apiService.put<UserAddressDto>(`users/addresses/${addressId}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update address');
      }),
      catchError(error => {
        console.error('Error updating address:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAddress(addressId: string): Observable<boolean> {
    return this.apiService.delete(`users/addresses/${addressId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting address:', error);
        return throwError(() => error);
      })
    );
  }

  // Phone Management
  getUserPhones(): Observable<UserPhoneDto[]> {
    return this.apiService.get<UserPhoneDto[]>('users/phones').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user phones');
      }),
      catchError(error => {
        console.error('Error fetching user phones:', error);
        return throwError(() => error);
      })
    );
  }

  addPhone(phoneData: CreatePhoneRequest): Observable<UserPhoneDto> {
    return this.apiService.post<UserPhoneDto>('users/phones', phoneData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to add phone');
      }),
      catchError(error => {
        console.error('Error adding phone:', error);
        return throwError(() => error);
      })
    );
  }

  updatePhone(phoneId: string, updateData: UpdatePhoneRequest): Observable<UserPhoneDto> {
    return this.apiService.put<UserPhoneDto>(`users/phones/${phoneId}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update phone');
      }),
      catchError(error => {
        console.error('Error updating phone:', error);
        return throwError(() => error);
      })
    );
  }

  deletePhone(phoneId: string): Observable<boolean> {
    return this.apiService.delete(`users/phones/${phoneId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting phone:', error);
        return throwError(() => error);
      })
    );
  }

  verifyPhone(phoneId: string, verificationCode: string): Observable<boolean> {
    return this.apiService.post(`users/phones/${phoneId}/verify`, { code: verificationCode }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error verifying phone:', error);
        return throwError(() => error);
      })
    );
  }

  // Identity Document Management
  getUserIdentityDocuments(): Observable<IdentityDocumentDto[]> {
    return this.apiService.get<IdentityDocumentDto[]>('users/identity-documents').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch identity documents');
      }),
      catchError(error => {
        console.error('Error fetching identity documents:', error);
        return throwError(() => error);
      })
    );
  }

  addIdentityDocument(documentData: CreateIdentityDocumentRequest): Observable<IdentityDocumentDto> {
    return this.apiService.post<IdentityDocumentDto>('users/identity-documents', documentData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to add identity document');
      }),
      catchError(error => {
        console.error('Error adding identity document:', error);
        return throwError(() => error);
      })
    );
  }

  updateIdentityDocument(documentId: string, updateData: UpdateIdentityDocumentRequest): Observable<IdentityDocumentDto> {
    return this.apiService.put<IdentityDocumentDto>(`users/identity-documents/${documentId}`, updateData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update identity document');
      }),
      catchError(error => {
        console.error('Error updating identity document:', error);
        return throwError(() => error);
      })
    );
  }

  deleteIdentityDocument(documentId: string): Observable<boolean> {
    return this.apiService.delete(`users/identity-documents/${documentId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting identity document:', error);
        return throwError(() => error);
      })
    );
  }

  // User Preferences
  getUserPreferences(): Observable<UserPreferencesDto> {
    return this.apiService.get<UserPreferencesDto>('users/preferences').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user preferences');
      }),
      catchError(error => {
        console.error('Error fetching user preferences:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserPreferences(preferences: UpdateUserPreferencesRequest): Observable<UserPreferencesDto> {
    return this.apiService.put<UserPreferencesDto>('users/preferences', preferences).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update user preferences');
      }),
      catchError(error => {
        console.error('Error updating user preferences:', error);
        return throwError(() => error);
      })
    );
  }

  // Admin Functions
  getUsers(params?: UserSearchParams): Observable<PagedResponse<UserDto>> {
    return this.apiService.get<PagedResponse<UserDto>>('users', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch users');
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(userId: string): Observable<UserDto> {
    return this.apiService.get<UserDto>(`users/${userId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch user');
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserStatus(userId: string, status: string): Observable<boolean> {
    return this.apiService.put(`users/${userId}/status`, { status }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error updating user status:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(userId: string): Observable<boolean> {
    return this.apiService.delete(`users/${userId}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => error);
      })
    );
  }
}