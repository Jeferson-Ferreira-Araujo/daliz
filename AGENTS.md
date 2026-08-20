# Instruções para agentes (Claude Code e afins)

## ⚠️ Expo muda rápido — sempre confira a doc versionada

Antes de escrever qualquer código que use uma API do Expo, confira a doc **da versão
instalada neste projeto**, não a doc genérica (que aponta pra versão mais recente do
Expo, quase sempre à frente da instalada aqui):

**SDK instalado: 54** → https://docs.expo.dev/versions/v54.0.0/

Confira em `package.json` (`"expo": "..."`) se esse número ainda bate antes de confiar
nele — se alguém atualizou o Expo desde a última vez que este arquivo foi editado, a URL
acima também precisa ser atualizada.

## Visão geral do projeto

App "Daliz" (Expo/React Native, 100% local, sem backend) — ver
[ARCHITECTURE.md](ARCHITECTURE.md) para a arquitetura completa e os conceitos do domínio
(geração contínua de ações, motor de seleção, timing, primeira ação, progressão, etc.).
Leia aquele arquivo antes de mexer em `engine/`, `services/`, ou `dayCycleService`.

## Como verificar uma mudança

1. **`npx tsc --noEmit`** sempre, depois de qualquer edição em `.ts`/`.tsx`.
2. **Preview web** (`Claude_Browser` tools, `preview_start` com o server `web` já
   configurado em `.claude/launch.json`) pra qualquer mudança visual/de fluxo — Expo Go
   e o preview web continuam funcionando normalmente mesmo com Firebase/AdMob instalados
   (ver "Módulos nativos" no ARCHITECTURE.md); não é preciso gerar build nativo pra
   testar UI/lógica do dia a dia.
3. **Modo Dev** (`/dev`, só em `__DEV__`) pra simular relógio, cenários, e inspecionar
   storage sem esperar o tempo real passar. Usar cenários prontos (`/dev/scenarios`)
   antes de construir dado manualmente.
4. **Build nativo real** (`eas build --profile preview`) só quando a mudança envolve
   código nativo de verdade (config plugin novo, versão de SDK nativo) — ver seção EAS
   abaixo. Não é o caminho padrão pra iterar.

## Convenções estabelecidas (não reinventar)

- **Comentários só quando explicam o porquê**, nunca o quê — o código já é descritivo.
  Ver qualquer arquivo em `src/engine`/`src/services` como referência de tom.
- **Campo novo em tipo existente = sempre opcional**, nunca migração em lote. Ler com
  `?? default` no ponto de uso, ou default centralizado em `normalizeProfile`
  (`profileRepository.ts`) quando o campo é do perfil.
- **Módulo nativo novo (Firebase, AdMob, etc.)**: sempre `require()` sob demanda,
  **pulado inteiramente no Expo Go** (checar `Constants.executionEnvironment ===
  ExecutionEnvironment.StoreClient` do `expo-constants` ANTES de chamar `require`), e só
  então `try/catch` como segunda camada — nunca `import` estático de um pacote nativo em
  arquivo importado por uma tela ativa. `try/catch` sozinho não basta: o Metro reporta
  falha de primeira avaliação de módulo como erro fatal global mesmo dentro de um
  `try/catch` (bug real já visto — ver ARCHITECTURE.md § "Limite do Expo Go"). Ver padrão
  completo em `analyticsService.ts`/`crashService.ts`. Se o módulo for visual e não tiver
  esse tipo de guarda pronto (ex: `BannerAd`), isolar num arquivo próprio e **não
  importar** até a hora de ativar de verdade.
- **`getCurrentDate()` (`src/utils/now.ts`), nunca `new Date()` direto** — é o que
  permite ao Modo Dev simular relógio.
- **`ErrorBoundary` (`src/components/ErrorBoundary.tsx`) não pode depender de contexto
  React** (useTheme, etc.) — ele fica fora do `ThemeProvider` na árvore, então o
  fallback precisa sobreviver mesmo sem nenhum provider por perto. Usar sempre
  `Text`/`Pressable`/`View` puros do RN ali, nunca `AppText`/`Button`.
- **Dev Mode reaproveita services/repositories de produção** (`src/dev/devService.ts`)
  — nunca duplica lógica de negócio só pra simular algo.
- **Filtro duro vs. bônus de pontuação**: campos como `momentos`/`tiposDia`/`contexto`/
  `relationships` em `Challenge` são filtros duros (excluem o candidato); `interests`/
  `weatherTags`/`seasonTags`/`eventTags` são só bônus de pontuação (nunca escondem uma
  ação por completo). Ao adicionar um campo novo de personalização, decidir
  explicitamente qual dos dois comportamentos ele deve ter.

## Build e distribuição (EAS)

- `npx eas-cli@latest build --platform android --profile preview` gera um APK instalável
  direto (sem loja) — usado pra testar em aparelho real.
- Projeto vinculado: `@jaraujodevelopers-team/melhorqueontem` (`app.json` →
  `extra.eas.projectId`). Rodar comandos `eas` sempre dentro da pasta do projeto
  (`um-porcento-melhor`), nunca na pasta pai.
- Erros de build do Gradle são genéricos no terminal ("Gradle build failed with unknown
  error") — o log de verdade fica em `eas-cli build:view <id> --json` → campo
  `logFiles[0]` (URL assinada do GCS, expira em ~15 min). O arquivo baixado vem
  comprimido em **Brotli**, não gzip — descomprimir com `zlib.brotliDecompressSync` (Node)
  antes de grepar por `FAILED`/`What went wrong`.
- Ver "Pegadinha resolvida: Kotlin do AdMob" no [ARCHITECTURE.md](ARCHITECTURE.md) antes
  de atualizar `react-native-google-mobile-ads` ou mexer em `kotlinVersion`.

## O que NÃO fazer sem confirmação explícita do usuário

- Trocar `AdBanner` (placeholder) por `AdBannerNative` (real) em `TabBar.tsx` — só na
  hora combinada de gerar a versão final de produção.
- Rodar `eas build --profile production` ou `eas submit` sem pedido explícito.
- Editar `node_modules/` diretamente (qualquer patch deveria ser via `patch-package`,
  hoje não configurado no projeto).
