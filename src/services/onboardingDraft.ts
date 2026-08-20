import type { OnboardingProfileInput } from './profileService';

/**
 * Estado temporário do formulário de onboarding, em memória, enquanto o
 * usuário navega entre as telas de cadastro e permissão de notificações.
 * Não é persistido — só vira dado real ao final do onboarding.
 */
let draft: OnboardingProfileInput | null = null;

export const onboardingDraft = {
  set(value: OnboardingProfileInput) {
    draft = value;
  },
  get(): OnboardingProfileInput | null {
    return draft;
  },
  clear() {
    draft = null;
  },
};
