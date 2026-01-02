import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { StatsSectionComponent } from '../../../lottery/components/stats-section/stats-section.component';
import { HouseCarouselComponent } from '../../../lottery/components/house-carousel/house-carousel.component';
import { LotteryDashboardAccordionComponent } from '../../../lottery/components/lottery-dashboard-accordion/lottery-dashboard-accordion.component';
import { LotteryService } from '../../../lottery/services/lottery.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    StatsSectionComponent,
    HouseCarouselComponent,
    LotteryDashboardAccordionComponent
  ],
  template: `
    <main role="main" id="main-content">
      <!-- Lottery Dashboard Accordion - Visible to all users, fixed position -->
      <app-lottery-dashboard-accordion></app-lottery-dashboard-accordion>
      
      <app-hero-section></app-hero-section>
      <app-house-carousel></app-house-carousel>
      <app-stats-section></app-stats-section>
    </main>
  `
})
export class HomeComponent implements OnInit {
  private lotteryService = inject(LotteryService);
  
  ngOnInit(): void {
    // Load houses when home component initializes
    // This ensures houses are only loaded when needed
    this.lotteryService.ensureHousesLoaded();
  }
}
