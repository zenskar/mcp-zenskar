import '../client/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '../client/Shell';
import { AddressList } from '../components/AddressList';
import type { AddressListPayload } from '../types';

const FALLBACK: AddressListPayload = { addresses: [], total: 0 };

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Shell<AddressListPayload>
        fallback={FALLBACK}
        readyMarker="address-list:mounted"
        render={(data) => <AddressList payload={data} />}
      />
    </StrictMode>
  );
}
