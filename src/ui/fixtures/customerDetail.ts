import type { CustomerDetailPayload } from '../types'

export const customerDetailFixture: CustomerDetailPayload = {
  customer: {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'ACME Corp',
    external_id: 'ACME-100',
    email: 'billing@acme.example',
    created_at: '2024-11-02T08:00:00Z',
    phone: '+1 415 555 0101',
    business_entity_id: '00000000-0000-0000-0000-000000000000',
    business_entity_name: 'Acme Inc.',
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
        name: 'Sam Carter',
        email: 'sam@acme.example',
        send_invoice: false,
        send_contract: false,
      },
      {
        name: 'Priya Rao',
        email: 'priya@acme.example',
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
