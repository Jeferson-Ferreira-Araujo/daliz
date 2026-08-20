@AGENTS.md

# Daliz

App de micro-ações diárias (Expo + TypeScript + React Native), 100% local — sem backend,
sem conta de usuário, sem rede social. Todo dia a pessoa recebe algumas notificações com
ações pequenas e contextualizadas (rotina, clima, pessoas importantes, interesses, datas
comemorativas), escolhidas por um motor de regras (não IA).

- **Arquitetura completa + conceitos do domínio**: [ARCHITECTURE.md](ARCHITECTURE.md) —
  leia antes de mexer em `src/engine/`, `src/services/`, ou no ciclo diário.
- **Convenções de trabalho, como verificar mudanças, build/EAS**: [AGENTS.md](AGENTS.md)
  (importado acima).

## Comandos do dia a dia

```bash
npm install
npx expo start              # dev server — Expo Go, preview web, ou dev client
npx tsc --noEmit             # typecheck, rodar depois de qualquer edição
```

## Onde cada coisa vive (visão rápida)

| Preciso mexer em... | Vai em... |
|---|---|
| Uma tela/rota | `app/` (Expo Router — nome do arquivo = rota) |
| Regra de quais ações aparecem, quando | `src/engine/ChallengeEngine.ts`, `dayModel.ts`, `scoring.ts` |
| Orquestração (o que acontece ao abrir o app, concluir uma ação) | `src/services/` |
| Um novo campo de dado persistido | `src/types/` + `src/storage/repositories/` |
| Um desafio novo ou ajuste na base | `src/data/challenges/` (ver `scripts/` pra geração em lote) |
| Componente visual reutilizável | `src/components/ui/` |
| Simular um cenário sem esperar tempo real passar | `/dev` (Modo Dev, só em `__DEV__`) |

## Nunca esquecer

- `getCurrentDate()` (não `new Date()`) — é o que faz o Modo Dev funcionar.
- Módulo nativo novo (Firebase, AdMob, etc.) precisa do padrão `require()` + `try/catch`
  pra não quebrar Expo Go/preview web — ver ARCHITECTURE.md § "Módulos nativos".
- `npx tsc --noEmit` limpo antes de considerar qualquer tarefa concluída.
