// Backend DTOs matching the .NET backend
export interface HouseImageDto {
  id: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
  mediaType: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface HouseDto {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  address?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  propertyType?: string;
  yearBuilt?: number;
  lotSize?: number;
  features?: string[];
  status: string;
  totalTickets: number;
  ticketPrice: number;
  lotteryStartDate?: Date;
  lotteryEndDate: Date;
  drawDate?: Date;
  minimumParticipationPercentage: number;
  ticketsSold: number;
  participationPercentage: number;
  canExecute: boolean;
  images: HouseImageDto[];
  createdAt: Date;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  idNumber?: string;
  status: string;
  verificationStatus: string;
  authProvider: string;
  profileImageUrl?: string;
  preferredLanguage: string;
  timezone: string;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface LotteryTicketDto {
  id: string;
  ticketNumber: string;
  houseId: string;
  houseTitle: string;
  purchasePrice: number;
  status: string;
  purchaseDate: Date;
  isWinner: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: UserDto;
}

// Frontend interfaces for backward compatibility
export interface HouseImage {
  url: string;
  alt: string;
}

export interface House {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city?: string;
  address?: string;
  imageUrl: string; // Keep for backward compatibility
  images: HouseImage[]; // New array for multiple images
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotteryEndDate: Date;
  totalTickets: number;
  soldTickets: number;
  ticketPrice: number;
  status: 'active' | 'ended' | 'upcoming';
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  provider?: 'google' | 'meta' | 'apple' | 'twitter' | 'email';
}

export interface LotteryTicket {
  id: string;
  houseId: string;
  userId: string;
  purchaseDate: Date;
  ticketNumber: string;
}

// Request DTOs
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  authProvider: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PurchaseTicketRequest {
  houseId: string;
  quantity: number;
  paymentMethodId: string;
  promotionCode?: string;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  preferredLanguage?: string;
  timezone?: string;
}