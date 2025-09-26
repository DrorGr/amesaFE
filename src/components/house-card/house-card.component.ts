import { Component, inject, input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House } from '../../models/house.model';
import { AuthService } from '../../services/auth.service';
import { LotteryService } from '../../services/lottery.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; overflow: visible; display: flex; flex-direction: column; width: 100%;" 
         [class.dark:bg-gray-800]="true">
      <div style="position: relative; height: 12rem; background: #e5e7eb; flex-shrink: 0;">
        <img 
          [src]="house().imageUrl" 
          [alt]="house().title"
          style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 1rem; right: 1rem;">
          <span style="background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <div style="padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; min-height: 0; overflow: visible;">
        <div style="flex-grow: 1; display: flex; flex-direction: column; min-height: 0; overflow: visible;">
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.4;">{{ translate('house.' + house().id + '.title') }}</h3>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.4;">{{ translate('house.' + house().id + '.description') }}</p>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; color: #6b7280; font-size: 0.875rem; min-width: 0; flex: 1; margin-right: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ translate('house.' + house().id + '.location') }}</span>
            </div>
            <div style="font-size: 1.125rem; font-weight: 700; color: #2563eb; flex-shrink: 0;">
              €{{ formatPrice(house().price) }}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">
            <span>{{ house().bedrooms }} {{ translate('house.bed') }}{{ house().bedrooms > 1 ? 's' : '' }}</span>
            <span>{{ house().bathrooms }} {{ translate('house.bath') }}{{ house().bathrooms > 1 ? 's' : '' }}</span>
            <span>{{ formatSqft(house().sqft) }} {{ translate('house.sqft') }}</span>
          </div>

          <div style="margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
              <span>{{ translate('house.ticketsSold') }}</span>
              <span>{{ house().soldTickets }}/{{ house().totalTickets }}</span>
            </div>
            <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 0.5rem;">
              <div 
                style="background: #2563eb; height: 0.5rem; border-radius: 9999px; transition: all 0.3s ease;"
                [style.width.%]="getTicketProgress()">
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 0.5rem;">
            <div style="font-size: 0.875rem; color: #6b7280;">{{ translate('house.lotteryEnds') }}</div>
            <div style="font-size: 1.125rem; font-weight: 700; color: #ea580c;">{{ getTimeRemaining() }}</div>
          </div>
        </div>

        <div style="margin-top: auto; flex-shrink: 0;">
          <ng-container *ngIf="currentUser(); else signInBlock">
            <button
              (click)="purchaseTicket()"
              [disabled]="isPurchasing || house().status !== 'active'"
              style="width: 100%; background: #2563eb; color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 500; transition: all 0.2s ease; border: none; cursor: pointer;"
              [style.background]="(isPurchasing || house().status !== 'active') ? '#9ca3af' : '#2563eb'"
              [style.cursor]="(isPurchasing || house().status !== 'active') ? 'not-allowed' : 'pointer'">
              <ng-container *ngIf="isPurchasing; else buyTicketBlock">
                {{ translate('house.processing') }}
              </ng-container>
              <ng-template #buyTicketBlock>
                {{ translate('house.buyTicket') }} - €{{ house().ticketPrice }}
              </ng-template>
            </button>
          </ng-container>
          <ng-template #signInBlock>
            <div style="text-align: center;">
              <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">{{ translate('house.signInToParticipate') }}</p>
              <div style="font-size: 1.125rem; font-weight: 500; color: #2563eb;">€{{ house().ticketPrice }} {{ translate('house.perTicket') }}</div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block !important;
      height: auto !important;
      width: 100% !important;
    }
    
    * {
      box-sizing: border-box !important;
    }
  `]
})
export class HouseCardComponent {
  private authService = inject(AuthService);
  private lotteryService = inject(LotteryService);
  private translationService = inject(TranslationService);
  
  house = input.required<House>();
  isPurchasing = false;
  
  currentUser = this.authService.getCurrentUser();

  formatPrice(price: number): string {
    return price.toLocaleString();
  }

  formatSqft(sqft: number): string {
    return sqft.toLocaleString();
  }

  getTicketProgress(): number {
    const house = this.house();
    return (house.soldTickets / house.totalTickets) * 100;
  }

  getStatusText(): string {
    const status = this.house().status;
    switch (status) {
      case 'active': return this.translate('house.active');
      case 'ended': return this.translate('house.ended');
      case 'upcoming': return this.translate('house.upcoming');
      default: return 'Unknown';
    }
  }

  getTimeRemaining(): string {
    const endDate = new Date(this.house().lotteryEndDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return this.translate('house.ended');
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  }

  async purchaseTicket() {
    if (!this.currentUser() || this.isPurchasing) {
      return;
    }

    this.isPurchasing = true;
    
    try {
      const success = await this.lotteryService.purchaseTicket(this.house().id);
      if (success) {
        console.log('Ticket purchased successfully!');
      } else {
        console.log('Failed to purchase ticket');
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
    } finally {
      this.isPurchasing = false;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}