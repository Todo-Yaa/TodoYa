import { authenticatedApi } from './api';

export type PersonalSettings = {
  contextId: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  languageCode: string;
  facebookUrl: string;
  instagramUrl: string;
  nameEditableAfter: string | null;
};
type ContextSummary = { id: string; type: string; status: string };
export async function getPersonalSettings(): Promise<PersonalSettings> {
  const contexts = await authenticatedApi<ContextSummary[]>('/api/v1/contexts');
  const personal = contexts.find(c => c.type === 'PERSONAL');
  if (!personal) throw new Error('No tienes un perfil personal habilitado');
  return authenticatedApi<PersonalSettings>(`/api/v1/contexts/${personal.id}/personal-settings`);
}
export async function savePersonalSettings(data: PersonalSettings): Promise<PersonalSettings> {
  const { contextId, nameEditableAfter, ...payload } = data;
  void nameEditableAfter;
  return authenticatedApi<PersonalSettings>(`/api/v1/contexts/${contextId}/personal-settings`, payload, 'PATCH');
}
