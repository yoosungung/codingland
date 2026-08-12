# Extension DESIGN

`extension/` *내부* 설계. 컴포넌트 *간* 계약·스키마는 [ARCHITECTURE.md](../ARCHITECTURE.md). 마일스톤은 [ROADMAP.md](../ROADMAP.md).

## 레이아웃

| 경로 | 역할 |
|------|------|
| `core/` | 순수 TS (`vscode` import 금지). Graph·GraphStore·AST/KG·Debt·layout·Sanitizer·IsolatedRunner·Living Spec·ChangeScore·Gate |
| `host/` | VS Code 어댑터. Sidebar·Custom Editor·Panel·Beside·Time Bar·Hot Reboot·Workspace Ingest 스케줄·commands |

워크스페이스 루트는 `extension/package.json` (npm workspaces).

## M3 범위 (완료 기준)

- core: `computeChangeScore`(`sessionLoad` → tier 하향); Gate 세션(`none`/`light`/`full`); Walkthrough `queryGraphPath`; Consensus 없이 Pass 금지; `bypassAllowed`만 Bypass; `syncLivingSpec`; Bypass 커밋 태그; `HeuristicMirrorAdapter` + `runGateSmoke`
- ChangeScore **실험 기본값**(M3.1에서 고정 후보 문서화 — #544): severity = mean(entropy,coupling,criticality); sessionLoad≥0.7 → −0.25, ≥0.4 → −0.15; thresholds none<0.3 / light<0.6 / else full; `bypassAllowed` = criticality<0.7 or sessionLoad≥0.5 (attempt 횟수 비사용). Named constants in `changeScore.ts` (`SESSION_LOAD_PENALTY_*` 등)
- host: Sidebar Gate 패널; `codingland.triggerGate` 커맨드; Heuristic Mirror 어댑터 배선
- Jest: changeScore / gateSession / pathQuery / specSync / mirrorAdapter / gateSmoke / sanitize / cloudMirror

## M3.1 범위 (current)

- core: Sanitizer 단위/회귀 테스트 보강 (AST/이름 + depth≤3); `resolveMirrorAdapter` — 기본 **local**(Heuristic), `cloudOptIn`일 때만 Cloud 경로; Cloud 경로 입력은 Sanitizer 필수
- host: `codingland.mirror.cloudOptIn` (default `false`) + GateHost가 어댑터 선택
- ChangeScore/#544: 실험값을 ROADMAP·이 문서 확정 표의 **고정 후보**로 승격(최종 dogfood 확정은 M5+)
- **Non-goals**: 실클라우드 HTTP/API 키; 외부 Graphify CLI

외부 Graphify CLI는 여기 구현하지 않는다.

## M4 범위 (Workspace Ingest · TS/JS)

- core: 다파일 extract → GraphStore 병합(fingerprint·uriIndex); exclude 글롭 헬퍼
- host: `codingland.scanWorkspace`; 워크스페이스 열기 시 백그라운드 스캔 + Progress; `onDidSave`/FileSystemWatcher 증분; Canvas는 GraphStore 기반(샘플 없이도 표시)
- VSIX: host `.vscodeignore` + core 번들(또는 필요 산출만) — monorepo `../` vsce 실패 해소
- 샘플 `loadPaymentSample`은 회귀용 유지
- **Non-goals**: Python/Rust extract(M6); Marketplace

## M5 범위 (Daily Loop)

- host: Gate 훅 **SCM API** + 기존 커맨드; ChangeScore 입력을 diff·결합도 휴리스틱에서 산출(수동 fallback)
- Living Spec Sidebar UX (fingerprint ↔ `.codingland.md` / SpecSync)
- Mirror: **Ollama** 어댑터 + Heuristic fallback; 설정 `codingland.mirror.ollama*` (모델·엔드포인트는 구현 시 이 절에 기입)
- **Non-goals**: husky 필수화; Marketplace

## M6 범위 (Polyglot)

- core: Python·Rust extractor via **tree-sitter** 문법 패키지; TS/JS는 ts-morph 유지; 동일 GraphSnapshot 계약
- host: 언어별 include 글롭으로 부분 스캔 → 단일 GraphStore/Canvas
- **Non-goals**: 시선·hard TTD

## 확정

| 항목 | 선택 | 근거 |
|------|------|------|
| AST (M1) | **ts-morph** | TS/JS 심볼 해석 |
| AST (M6) | **tree-sitter** | Python/Rust; ROADMAP 제품화 |
| Runner (M2) | **in-process** | soft TTD=입력 재실행(ARCHITECTURE §1.4) |
| ChangeScore 가중치 (M3 실험→M3.1 후보) | equal mean + sessionLoad 하향 (mid −0.15) | #544; dogfood 후 최종 고정 |
| Gate 훅 | **SCM API + 커맨드** | ROADMAP 확정; husky 선택만 |
| Mirror 로컬 LLM | **Ollama** (실패 시 Heuristic) | ROADMAP 확정 |
| Ingest 감시 | Host `FileSystemWatcher`/`onDidSave` | ARCHITECTURE §1.14–15; Graphify-out 감시 아님 |

## 미결정 (이후)

- ChangeScore 최종 수치(#544 dogfood)
- Ollama 모델명·URL 기본값(M5 구현 시 기입)
- Leantime 동기화(ROADMAP 이후)

## Host 표면

| 표면 | contributes / 구현 |
|------|-------------------|
| Sidebar | `codingland.sidebar` WebviewView |
| Canvas | Custom Editor `codingland.canvas` — 경계 그래프 + Semantic Zoom + Time Bar |
| Panel | OutputChannel `Codingland` |
| Beside | `codingland.revealBeside` → `ViewColumn.Beside` (+ selection range) |
| Time Bar / Hot Reboot | scrub → `timeline.onChangeEnd`; button → `runner.hotReboot` |
| Sample | `codingland.loadPaymentSample` — fixture 그래프 → `graph.delta` (회귀) |
| Ingest (M4) | `codingland.scanWorkspace` + 열기 시 백그라운드 스캔 → GraphStore → `graph.delta` |
| Mirror Gate | `codingland.triggerGate` — ChangeScore→session→Sidebar/Panel; Heuristic / Ollama(M5) / Cloud opt-in |

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
(`codingland.scanWorkspace` 등 새 호스트 커맨드 npm 스크립트는 **구현 착수 시** 이 절에 추가한다.)
