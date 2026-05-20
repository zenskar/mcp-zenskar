import type { PaymentMethodListPayload } from '../types'

export const paymentMethodFixture: PaymentMethodListPayload = {
  customer_id: 'c_001',
  total: 3,
  payment_methods: [
    {
      id: 'pm_001',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      exp_month: 11,
      exp_year: 2027,
      is_default: true,
      created_at: '2024-11-02T08:00:00Z',
      connector_name: null,
      status: null,
    },
    {
      id: 'pm_002',
      type: 'card',
      brand: 'Mastercard',
      last4: '5555',
      exp_month: 4,
      exp_year: 2026,
      is_default: false,
      created_at: '2025-03-12T08:00:00Z',
      connector_name: null,
      status: null,
    },
    {
      id: 'pm_003',
      type: 'us_bank_account',
      brand: 'Wells Fargo',
      last4: '6789',
      exp_month: null,
      exp_year: null,
      is_default: false,
      created_at: '2025-08-19T08:00:00Z',
      connector_name: null,
      status: null,
    },
  ],
}
