# ROADMAP.md

수행 계획(마일스톤·확정 결정·미결정). 계약·스키마는 [ARCHITECTURE.md](ARCHITECTURE.md).

로컬 근거(gitignore): `docs/*_review.md`, `docs/other_perspectives.md`, `docs/UI_시나리오_초안.md`, PDF 명세.

## 현황

문서 확정. **검토 우선순위: cognitive_review > design_review**(충돌 시). Graphify는 **개념 차용**(외부 서비스·외부 CLI·`graphify-out/` 감시 비대상; **자체** Workspace Ingest 감시는 허용 — [ARCHITECTURE](ARCHITECTURE.md) §1.14).  
**M0–M2 Done** (PR #1–#3). **M3 Done**(core/host Gate). **제품화 착수: M3.1 → M4–M7**(1차 Done = 내부 VSIX dogfood). 상세: [`extension/DESIGN.md`](extension/DESIGN.md).

## M2 — done

- [x] Isolated Runner: Replay + Mock I/O; Hot Reboot; shallow Sanitizer
- [x] Living Spec BDD + Jest stub (`scenarioId` 1:1)
- [x] 성공 기준: 예외 직전 Replay+token 주입; Hot Reboot; BDD↔Jest 링크

## M3 — done

- [x] ChangeScore(`sessionLoad` 포함) → friction tier; apply 즉시 잠금 없음
- [x] `full`: Walkthrough → 멀티모달 Teach-back → MirrorDraft → Consensus (core 세션)
- [x] Walkthrough in-process path/subgraph 힌트
- [x] 거부 시 점진 힌트·가벼운 modality; Bypass는 `bypassAllowed`만
- [x] SpecSync; PR/커밋 Bypass 태그 (core 헬퍼)
- [x] host Gate UI·Heuristic Mirror 어댑터·`runGateSmoke`/`codingland.triggerGate`

## 제품·확정 결정

인식적 부채를 줄이는 대화형 디버그 마이크로월드.  
Gate는 **채점이 아니라 Spec 합의(Mirror)**.  
형태: Extension — Native 분할 + Canvas; 코드 reveal는 **Beside**.  
**제품 대상**: 특정 repo 고정 없음 — **임의 Cursor 워크스페이스**. 언어 **TS/JS → Python → Rust**.  
**1차 제품 Done**: 내부/개인 **VSIX + 일상 dogfood** ([deploy/README.md](deploy/README.md)). Marketplace·공개 CI publish는 Done 밖.

| 항목 | 선택 |
|------|------|
| 검토 우선 | **cognitive_review** (인지). design_review는 비충돌 실현성만 |
| UI | Sidebar + Custom Editor(Canvas) + TextEditor(**Beside**) + Panel |
| 패키지 | `extension/core`(vscode 비의존) + `extension/host`(어댑터) |
| 언어 | 확장 TS; 대상 **TS/JS → Python → Rust** |
| MVP 순서 | 마이크로월드 → Replay·주입 → 적응형 Mirror Gate → **Ingest → Daily Loop → Polyglot → Hardening** |
| 캔버스 | Semantic Zoom + Spatial Invariance + **Mental-Map Preserving Layout** + morph |
| soft TTD | Deterministic Replay + Mock I/O |
| IPC | GraphDelta 기본 |
| Sanitizer | AST/이름 + depth≤3 |
| 게이트 | Adaptive Friction `none`/`light`/`full` — **ChangeScore에 sessionLoad 포함** |
| Gate 훅 | **SCM API + 커맨드** (husky는 선택 문서만) |
| Gate UX | Walkthrough → 멀티모달 Teach-back → MirrorDraft → **Consensus** |
| Teach-back | text + spatial + quiz + diagnostic; sessionLoad 높으면 비텍스트 우선 |
| Bypass | **고정 3회 실패 아님**; `bypassAllowed`(score 정책) + 점진 힌트 + PR 태그 |
| Living Spec | sidecar + fingerprint + SpecSync |
| 환류 | BDD ↔ Jest `scenarioId` 1:1 |
| Mirror 모델 | 로컬 LLM(**Ollama**, 실패 시 Heuristic); SOLO advisory; 통과=인간 Confirm |
| CLI(인지부하) | 소프트웨어 텔레메트리 기본; 시선은 이후 |
| Graphify | **개념만** 차용(`extracted`/`inferred`, path/query). **외부 CLI·SaaS·`graphify-out/` 파일 감시 비대상.** 자체 Workspace Ingest(FileSystemWatcher/`onDidSave`)는 허용. 필요 시 npm/라이브러리를 `extension/core`에 프로세스 내 의존 |
| AST | TS/JS = **ts-morph**; Python/Rust = **tree-sitter**(M6) |
| 배포 Done | **내부 VSIX dogfood** (Marketplace Non-goal until 이후) |

## 마일스톤

### M0 — Native 셸 + TDD 코어 — done

- Sidebar + Custom Editor + Panel + Beside reveal stub
- Time Bar + Hot Reboot 자리
- **`extension/core` 분리** + Jest( VS Code 런타임 없이)로 Delta·fingerprint·protocol 단위 테스트
- `@vscode/test-electron`는 스모크만; `extension/DESIGN.md` + Commands
- **성공 기준**: core 테스트 1초대 통과; host는 어댑터만

### M1 — 마이크로월드 (시나리오 1) — done

- Module/Class 경계 + Semantic Zoom; **Mental-Map Preserving** 앵커·morph
- `graph.delta` IPC; fingerprint; **`EdgeConfidence` (extracted 기본)**; Debt stub
- 노드 선택 → `editor.revealBeside`
- core 내 AST/KG (필요 시 tree-sitter 등 **패키지** 의존)
- **성공 기준**: 샘플 결제 미들웨어에서 경계 그래프+줌인+Beside; 줌 시 랜드마크 점프 없음; Debt는 extracted만

### M2 — Replay 샌드박스 + 타임라인 + 환류 (시나리오 2) — done

- Isolated Runner: Replay + Mock I/O; Hot Reboot; shallow Sanitizer
- Living Spec BDD + Jest stub (`scenarioId`)
- **성공 기준**: 예외 직전 Replay+token 주입; Hot Reboot; BDD↔Jest 링크

### M3 — 적응형 Mirror Gate + Living Spec (시나리오 3) — done

- ChangeScore(`sessionLoad` 포함) → friction tier; apply 즉시 잠금 없음
- `full`: Walkthrough → 멀티모달 Teach-back → MirrorDraft → Consensus
- Walkthrough에 **in-process path/subgraph** 힌트 (개념상 Graphify path/query)
- 거부 시 점진 힌트·가벼운 modality; Bypass는 `bypassAllowed`만 (고정 3회 금지)
- SpecSync; PR/커밋 Bypass 태그
- **성공 기준**: `none`/`light`/`full` E2E; 합의 없이 Pass 없음; sessionLoad 높을 때 tier 하향 검증

### M3.1 — Gate 안정화 — current

- ChangeScore/`sessionLoad` **실험값 → 고정 후보 문서화**(#544)
- Sanitizer 회귀 강화; `cloudOptIn` 경로 Sanitizer 필수(실클라우드 HTTP Non-goal)
- **성공 기준**: core 테스트 통과; Gate `none`/`light`/`full` 스모크가 문서 수치와 일치

### M4 — Workspace Ingest (TS/JS)

- `extension/core`: 다파일 extract + GraphStore 병합(fingerprint 키); exclude(`node_modules`, `dist`, `.git` 등)
- `extension/host`: `codingland.scanWorkspace` / 열기 시 백그라운드 스캔 + Progress; 저장·생성·삭제 **증분**; Canvas는 샘플 없이도 그래프
- 샘플 커맨드는 회귀용 유지
- VSIX: `.vscodeignore` + core 번들(또는 필요 파일만) → `cursor --install-extension` 성공
- **성공 기준**: 임의 TS/JS 워크스페이스에서 Open Canvas → 경계 그래프 + Beside; 저장 후 Delta; 외부 Graphify 없음

### M5 — Daily Loop (dogfood 루프)

- Gate: **SCM API**(커밋 전/검증 커맨드) 기본
- ChangeScore 입력을 **실제 diff·결합도 휴리스틱**에서 산출(수동 인자 fallback 유지)
- Living Spec: fingerprint ↔ `.codingland.md` / SpecSync를 Sidebar UX로
- Mirror: **Ollama** 어댑터(Heuristic fallback); `codingland.mirror.ollama*`
- **성공 기준**: VSIX 창에서 TS 하루 루프 — 스캔 → 편집 → Gate → Spec → Panel; 합의 없이 Pass 없음

### M6 — Polyglot Extract (Python, Rust)

- AST: TS/JS=ts-morph 유지; Py/Rust=**tree-sitter** 패키지를 core 의존
- 동일 GraphSnapshot/EdgeConfidence; 혼합 워크스페이스 단일 Canvas
- **성공 기준**: TS+Python+Rust 공존 그래프; Debt는 extracted만

### M7 — Product Hardening (1차 Done)

- dogfood 체크리스트([deploy/README.md](deploy/README.md)): 설치·스캔·Gate·Spec·언인스톨
- 성능 가드레일: 스캔 취소, 파일 수/타임아웃, Panel 진행 로그
- host 버전·CHANGELOG; 로컬 vsce 가능 상태 유지
- **성공 기준**: 문서만으로 다른 머신에 VSIX 설치·TS dogfood 가능. **Marketplace Non-goal**

### 이후 (1차 Done 밖)

- Marketplace/OIDC publish; 시선; hard TTD; 사이드 고정 WebviewView Canvas; PR Execution Path 리포트; CLI 스캐폴딩; Leantime 동기화
- 빈 k8s/CI stub 금지

## 미결정

- ChangeScore 가중치·`sessionLoad` 산출식의 **최종 고정값**(M3.1에서 후보 문서화 후 dogfood로 확정 — #544)
- Ollama 모델명·엔드포인트 기본값(M5 구현 시 DESIGN에 기입)
- Leantime 동기화(이후)

해소됨: Gate 훅=SCM+커맨드; Mirror=Ollama(+Heuristic); AST=ts-morph+tree-sitter(M6); 배포 Done=내부 VSIX; 파일럿 repo=없음.

## 범위

**M0–M7** (1차 제품 = M7 dogfood Done).  
시선 하드웨어·Marketplace·빈 k8s/CI stub 금지.  
**외부 Graphify 서비스·CLI·`graphify-out/` 연동은 범위 밖.** 자체 Workspace Ingest는 M4+ 범위 안.
