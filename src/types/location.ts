// Localização é opcional e propositalmente imprecisa — cidade, não endereço (ver
// onboarding e seção de privacidade do pedido). Usada só pra clima/estação/contexto,
// nunca pra rastreamento ou qualquer coisa mais fina que "em que cidade a pessoa está".
export interface UserLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}
