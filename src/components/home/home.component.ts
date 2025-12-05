import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { HouseGridComponent } from '../house-grid/house-grid.component';
import { StatsSectionComponent } from '../stats-section/stats-section.component';
import { HouseCarouselComponent } from '../house-carousel/house-carousel.component';
import { LotteryDashboardAccordionComponent } from '../lottery-dashboard-accordion/lottery-dashboard-accordion.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    HouseGridComponent,
    StatsSectionComponent,
    HouseCarouselComponent,
    LotteryDashboardAccordionComponent
  ],
  template: `
    <main role="main" id="main-content">
      <!-- Lottery Dashboard Accordion - Visible to all users -->
      <app-lottery-dashboard-accordion></app-lottery-dashboard-accordion>
      
      <app-hero-section></app-hero-section>
      <app-house-carousel></app-house-carousel>
      <app-stats-section></app-stats-section>
      <app-house-grid></app-house-grid>
    </main>
  `
})
export class HomeComponent {}
