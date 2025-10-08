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