// Lottery Favorites & Entry Management Interface Definitions
// Comprehensive type definitions for lottery favorites, entries, and preferences
// Matches backend DTOs defined in LOTTERY_FAVORITES_API_CONTRACTS.md

import { LotteryTicketDto } from '../models/house.model';

/**
 * User Lottery Data
 * Complete lottery-related data for a user including favorites, entries, stats, and preferences
 */
export interface UserLotteryData {
  favoriteHouseIds: string[];
  activeEntries: LotteryTicketDto[];
  stats?: UserLotteryStats;
  preferences?: LotteryPreferences;
}

/**
 * User Lottery Statistics
 * Analytics and statistics about user's lottery participation
 */
export interface UserLotteryStats {
  totalEntries: number;
  activeEntries: number;
  totalWins: number;
  totalSpending: number;
  totalWinnings: number;
  winRate: number;
  averageSpendingPerEntry: number;
  favoriteHouseId?: string;
  mostActiveMonth?: string;
  lastEntryDate?: string;
}

/**
 * Lottery Preferences
 * User preferences specific to lottery functionality
 */
export interface LotteryPreferences {
  notificationSettings?: NotificationSettings;
  quickEntrySettings?: QuickEntrySettings;
}

/**
 * Notification Settings
 * Preferences for lottery-related notifications
 */
export interface NotificationSettings {
  newLotteries: boolean;
  favoriteUpdates: boolean;
  drawReminders: boolean;
  winnerAnnouncements: boolean;
}

/**
 * Quick Entry Settings
 * Preferences for quick entry functionality
 */
export interface QuickEntrySettings {
  defaultTicketCount: number;
  autoEnterFavorites: boolean;
  maxSpendingLimit: number;
}

/**
 * Entry Filters
 * Filtering options for entry history queries
 */
export interface EntryFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'winner' | 'refunded';
  houseId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Paged Entry History Response
 * Paginated response for entry history queries
 */
export interface PagedEntryHistoryResponse {
  items: LotteryTicketDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Quick Entry Request
 * Request body for quick entry from favorites
 */
export interface QuickEntryRequest {
  houseId: string;
  quantity: number; // API contract specifies "quantity", backend has [JsonPropertyName("quantity")]
  paymentMethodId: string;
  promotionCode?: string; // Optional promotion code for discount
}

/**
 * Quick Entry Response
 * Response from quick entry operation
 */
export interface QuickEntryResponse {
  ticketsPurchased: number;
  totalCost: number; // Final cost after discount
  originalCost?: number; // Cost before discount
  discountAmount?: number; // Discount applied
  promotionCode?: string; // Promotion code used (if any)
  ticketNumbers: string[];
  transactionId: string;
}

/**
 * Favorite House Response
 * Response from add/remove favorite operations
 */
export interface FavoriteHouseResponse {
  houseId: string;
  added?: boolean;
  removed?: boolean;
  message: string;
}

/**
 * House Recommendation
 * Recommended house with recommendation score and reason
 */
export interface HouseRecommendation {
  id: string;
  title: string;
  price: number;
  location: string;
  recommendationScore: number;
  reason: string;
}

/**
 * Lottery Ticket Status
 * Status type for lottery tickets
 */
export type LotteryTicketStatus = 'active' | 'winner' | 'refunded' | 'expired';
