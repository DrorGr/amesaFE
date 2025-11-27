import { Component, input, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 text-sm">
      @if (timeRemaining().ended) {
        <span class="text-red-600 dark:text-red-400 font-semibold">
          Ended
        </span>
      } @else {
        <span class="text-gray-700 dark:text-gray-300">
          {{ timeRemaining().days }}d {{ timeRemaining().hours }}h {{ timeRemaining().minutes }}m
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  targetDate = input.required<Date | string>();
  translateFn = input<(key: string) => string>();
  
  timeRemaining = signal<{ days: number; hours: number; minutes: number; ended: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    ended: false
  });
  
  private intervalSubscription?: any;

  ngOnInit(): void {
    this.updateTimeRemaining();
    // Update every minute
    this.intervalSubscription = setInterval(() => {
      this.updateTimeRemaining();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalSubscription) {
      clearInterval(this.intervalSubscription);
    }
  }

  private updateTimeRemaining(): void {
    const targetDate = this.targetDate();
    const target = typeof targetDate === 'string' 
      ? new Date(targetDate) 
      : targetDate;
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      this.timeRemaining.set({ days: 0, hours: 0, minutes: 0, ended: true });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    this.timeRemaining.set({ days, hours, minutes, ended: false });
  }

  translate(key: string): string {
    const fn = this.translateFn();
    return fn ? fn(key) : key;
  }
}

