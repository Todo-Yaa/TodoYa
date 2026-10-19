import { supabase } from './supabase';
import { authenticatedApi } from './api';

export type Mode = 'PERSON' | 'BUSINESS';
export type ServerIdentity = {
  identity: {
    id: string;
    authUserId: string;
    email: string | null;
    givenNames: string | null;
    paternalSurname: string | null;
    ownedContexts: Array<{ id: string; type: string; status: string }>;
    businessMemberships: Array<{ contextId: string; role: string; status: string }>;
  };
  mode: Mode;
  businessContextId: string | null;
  availableModes?: Mode[];
};
export async function bootstrapAuthenticatedUser(requestedMode?: Mode): Promise<ServerIdentity> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) throw new Error('No se pudo comprobar la identidad de Supabase');
  const metadata = data.user.user_metadata ?? {};
  // The chosen login tab determines the requested mode; the backend verifies access.
  const mode: Mode = requestedMode ?? (metadata.registration_mode === 'BUSINESS' ? 'BUSINESS' : 'PERSON');
  const payload: Record<string, unknown> = {
    mode,
    fullName: typeof metadata.full_name === 'string' ? metadata.full_name : undefined,
    phone: typeof metadata.phone === 'string' ? metadata.phone : undefined,
  };
  if (mode === 'BUSINESS') {
    // Optional details are supplied only for first-time business registration.
    // Existing business owners/members can log in even if old metadata is missing.
    if (metadata.registration_mode === 'BUSINESS' && typeof metadata.business_name === 'string' && metadata.business_name.trim()) {
      Object.assign(payload, { businessName: metadata.business_name, ruc: metadata.ruc || undefined, billingEmail: metadata.billing_email || undefined, requestId: data.user.id });
    }
  }
  return authenticatedApi<ServerIdentity>('/api/v1/auth/bootstrap', payload);
}
