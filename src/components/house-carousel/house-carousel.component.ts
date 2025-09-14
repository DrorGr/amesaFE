import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';
import { LotteryService } from '../../services/lottery.service';

@Component({
  selector: 'app-house-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-4 transition-colors duration-300 relative">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="flex flex-col lg:flex-row items-stretch gap-8">
          <!-- Main House Image -->
          <div class="flex-1 max-w-2xl flex flex-col">
            <div>
              <img
                [src]="getCurrentHouseImage().url" 
                [alt]="getCurrentHouseImage().alt"
                class="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg">
            </div>
            
            <!-- Image Navigation Below Main Image -->
            <div class="flex flex-col items-center space-y-2 mt-4">
              <!-- Thumbnail Images -->
              <div class="flex space-x-2">
                @for (image of getCurrentHouse().images; track $index) {
                  <button 
                    (click)="goToHouseImage($index)"
                    class="w-12 h-8 rounded overflow-hidden border-2 transition-all hover:scale-105"
                    [class.border-blue-500]="currentHouseImageIndex === $index"
                    [class.border-gray-300]="currentHouseImageIndex !== $index"
                    [class.dark:border-blue-400]="currentHouseImageIndex === $index"
                    [class.dark:border-gray-600]="currentHouseImageIndex !== $index">
                    <img [src]="image.url" [alt]="image.alt" class="w-full h-full object-cover">
                  </button>
                }
              </div>
              <!-- Image Navigation Dots -->
              <div class="flex space-x-1">
                @for (image of getCurrentHouse().images; track $index) {
                  <button 
                    (click)="goToHouseImage($index)"
                    class="w-2 h-2 rounded-full transition-all hover:scale-125"
                    [class.bg-blue-500]="currentHouseImageIndex === $index"
                    [class.bg-gray-300]="currentHouseImageIndex !== $index"
                    [class.dark:bg-blue-400]="currentHouseImageIndex === $index"
                    [class.dark:bg-gray-600]="currentHouseImageIndex !== $index">
                  </button>
                }
              </div>
            </div>
          </div>
          
          <!-- Property Description and Lottery Info -->
          <div class="flex-1 max-w-md text-center lg:text-left flex flex-col justify-between h-full">
            <div>
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ getCurrentHouse().name }}
            </h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {{ getCurrentHouse().description }}
            </p>
            </div>
            
            <!-- Lottery Information -->
            <div class="space-y-4 flex-grow flex flex-col justify-center">
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Property Value</span>
                <span class="font-bold text-gray-900 dark:text-white">€{{ formatPrice(getCurrentHouse().price) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Ticket Price</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">€{{ getCurrentHouse().ticketPrice }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Tickets Sold</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ getCurrentHouse().soldTickets }}/{{ getCurrentHouse().totalTickets }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Draw Date</span>
                <span class="font-bold text-orange-600 dark:text-orange-400">{{ formatDate(getCurrentHouse().lotteryEndDate) }}</span>
              </div>
            
            <!-- Progress Bar -->
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{{ getTicketProgress() }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  class="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
                  [style.width.%]="getTicketProgress()">
                </div>
              </div>
            </div>
            
            <!-- Buy Ticket Button -->
            <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
              Buy Ticket - €{{ getCurrentHouse().ticketPrice }}
            </button>
            </div>
          </div>
        </div>
        
        <!-- House Navigation Dots at Footer -->
        <div class="flex justify-center space-x-3 mt-6">
          @for (house of houses; track house.id) {
            <button 
              (click)="goToSlide($index)"
              class="w-4 h-4 rounded-full transition-all hover:scale-125"
              [class.bg-blue-600]="currentSlide === $index"
              [class.bg-gray-300]="currentSlide !== $index"
              [class.dark:bg-blue-500]="currentSlide === $index"
              [class.dark:bg-gray-600]="currentSlide !== $index">
            </button>
          }
        </div>
      </div>
      
      <!-- Main Navigation Arrows - Outside Entire Component -->
      <button 
        (click)="previousSlide()"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg z-10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      <button 
        (click)="nextSlide()"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg z-10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </section>
  `
})
export class HouseCarouselComponent {
  private translationService = inject(TranslationService);
  private lotteryService = inject(LotteryService);
  
  currentSlide = 0;
  currentHouseImageIndex = 0;

  houses = [
    {
      id: 1,
      name: 'Modern Downtown Condo',
      description: 'Stunning 2-bedroom condo in the heart of downtown with city views and modern amenities. Perfect for urban professionals seeking luxury living.',
      price: 450000,
      ticketPrice: 50,
      totalTickets: 1000,
      soldTickets: 650,
      lotteryEndDate: new Date('2025-02-15'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
          alt: 'Modern downtown condo exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
          alt: 'Modern living room'
        },
        {
          url: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg',
          alt: 'Modern kitchen'
        },
        {
          url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg',
          alt: 'Modern bedroom'
        }
      ]
    },
    {
      id: 2,
      name: 'Suburban Family Home',
      description: 'Beautiful 4-bedroom family home with large backyard and garage in quiet neighborhood. Ideal for growing families.',
      price: 680000,
      ticketPrice: 75,
      totalTickets: 1500,
      soldTickets: 890,
      lotteryEndDate: new Date('2025-02-20'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
          alt: 'Suburban family home exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg',
          alt: 'Family living room'
        },
        {
          url: 'https://images.pexels.com/photos/1571457/pexels-photo-1571457.jpeg',
          alt: 'Family kitchen'
        },
        {
          url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg',
          alt: 'Family dining room'
        }
      ]
    },
    {
      id: 3,
      name: 'Luxury Waterfront Villa',
      description: 'Exclusive waterfront villa with private beach access and panoramic ocean views. The ultimate in luxury living.',
      price: 1200000,
      ticketPrice: 100,
      totalTickets: 2000,
      soldTickets: 1245,
      lotteryEndDate: new Date('2025-03-01'),
      images: [
        {
          url: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg',
          alt: 'Luxury waterfront villa exterior'
        },
        {
          url: 'https://images.pexels.com/photos/1571475/pexels-photo-1571475.jpeg',
          alt: 'Luxury living area'
        },
        {
          url: 'https://images.pexels.com/photos/1571477/pexels-photo-1571477.jpeg',
          alt: 'Luxury master bedroom'
        },
        {
          url: 'https://images.pexels.com/photos/1571479/pexels-photo-1571479.jpeg',
          alt: 'Luxury bathroom'
        }
      ]
    }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  getCurrentHouse() {
    return this.houses[this.currentSlide];
  }
  
  getCurrentHouseImage() {
    return this.getCurrentHouse().images[this.currentHouseImageIndex];
  }
  
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.houses.length;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
  }
  
  previousSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.houses.length - 1 : this.currentSlide - 1;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
  }
  
  goToSlide(index: number) {
    this.currentSlide = index;
    this.currentHouseImageIndex = 0; // Reset to first image when changing houses
  }
  
  nextHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = (this.currentHouseImageIndex + 1) % currentHouse.images.length;
  }
  
  previousHouseImage() {
    const currentHouse = this.getCurrentHouse();
    this.currentHouseImageIndex = this.currentHouseImageIndex === 0 
      ? currentHouse.images.length - 1 
      : this.currentHouseImageIndex - 1;
  }
  
  goToHouseImage(index: number) {
    this.currentHouseImageIndex = index;
  }
  
  formatPrice(price: number): string {
    return price.toLocaleString();
  }
  
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  getTicketProgress(): number {
    const house = this.getCurrentHouse();
    return Math.round((house.soldTickets / house.totalTickets) * 100);
  }
}