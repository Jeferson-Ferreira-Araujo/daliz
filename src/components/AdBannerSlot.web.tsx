import React from 'react';
import { AdBanner } from './AdBanner';

// Versão web — o Metro escolhe este arquivo em vez de AdBannerSlot.tsx pra qualquer bundle de
// plataforma "web" (resolução por extensão de arquivo, antes de qualquer require/import ser
// avaliado). O SDK real do AdMob nunca roda no preview web, então nem vale a pena checar nada aqui.
export function AdBannerSlot() {
  return <AdBanner />;
}
