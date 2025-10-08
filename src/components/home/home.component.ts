import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { HouseGridComponent } from '../house-grid/house-grid.component';
import { StatsSectionComponent } from '../stats-section/stats-section.component';
import { HouseCarouselComponent } from '../house-carousel/house-carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    HouseGridComponent,
    StatsSectionComponent,
    HouseCarouselComponent
  ],
  template: `
    <main>
      <app-hero-section></app-hero-section>
      <app-house-carousel></app-house-carousel>
      <app-stats-section></app-stats-section>
      <app-house-grid></app-house-grid>
    </main>
  `
})
export class HomeComponent {}
