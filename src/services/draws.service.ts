import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

/**
 * Lottery Draw DTO
 * Represents a lottery draw
 */
export interface LotteryDrawDto {
  id: string;
  houseId: string;
  houseTitle?: string;
  drawDate: Date | string;
  status: string; // 'scheduled', 'in_progress', 'completed', 'cancelled'
  winnerTicketId?: string;
  winnerUserId?: string;
  participantCount?: number;
  totalTickets?: number;
  createdAt: Date | string;
  conductedAt?: Date | string;
}

/**
 * Participant DTO
 * Represents a participant in a lottery draw
 */
export interface ParticipantDto {
  userId: string;
  ticketId: string;
  ticketNumber: string;
  purchaseDate: Date | string;
  houseId: string;
  houseTitle?: string;
}

/**
 * Conduct Draw Request
 * Request to conduct a lottery draw
 */
export interface ConductDrawRequest {
  winnerSelectionMethod?: string; // 'random', 'weighted', etc.
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DrawsService {
  private apiService = inject(ApiService);

  /**
   * Gets all lottery draws
   * GET /api/v1/draws
   */
  getDraws(filters?: {
    status?: string;
    houseId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<LotteryDrawDto[]> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.houseId) params.houseId = filters.houseId;
    if (filters?.startDate) params.startDate = filters.startDate.toISOString();
    if (filters?.endDate) params.endDate = filters.endDate.toISOString();

    return this.apiService.get<LotteryDrawDto[]>('draws', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch draws');
      }),
      catchError(error => {
        console.error('Error fetching draws:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets a specific draw by ID
   * GET /api/v1/draws/{id}
   */
  getDraw(id: string): Observable<LotteryDrawDto> {
    return this.apiService.get<LotteryDrawDto>(`draws/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch draw');
      }),
      catchError(error => {
        console.error('Error fetching draw:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets participants for a specific draw
   * GET /api/v1/draws/{id}/participants
   */
  getDrawParticipants(drawId: string): Observable<ParticipantDto[]> {
    return this.apiService.get<ParticipantDto[]>(`draws/${drawId}/participants`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch draw participants');
      }),
      catchError(error => {
        console.error('Error fetching draw participants:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets upcoming draws (scheduled status)
   * GET /api/v1/draws?status=scheduled
   */
  getUpcomingDraws(houseId?: string): Observable<LotteryDrawDto[]> {
    return this.getDraws({
      status: 'scheduled',
      houseId
    });
  }

  /**
   * Gets completed draws
   * GET /api/v1/draws?status=completed
   */
  getDrawHistory(houseId?: string, startDate?: Date, endDate?: Date): Observable<LotteryDrawDto[]> {
    return this.getDraws({
      status: 'completed',
      houseId,
      startDate,
      endDate
    });
  }

  /**
   * Gets draws in progress
   * GET /api/v1/draws?status=in_progress
   */
  getDrawsInProgress(houseId?: string): Observable<LotteryDrawDto[]> {
    return this.getDraws({
      status: 'in_progress',
      houseId
    });
  }

  /**
   * Conducts a draw (Admin only)
   * POST /api/v1/draws/{id}/conduct
   */
  conductDraw(drawId: string, request?: ConductDrawRequest): Observable<ApiResponse<any>> {
    return this.apiService.post<any>(`draws/${drawId}/conduct`, request || {}).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.error?.message || 'Failed to conduct draw');
      }),
      catchError(error => {
        console.error('Error conducting draw:', error);
        return throwError(() => error);
      })
    );
  }
}



