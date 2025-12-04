/**
 * Test data factories for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!@#',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  },
  adminUser: {
    email: 'admin@amesa.com',
    password: 'Admin123!',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    username: 'invalid',
    firstName: 'Invalid',
    lastName: 'User'
  }
};

export function generateRandomUser(): TestUser {
  const random = Math.random().toString(36).substring(7);
  return {
    email: `test${random}@example.com`,
    password: 'Test123!@#',
    username: `testuser${random}`,
    firstName: 'Test',
    lastName: 'User'
  };
}



















