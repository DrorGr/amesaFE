export interface VerifyIdentityRequest {
  idFrontImage: string; // base64 encoded
  idBackImage?: string; // base64 encoded, optional
  selfieImage: string; // base64 encoded
  documentType: 'passport' | 'id_card' | 'drivers_license';
  documentNumber?: string;
}

export interface IdentityVerificationResult {
  isVerified: boolean;
  validationKey: string;
  livenessScore?: number;
  faceMatchScore?: number;
  verificationStatus: string;
  rejectionReason?: string;
  verificationMetadata?: Record<string, any>;
}

export interface IdentityVerificationStatus {
  validationKey?: string;
  verificationStatus: string;
  verifiedAt?: string;
  livenessScore?: number;
  faceMatchScore?: number;
  verificationAttempts: number;
  lastVerificationAttempt?: string;
  rejectionReason?: string;
}

