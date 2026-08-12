# Extension DESIGN

`extension/` *내부* 설계. 컴포넌트 *간* 계약·스키마는 [ARCHITECTURE.md](../ARCHITECTURE.md). 마일스톤은 [ROADMAP.md](../ROADMAP.md).

## 레이아웃

| 경로 | 역할 |
|------|------|
| `core/` | 순수 TS (`vscode` import 금지). Graph·AST/KG·Debt·layout·Sanitizer·IsolatedRunner·Living Spec·ChangeScore·Gate |
| `host/` | VS Code 어댑터. Sidebar·Custom Editor·Panel·Beside·Time Bar·Hot Reboot·commands |

워크스페이스 루트는 `extension/package.json` (npm workspaces).

## M3 범위 (이 문서 기준)

- core: `computeChangeScore`(`sessionLoad` → tier 하향); Gate 세션(`none`/`light`/`full`); Walkthrough `queryGraphPath`; Consensus 없이 Pass 금지; `bypassAllowed`만 Bypass; `syncLivingSpec`; Bypass 커밋 태그; `HeuristicMirrorAdapter` + `runGateSmoke`
- ChangeScore **실험 기본값**(ROADMAP 미결정 — M3 후 고정): severity = mean(entropy,coupling,criticality); sessionLoad≥0.7 → −0.25, ≥0.4 → −0.15; thresholds none<0.3 / light<0.6 / else full; `bypassAllowed` = criticality<0.7 or sessionLoad≥0.5 (attempt 횟수 비사용). Named constants in `changeScore.ts` (`SESSION_LOAD_PENALTY_*` 등)
- host: Sidebar Gate 패널; `codingland.triggerGate` 커맨드(기본 Gate 훅); Heuristic Mirror 어댑터 배선 (Ollama/node-llama 미결정 → heuristic 기본)
- Jest: changeScore / gateSession / pathQuery / specSync / mirrorAdapter / gateSmoke / sanitize / cloudMirror

## M3.1 범위 (이 문서 기준)

- core: Sanitizer 단위/회귀 테스트 보강 (AST/이름 + depth≤3); `resolveMirrorAdapter` — 기본 **local**(Heuristic), `cloudOptIn`일 때만 Cloud 경로; Cloud 경로 입력은 Sanitizer 필수
- host: `codingland.mirror.cloudOptIn` (default `false`) + GateHost가 어댑터 선택
- **Non-goals**: 실클라우드 HTTP/API 키; Ollama vs node-llama 최종 고착; ChangeScore 가중치 공식 고정(#544·ROADMAP 미결정); 외부 Graphify CLI

외부 Graphify CLI는 여기 구현하지 않는다.

## 확정

| 항목 | 선택 | 근거 |
|------|------|------|
| AST (M1) | **ts-morph** | TS/JS 심볼 해석; tree-sitter는 M4+ |
| Runner (M2) | **in-process** | soft TTD=입력 재실행(ARCHITECTURE §1.4); worker는 필요 시 M3+ |
| ChangeScore 가중치 (M3 실험) | equal mean + sessionLoad 하향 (mid −0.15) | ROADMAP 미결정; 실험 후 고정 (#544) |

## 미결정 (이후 마일스톤)

- 로컬 LLM 런타임: Ollama vs node-llama — M3 후반
- Gate 훅: SCM vs husky — M3 후반 (기본 SCM/커맨드)

## Host 표면

| 표면 | contributes / 구현 |
|------|-------------------|
| Sidebar | `codingland.sidebar` WebviewView |
| Canvas | Custom Editor `codingland.canvas` — 경계 그래프 + Semantic Zoom + Time Bar |
| Panel | OutputChannel `Codingland` |
| Beside | `codingland.revealBeside` → `ViewColumn.Beside` (+ selection range) |
| Time Bar / Hot Reboot | scrub → `timeline.onChangeEnd`; button → `runner.hotReboot` |
| Sample | `codingland.loadPaymentSample` — fixture 그래프 → `graph.delta` |
| Mirror Gate | `codingland.triggerGate` — ChangeScore→session→Sidebar/Panel; Heuristic Mirror (default) / Cloud opt-in via `codingland.mirror.cloudOptIn` |

## Commands

워크스페이스 루트(`extension/`)에서:

```bash
npm install          # workspaces: core + host
npm test             # core Jest
npm run compile -w codingland   # host tsc → out/
```

core만:

```bash
npm test -w @codingland/core
```

VS Code/Cursor에 로컬 로드·VSIX 설치: [`../deploy/README.md`](../deploy/README.md).
