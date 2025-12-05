import { HouseDto } from '../models/house.model';

/**
 * Watchlist Item
 * Represents a house in user's watchlist
 */
export interface WatchlistItem {
  id: string;
  houseId: string;
  house: HouseDto;
  notificationEnabled: boolean;
  addedAt: Date;
}

/**
 * Lottery Participant Statistics
 * Statistics about participants in a lottery
 */
export interface LotteryParticipantStats {
  houseId: string;
  houseTitle: string;
  uniqueParticipants: number;
  totalTickets: number;
  maxParticipants?: number;
  isCapReached: boolean;
  remainingSlots?: number;
  lastEntryDate?: Date;
}

/**
 * Can Enter Lottery Response
 * Response indicating if user can enter a lottery
 */
export interface CanEnterLotteryResponse {
  canEnter: boolean;
  reason?: string;
  isExistingParticipant: boolean;
}

/**
 * Add to Watchlist Request
 * Request body for adding house to watchlist
 */
export interface AddToWatchlistRequest {
  notificationEnabled?: boolean;
}

/**
 * Toggle Notification Request
 * Request body for toggling notification for watchlist item
 */
export interface ToggleNotificationRequest {
  enabled: boolean;
}
















