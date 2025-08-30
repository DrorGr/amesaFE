import { Injectable, signal } from '@angular/core';
import { House } from '../models/house.model';

@Injectable({
  providedIn: 'root'
})
export class LotteryService {
  private houses = signal<House[]>([
    {
      id: '1',
      title: 'Modern Downtown Condo',
      description: 'Stunning 2-bedroom condo in the heart of downtown with city views and modern amenities.',
      price: 450000,
      location: 'Downtown, City Center',
      imageUrl: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      lotteryEndDate: new Date('2025-02-15'),
      totalTickets: 1000,
      soldTickets: 650,
      ticketPrice: 50,
      status: 'active'
    },
    {
      id: '2',
      title: 'Suburban Family Home',
      description: 'Beautiful 4-bedroom family home with large backyard and garage in quiet neighborhood.',
      price: 680000,
      location: 'Maple Heights Suburb',
      imageUrl: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      lotteryEndDate: new Date('2025-02-20'),
      totalTickets: 1500,
      soldTickets: 890,
      ticketPrice: 75,
      status: 'active'
    },
    {
      id: '3',
      title: 'Luxury Waterfront Villa',
      description: 'Exclusive waterfront villa with private beach access and panoramic ocean views.',
      price: 1200000,
      location: 'Oceanfront District',
      imageUrl: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg',
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3500,
      lotteryEndDate: new Date('2025-03-01'),
      totalTickets: 2000,
      soldTickets: 1245,
      ticketPrice: 100,
      status: 'active'
    }
  ]);

  getHouses() {
    return this.houses.asReadonly();
  }

  getHouseById(id: string): House | undefined {
    return this.houses().find(house => house.id === id);
  }

  purchaseTicket(houseId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const houses = this.houses();
        const houseIndex = houses.findIndex(h => h.id === houseId);
        if (houseIndex !== -1 && houses[houseIndex].soldTickets < houses[houseIndex].totalTickets) {
          const updatedHouses = [...houses];
          updatedHouses[houseIndex] = {
            ...updatedHouses[houseIndex],
            soldTickets: updatedHouses[houseIndex].soldTickets + 1
          };
          this.houses.set(updatedHouses);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }
}