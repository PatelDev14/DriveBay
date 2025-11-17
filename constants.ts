import { Listing, User, Booking } from './types';

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
};

export const DUMMY_LISTINGS: Listing[] = [
  {
    id: '1',
    ownerId: 'user-1',
    address: '123 Main St',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    rate: 5,
    date: '2024-09-20',
    startTime: '09:00',
    endTime: '17:00',
    contactEmail: 'owner1@example.com',
    description: 'Secure, covered parking spot. Perfect for commuters. 5-minute walk to the central train station.',
  },
  {
    id: '2',
    ownerId: 'user-2', // Belongs to another user
    address: '456 Oak Ave',
    city: 'Gotham',
    state: 'NJ',
    zipCode: '07001',
    country: 'USA',
    rate: 3.5,
    date: '2024-09-21',
    startTime: '10:00',
    endTime: '22:00',
    contactEmail: 'owner2@example.com',
    description: 'Spacious driveway with EV charging available (Level 2). Close to the Gotham Museum of Art.',
  },
];

export const DUMMY_BOOKINGS: Booking[] = [];