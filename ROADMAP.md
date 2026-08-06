# ROADMAP.md

수행 계획(마일스톤·확정 결정·미결정). 계약·스키마는 [ARCHITECTURE.md](ARCHITECTURE.md).

로컬 근거(gitignore): `docs/*_review.md`, `docs/other_perspectives.md`, `docs/UI_시나리오_초안.md`, PDF 명세.

## 현황

문서 확정. **검토 우선순위: cognitive_review > design_review**(충돌 시). Graphify는 **개념 차용**(외부 서비스 비대상).  
**M0 진행 중** — `extension/core` + `extension/host` stub. 상세: [`extension/DESIGN.md`](extension/DESIGN.md).

## 제품·확정 결정

인식적 부채를 줄이는 대화형 디버그 마이크로월드.  
Gate는 **채점이 아니라 Spec 합의(Mirror)**.  
형태: Extension — Native 분할 + Canvas; 코드 reveal는 **Beside**.

| 항목 | 선택 |
|------|------|
| 검토 우선 | **cognitive_review** (인지). design_review는 비충돌 실현성만 |
| UI | Sidebar + Custom Editor(Canvas) + TextEditor(**Beside**) + Panel |
| 패키지 | `extension/core`(vscode 비의존) + `extension/host`(어댑터) |
| 언어 | TS 확장 / 대상 TS·JS |
| MVP 순서 | 마이크로월드 → Replay·주입 → 적응형 Mirror Gate |
| 캔버스 | Semantic Zoom + Spatial Invariance + **Mental-Map Preserving Layout** + morph |
| soft TTD | Deterministic Replay + Mock I/O |
| IPC | GraphDelta 기본 |
| Sanitizer | AST/이름 + depth≤3 |
| 게이트 | Adaptive Friction `none`/`light`/`full` — **ChangeScore에 sessionLoad 포함** |
| Gate UX | Walkthrough → 멀티모달 Teach-back → MirrorDraft → **Consensus** |
| Teach-back | text + spatial + quiz + diagnostic; sessionLoad 높으면 비텍스트 우선 |
| Bypass | **고정 3회 실패 아님**; `bypassAllowed`(score 정책) + 점진 힌트 + PR 태그 |
| Living Spec | sidecar + fingerprint + SpecSync |
| 환류 | BDD ↔ Jest `scenarioId` 1:1 |
| Mirror 모델 | 로컬 LLM; SOLO advisory; 통과=인간 Confirm |
| CLI(인지부하) | 소프트웨어 텔레메트리 기본; 시선 M4+ |
| Graphify | **개념만** 차용(`extracted`/`inferred`, path/query). **외부 CLI·SaaS·파일 감시 비대상.** 필요 시 npm/라이브러리를 `extension/core`에 프로세스 내 의존 |

## 마일스톤

### M0 — Native 셸 + TDD 코어

- Sidebar + Custom Editor + Panel + Beside reveal stub
- Time Bar + Hot Reboot 자리
- **`extension/core` 분리** + Jest( VS Code 런타임 없이)로 Delta·fingerprint·protocol 단위 테스트
- `@vscode/test-electron`는 스모크만; `extension/DESIGN.md` + Commands
- **성공 기준**: core 테스트 1초대 통과; host는 어댑터만

### M1 — 마이크로월드 (시나리오 1)

- Module/Class 경계 + Semantic Zoom; **Mental-Map Preserving** 앵커·morph
- `graph.delta` IPC; fingerprint; **`EdgeConfidence` (extracted 기본)**; Debt stub
- 노드 선택 → `editor.revealBeside`
- core 내 AST/KG (필요 시 tree-sitter 등 **패키지** 의존)
- **성공 기준**: 샘플 결제 미들웨어에서 경계 그래프+줌인+Beside; 줌 시 랜드마크 점프 없음; Debt는 extracted만

### M2 — Replay 샌드박스 + 타임라인 + 환류 (시나리오 2)

- Isolated Runner: Replay + Mock I/O; Hot Reboot; shallow Sanitizer
- Living Spec BDD + Jest stub (`scenarioId`)
- **성공 기준**: 예외 직전 Replay+token 주입; Hot Reboot; BDD↔Jest 링크

### M3 — 적응형 Mirror Gate + Living Spec (시나리오 3)

- ChangeScore(`sessionLoad` 포함) → friction tier; apply 즉시 잠금 없음
- `full`: Walkthrough → 멀티모달 Teach-back → MirrorDraft → Consensus
- Walkthrough에 **in-process path/subgraph** 힌트 (개념상 Graphify path/query)
- 거부 시 점진 힌트·가벼운 modality; Bypass는 `bypassAllowed`만 (고정 3회 금지)
- SpecSync; PR/커밋 Bypass 태그
- **성공 기준**: `none`/`light`/`full` E2E; 합의 없이 Pass 없음; sessionLoad 높을 때 tier 하향 검증

### M3.1

- 클라우드 Mirror 옵트인; Sanitizer 테스트; friction/`sessionLoad` 가중치 튜닝

### M4+

- WebviewView(사이드 고정 캔버스) 옵션; PR Execution Path 리포트; CLI 스캐폴딩; 시선; 멀티언어; hard TTD

## 미결정

- ChangeScore 가중치·`sessionLoad` 산출식 (M3 실험 후 고정)
- 로컬 LLM 런타임: Ollama vs node-llama (`extension/DESIGN.md`)
- Gate 훅: SCM API vs husky (기본: SCM/커맨드 + 선택 husky)
- AST 구현: ts-morph vs tree-sitter 패키지 (`extension/DESIGN.md`)
- Leantime 동기화

## 범위

M0~M3 (M3.1 이어서). M4·시선 하드웨어·빈 k8s/CI stub 금지.  
**외부 Graphify 서비스·CLI·`graphify-out/` 연동은 범위 밖.**
