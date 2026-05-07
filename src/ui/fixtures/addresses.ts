import type { AddressListPayload } from '../types';

export const addressFixture: AddressListPayload = {
  customer_id: 'c_001',
  total: 3,
  addresses: [
    { id: 'addr_001', label: 'Headquarters', line1: '500 Market St', line2: 'Suite 1200', city: 'San Francisco', state: 'CA', zip_code: '94105', country: 'US', is_primary: true },
    { id: 'addr_002', label: 'NYC Office', line1: '350 5th Ave', line2: null, city: 'New York', state: 'NY', zip_code: '10118', country: 'US', is_primary: false },
    { id: 'addr_003', label: 'EU billing', line1: 'Spuistraat 12', line2: null, city: 'Amsterdam', state: null, zip_code: '1012 SZ', country: 'NL', is_primary: false },
  ],
};
