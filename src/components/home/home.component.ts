import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { StatsSectionComponent } from '../stats-section/stats-section.component';
import { HouseCarouselComponent } from '../house-carousel/house-carousel.component';
import { LotteryDashboardAccordionComponent } from '../lottery-dashboard-accordion/lottery-dashboard-accordion.component';

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
    <main role="main" id="main-content" class="pt-32">
      <!-- Lottery Dashboard Accordion - Visible to all users, fixed position -->
      <app-lottery-dashboard-accordion></app-lottery-dashboard-accordion>
      
      <app-hero-section></app-hero-section>
      <app-house-carousel></app-house-carousel>
      <app-stats-section></app-stats-section>
    </main>
  `
})
export class HomeComponent {}
