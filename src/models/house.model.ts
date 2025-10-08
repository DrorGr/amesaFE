export interface House {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrl: string;
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

export interface UserDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}