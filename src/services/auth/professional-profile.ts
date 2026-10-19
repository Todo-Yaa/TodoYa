import { authenticatedApi } from './api';
export type ProfessionalSettings = {
  contextId: string; status: string; bio: string;
  experienceLevel: 'LESS_THAN_ONE_YEAR' | 'ONE_TO_THREE_YEARS' | 'MORE_THAN_THREE_YEARS' | null;
  trades: {id:string;code:string;name:string;active:boolean}[];
  verificationStatus: string;
};
type Context = {id:string;type:string;status:string};
export const listTrades = () => authenticatedApi<{id:string;code:string;name:string}[]>('/api/v1/contexts/trades/active');
export async function professionalContext(create = false): Promise<Context | null> {
  const contexts = await authenticatedApi<Context[]>('/api/v1/contexts');
  const exists = contexts.find(c => c.type === 'PROFESSIONAL');
  if (exists) return exists;
  return create ? authenticatedApi<Context>('/api/v1/contexts/professional', {}, 'POST') : null;
}
export async function getProfessionalSettings(): Promise<ProfessionalSettings | null> {
  const ctx = await professionalContext();
  return ctx ? authenticatedApi<ProfessionalSettings>(`/api/v1/contexts/${ctx.id}/professional-settings`) : null;
}
export async function saveProfessionalSettings(input: {bio:string;experienceLevel: NonNullable<ProfessionalSettings['experienceLevel']>;tradeIds:string[]}): Promise<ProfessionalSettings> {
  const ctx = await professionalContext(true);
  if (!ctx) throw new Error('No se pudo crear contexto profesional');
  return authenticatedApi<ProfessionalSettings>(`/api/v1/contexts/${ctx.id}/professional-settings`, input, 'PATCH');
}
