import type { ProductTablePayload } from '../types';

export const productFixture: ProductTablePayload = {
  total: 8,
  cursor: { next: null, prev: null },
  products: [
    { id: 'p_001', name: 'Platform Subscription', external_id: 'SKU-PLAT-1', description: 'Core platform monthly seat', status: 'active', pricing_count: 3, created_at: '2024-09-12T08:00:00Z' },
    { id: 'p_002', name: 'API Requests', external_id: 'SKU-API-1', description: 'Metered API requests per 1k', status: 'active', pricing_count: 2, created_at: '2024-09-12T08:00:00Z' },
    { id: 'p_003', name: 'Data Storage', external_id: 'SKU-STORE-1', description: 'Per-GB monthly storage', status: 'active', pricing_count: 1, created_at: '2024-09-12T08:00:00Z' },
    { id: 'p_004', name: 'Premium Support', external_id: 'SKU-SUPP-PRE', description: '24/7 phone + chat support', status: 'active', pricing_count: 2, created_at: '2025-01-22T08:00:00Z' },
    { id: 'p_005', name: 'Single Sign-On', external_id: 'SKU-SSO', description: 'SAML/OIDC integration', status: 'active', pricing_count: 1, created_at: '2025-03-04T08:00:00Z' },
    { id: 'p_006', name: 'Audit Log Export', external_id: 'SKU-AUDIT', description: 'Daily audit log export to S3', status: 'beta', pricing_count: 1, created_at: '2026-02-10T08:00:00Z' },
    { id: 'p_007', name: 'Legacy Reporting', external_id: 'SKU-REP-LEG', description: 'Deprecated v1 reporting', status: 'sunset', pricing_count: 0, created_at: '2024-01-15T08:00:00Z' },
    { id: 'p_008', name: 'Custom Domain', external_id: 'SKU-DOMAIN', description: 'White-label custom domain', status: 'active', pricing_count: 1, created_at: '2025-08-01T08:00:00Z' },
  ],
};
