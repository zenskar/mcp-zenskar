import type { CustomerDetailPayload } from '../types'

export const customerDetailFixture: CustomerDetailPayload = {
  customer: {
    id: 'c_001',
    name: 'ACME Corp',
    external_id: 'ACME-100',
    email: 'billing@acme.example',
    invoice_count: 4,
    mrr: { amount: 12450, currency: 'USD' },
    outstanding: { amount: 2400, currency: 'USD' },
    status: 'active',
    last_activity_at: '2026-05-04T10:30:00Z',
    created_at: '2024-11-02T08:00:00Z',
    phone: '+1 415 555 0101',
    business_entity_id: 'be_001',
    address: {
      line1: '500 Market St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      zipCode: '94105',
    },
    communications_enabled: true,
    auto_charge_enabled: true,
    custom_data: {
      account_manager: 'jane@zenskar.example',
      tier: 'enterprise',
    },
  },
}
