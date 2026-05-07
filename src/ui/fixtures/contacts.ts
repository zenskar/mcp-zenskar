import type { ContactTablePayload } from '../types';

export const contactFixture: ContactTablePayload = {
  total: 5,
  cursor: { next: null, prev: null },
  contacts: [
    { id: 'ct_001', name: 'Jane Doe', email: 'jane@acme.example', phone: '+1 415 555 0188', customer_id: 'c_001', role: 'AP Manager', created_at: '2024-11-02T08:00:00Z' },
    { id: 'ct_002', name: 'John Roe', email: 'john@acme.example', phone: null, customer_id: 'c_001', role: 'Procurement Lead', created_at: '2025-02-10T08:00:00Z' },
    { id: 'ct_003', name: 'Maria Garcia', email: 'maria@globex.example', phone: '+1 212 555 0123', customer_id: 'c_002', role: 'Finance Director', created_at: '2025-02-19T08:00:00Z' },
    { id: 'ct_004', name: 'Vikram Patel', email: 'vikram@initech.example', phone: '+1 214 555 0144', customer_id: 'c_003', role: 'Owner', created_at: '2025-04-22T08:00:00Z' },
    { id: 'ct_005', name: 'Sora Tanaka', email: null, phone: '+81 3 5555 0199', customer_id: 'c_010', role: 'AP Specialist', created_at: '2024-08-13T08:00:00Z' },
  ],
};
