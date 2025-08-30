import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          @for (stat of stats; track stat.label) {
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {{ stat.value }}
              </div>
              <div class="text-gray-600 font-medium">
                {{ stat.label }}
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class StatsSectionComponent {
  stats = [
    { value: '142', label: 'Happy Winners' },
    { value: '$24M', label: 'Properties Won' },
    { value: '50+', label: 'Active Lotteries' },
    { value: '99.8%', label: 'Satisfaction Rate' }
  ];
}