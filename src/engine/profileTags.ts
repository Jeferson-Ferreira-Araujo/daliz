import type { ProfileTag, UserProfile } from '@/types';

/**
 * Deriva os sinais de perfil (ver ProfileTag) usados por `Challenge.profile.required`/
 * `excluded`/`preferred` a partir dos campos já existentes de `UserProfile` — generaliza os
 * filtros pontuais legados (requerFamilia/requerTempoLivre/relationships/minAge/maxAge/
 * requiresPresence), que continuam valendo em paralelo enquanto o catálogo legado existir (ver
 * plano de migração seção 2.1).
 *
 * `works_from_home` e `has_car` não têm hoje nenhum campo correspondente em `UserProfile` — nunca
 * aparecem no conjunto retornado (nem `required` nem `excluded` desses dois filtram de verdade,
 * porque a ação nunca vai encontrar o tag no perfil). Dívida técnica documentada, não simulada.
 */
export function computeProfileTags(profile: UserProfile): Set<ProfileTag> {
  const tags = new Set<ProfileTag>();

  if (profile.importantPeople.some((person) => person.relationship === 'filho')) {
    tags.add('has_children');
  }
  if (profile.importantPeople.some((person) => ['companheiro', 'conjuge', 'namorado', 'noivo'].includes(person.relationship))) {
    tags.add('has_partner');
  }
  if (profile.isWorking) {
    tags.add('works');
  }
  if (profile.socialNetworks.length > 0 && !profile.socialNetworks.includes('nenhuma')) {
    tags.add('uses_social_media');
  }

  return tags;
}
