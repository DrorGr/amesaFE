/**
 * Test data for houses/lotteries
 */

export interface TestHouse {
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
}

export const testHouses = {
  sampleHouse1: {
    title: 'Beautiful Modern Home',
    description: 'A stunning modern home in the heart of the city',
    price: 500000,
    location: 'Test City',
    address: '123 Test Street',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500
  },
  sampleHouse2: {
    title: 'Luxury Villa',
    description: 'Spacious luxury villa with amazing views',
    price: 750000,
    location: 'Test City',
    address: '456 Test Avenue',
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2000
  }
};










