import type { CustomerDetailPayload } from '../types'

export const customerDetailFixture: CustomerDetailPayload = {
  customer: {
    id: 'b6c6d543-63c8-49d9-96a9-005fb8511b26',
    name: 'ACME Corp',
    external_id: 'ACME-100',
    email: 'billing@acme.example',
    created_at: '2024-11-02T08:00:00Z',
    phone: '+1 415 555 0101',
    business_entity_id: '2861f0d0-5553-4da7-bc01-a74b9ac749ea',
    business_entity_name: 'Zenskar Inc.',
    address: {
      line1: '500 Market St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      zipCode: '94105',
    },
    ship_to_address: {
      line1: '100 Warehouse Blvd',
      city: 'Oakland',
      state: 'CA',
      country: 'US',
      zipCode: '94607',
    },
    communications_enabled: true,
    auto_charge_enabled: true,
    custom_data: {
      account_manager: 'jane@zenskar.example',
      tier: 'enterprise',
    },
    tax_info: [{ country_code: 'USA', tax_code: 'TIN', tax_id: '545754' }],
    contacts: [
      {
        name: 'Shreyansh Tripathy',
        email: 'shreyansh@zenskar.com',
        send_invoice: false,
        send_contract: false,
      },
      {
        name: 'Ishpreet Vashist',
        email: 'ishpreet@zenskar.com',
        send_invoice: true,
        send_contract: false,
      },
    ],
    default_payment_method: {
      type: 'card',
      brand: 'visa',
      last4: '4242',
      connector_name: 'stripe',
    },
    updated_at: '2026-05-12T05:17:45.972566',
  },
}
