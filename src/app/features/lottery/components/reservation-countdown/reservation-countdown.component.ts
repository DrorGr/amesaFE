import { Component, inject, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeService } from '@core/services/realtime.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-reservation-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2" 
         role="timer" 
         [attr.aria-live]="timeRemaining().ended ? 'off' : 'polite'"
         [attr.aria-atomic]="true"
         [attr.aria-label]="getCountdownAriaLabel()">
      @if (timeRemaining().ended) {
        <span class="text-red-600 dark:text-red-400 font-semibold" role="status">
          Ended
        </span>
      } @else {
        <div class="flex items-center gap-1 text-sm md:text-base">
          @if (timeRemaining().days > 0) {
            <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-semibold"
                  [attr.aria-label]="timeRemaining().days + ' days'">
              {{ timeRemaining().days }}d
            </span>
          }
          @if (timeRemaining().hours > 0 || timeRemaining().days > 0) {
            <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded font-semibold"
                  [attr.aria-label]="timeRemaining().hours + ' hours'">
              {{ timeRemaining().hours }}h
            </span>
          }
          <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-semibold"
                [attr.aria-label]="timeRemaining().minutes + ' minutes'">
            {{ timeRemaining().minutes }}m
          </span>
          <span class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded font-semibold"
                [attr.aria-label]="timeRemaining().seconds + ' seconds'">
            {{ timeRemaining().seconds }}s
          </span>
        </div>
      }
    </div>
  `
})
export class ReservationCountdownComponent implements OnInit, OnDestroy {
  houseId = input.required<string>();
  targetDate = input<Date | string>();
  
  timeRemaining = signal<{ 
    days: number; 
    hours: number; 
    minutes: number; 
    seconds: number;
    ended: boolean;
    totalMilliseconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
    totalMilliseconds: 0
  });
  
  private subscription = new Subscription();
  private realtimeService = inject(RealtimeService);
  private intervalId?: any;
  
  ngOnInit(): void {
    if (this.targetDate()) {
      this.startCountdown(this.targetDate()!);
    }
    
    // Subscribe to real-time countdown updates
    this.setupRealtimeUpdates();
    
    // Update every second
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
  private startCountdown(target: Date | string): void {
    const targetDate = typeof target === 'string' ? new Date(target) : target;
    this.updateCountdownForDate(targetDate);
  }
  
  private setupRealtimeUpdates(): void {
    // Join lottery group for real-time updates
    this.realtimeService.ensureConnection().then(() => {
      this.realtimeService.joinLotteryGroup(this.houseId());
    });
    
    // Subscribe to countdown updates
    const sub = this.realtimeService.countdownUpdates$.subscribe(update => {
      if (update.houseId === this.houseId()) {
        this.timeRemaining.set({
          ...this.calculateTimeRemaining(update.timeRemaining),
          ended: update.isEnded
        });
      }
    });
    
    this.subscription.add(sub);
  }
  
  private updateCountdown(): void {
    const target = this.targetDate();
    if (target) {
      this.updateCountdownForDate(typeof target === 'string' ? new Date(target) : target);
    }
  }
  
  private updateCountdownForDate(targetDate: Date): void {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      this.timeRemaining.set({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        ended: true,
        totalMilliseconds: 0
      });
      return;
    }
    
    this.timeRemaining.set({
      ...this.calculateTimeRemaining(diff),
      ended: false
    });
  }
  
  private calculateTimeRemaining(milliseconds: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMilliseconds: number;
  } {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % 1000) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      totalMilliseconds: milliseconds
    };
  }

  getCountdownAriaLabel(): string {
    const time = this.timeRemaining();
    if (time.ended) {
      return 'Reservation countdown has ended';
    }
    const parts: string[] = [];
    if (time.days > 0) parts.push(`${time.days} day${time.days !== 1 ? 's' : ''}`);
    if (time.hours > 0) parts.push(`${time.hours} hour${time.hours !== 1 ? 's' : ''}`);
    if (time.minutes > 0) parts.push(`${time.minutes} minute${time.minutes !== 1 ? 's' : ''}`);
    if (time.seconds > 0) parts.push(`${time.seconds} second${time.seconds !== 1 ? 's' : ''}`);
    return `Time remaining: ${parts.join(', ')}`;
  }
}



