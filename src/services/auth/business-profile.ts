import { authenticatedApi } from './api';
export type BusinessSettings = {
  contextId: string; tradeName: string; legalName: string; taxCountryCode: string;
  taxId: string; activityType: string; industryLabel: string; billingEmail: string;
  commercialPhone: string; city: string; facebookUrl: string; instagramUrl: string;
  verificationStatus: string; canEditLegal: boolean;
};
type ContextSummary = { id: string; type: string; status: string };
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const contexts = await authenticatedApi<ContextSummary[]>('/api/v1/contexts');
  const business = contexts.find(c => c.type === 'BUSINESS');
  if (!business) throw new Error('No se encontró un contexto empresarial autorizado');
  return authenticatedApi<BusinessSettings>(`/api/v1/contexts/${business.id}/business-settings`);
}
export async function saveBusinessSettings(input: BusinessSettings): Promise<BusinessSettings> {
  const { contextId, verificationStatus, canEditLegal, ...values } = input;
  void verificationStatus;
  const payload = canEditLegal ? values : Object.fromEntries(Object.entries(values).filter(([k]) => !['legalName', 'taxCountryCode', 'taxId'].includes(k)));
  return authenticatedApi<BusinessSettings>(`/api/v1/contexts/${contextId}/business-settings`, payload, 'PATCH');
}
