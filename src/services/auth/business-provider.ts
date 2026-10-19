import { authenticatedApi } from './api';

export type BusinessProviderCategory = { id: string; code: string; name: string; kind: string };
export type BusinessProviderSettings = {
  businessContextId: string;
  providerContextId: string | null;
  status: string;
  contextStatus?: string;
  bio: string;
  coverage: 'LOCAL' | 'NATIONAL' | null;
  categoryIds: string[];
  categories: Array<{ id: string; code: string; name: string; active: boolean }>;
};
type ContextItem = { id: string; type: string; status: string };

/** Never use localStorage to authorize or select a business provider. */
export async function getBusinessContextId(): Promise<string> {
  const contexts = await authenticatedApi<ContextItem[]>('/api/v1/contexts');
  const businesses = contexts.filter(x => x.type === 'BUSINESS' && x.status !== 'ARCHIVED' && x.status !== 'SUSPENDED');
  if (businesses.length === 0) throw new Error('No existe una empresa autorizada');
  if (businesses.length > 1) throw new Error('Hay varias empresas. Selecciona una empresa explícitamente antes de editar el proveedor.');
  return businesses[0].id;
}
export const getBusinessCategories = () => authenticatedApi<BusinessProviderCategory[]>('/api/v1/contexts/business-provider/categories');
export async function getBusinessProviderSettings(businessContextId: string) {
  return authenticatedApi<BusinessProviderSettings>(`/api/v1/contexts/${encodeURIComponent(businessContextId)}/business-provider`);
}
export async function saveBusinessProviderSettings(businessContextId: string, body: { bio: string; coverage: 'LOCAL' | 'NATIONAL'; categoryIds: string[] }) {
  return authenticatedApi<BusinessProviderSettings>(`/api/v1/contexts/${encodeURIComponent(businessContextId)}/business-provider`, body, 'PATCH');
}
