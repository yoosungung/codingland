# ARCHITECTURE.md

Codingland 컴포넌트 *간* 불변 계약과 인터페이스 형태. 마일스톤·제품 결정은 [ROADMAP.md](ROADMAP.md). Extension *내부*는 `extension/DESIGN.md`(코드 착수 시).

로컬 검토 반영: `docs/cognitive_review.md` (**우선**), `docs/design_review.md` (구현 실현성).  
**충돌 시 cognitive_review를 따른다.** design_review는 Beside·Delta·Replay·Sanitizer·core 분리 등 비충돌 항목만 채택.  
지식 그래프 **개념** 참고: [Graphify](https://wiki.askwho.net/wiki/engineering/ai-native-engineering/graphify-codebase-knowledge-graph) — 외부 서비스/CLI 연동 대상 아님.

## 1. 계약 (불변 규칙)

1. **목적.** AI 생성 코드에 대한 개발자의 인식적 부채(Epistemic Debt)를 줄이고, 검증된 이해를 팀 자산으로 남긴다.
2. **전달 형태.** Cursor/VS Code Extension. UI는 VS Code Native 표면과 Canvas Webview로 **분할**한다. 단일 Webview에 IDE 전체를 구겨 넣지 않는다.
3. **마이크로월드 + 공간 불변성.** 시각화 단위는 `Module` / `Class` / `Function` / object instance다. 기본 뷰는 고수준 경계만 보이고 세부는 Semantic Zoom으로만 연다. 줌·콜스택 변화 시 **랜드마크 상대 위치(Spatial Invariance)** 를 유지하고, **Mental-Map Preserving Layout**으로 위상 관계를 보존하며, 구조 변화는 **보간 애니메이션(morph)** 으로만 전환한다. 비활성 노드는 fade/collapse하되 좌표를 재배치하지 않는다.
4. **디버그 격리 = Deterministic Replay.** Isolated Debug Runner에서만 주입·재생한다. soft TTD는 VM 힙 롤백이 아니라 **순수/격리 대상에 대한 입력 재실행(Replay to breakpoint)** 이다. 외부 I/O는 Mock 레이어로 샌드박스한다. Hot Reboot = 러너 재시작 후 초기 체크포인트까지 고속 Replay.
5. **타임라인·IPC.** Canvas는 Local Snapshot Cache로 드래그 중 낙관 렌더하고 `onChangeEnd`에만 Runner와 동기화한다. Host↔Webview 그래프/스냅샷 교환은 **증분(Delta)** 이 기본이다. 전체 스냅샷은 세션 초기화 시에만 허용한다.
6. **적응형 게이트 마찰.** AI apply만으로 잠그지 않는다. Gate 엄격도는 변경 **복잡도·결합·중요도**와 **세션 인지 부하(직전 작업 시간·빈도)** 로 산출한 `ChangeScore`에 따라 `none` / `light` / `full`로 조절한다. 사소한 변경·고부하 세션에서는 게이트를 열지 않거나 단일 Confirm만 요구한다. **고정 N회 실패 후 Bypass 규칙은 쓰지 않는다.**
7. **동반자 = Spec 합의(Mirror).** Gate는 채점관이 아니다. AI Walkthrough → Steering → 인간 입력(멀티모달) → AI가 Living Spec 초안을 제시 → **인간 Confirm(합의)** 이 통과 조건이다. SOLO는 advisory(거울 질문용)일 뿐 Pass/Fail 권한이 없다.
8. **Sanitizer·로컬 모델.** Mirror/클라우드 입력·영속·텔레메트리는 **Sanitizer 필수** (AST/이름 패턴 + shallow depth≤3). DAP 원문 힙은 Runner 메모리에만. Mirror 초안 생성은 로컬 LLM 기본, 클라우드 옵트인.
9. **Bypass.** `full`에서 합의에 이르지 못하고 `ChangeScore`가 Bypass를 허용할 때만 Manual Bypass. 거부 시마다 **점진적 힌트**(관련 노드 강조)와 더 가벼운 modality(퀴즈·spatial)를 먼저 제시한다. Bypass는 로그·Debt `bypassed`·커밋/PR `[Bypassed Epistemic Debt]` 태그. **attempt===3 하드코딩 금지.**
10. **Living Spec.** 기본 sidecar `.codingland.md`. 매핑 키는 **AST fingerprint**. Rename/Delete 시 SpecSync.
11. **Simulation-to-Test.** 검증된 inject+경로는 Living Spec **BDD 시나리오**와 동일 `scenarioId`의 Jest와 1:1. 고아 Jest 금지.
12. **코드 reveal.** `ViewColumn.Beside` (Custom Editor를 코드 탭으로 교체하지 않음).
13. **순수 코어 분리.** AST·Sanitizer·Delta·마찰 점수·fingerprint·정적 KG는 `vscode.*` 비의존 패키지; Host는 어댑터만.
14. **지식 그래프 개념(Graphify에서 차용).** Codingland가 소유하는 정적 관계는 **호출·의존·포함** 그래프이며, 엣지에 **`extracted`(AST에서 확정) vs `inferred`(추론)** 구분을 둔다. Debt/`verified`에는 **extracted만** 집계한다. `path`/`query`식 부분그래프 탐색은 Walkthrough·ChangeScore **개념**으로 core에 구현한다. **외부 Graphify CLI·SaaS·Neo4j·원격 MCP·`graphify-out/` 파일 감시·`graph.html` 임베드는 통합 대상이 아니다.** 필요 시 tree-sitter 등 **라이브러리 패키지**를 `extension/core` 의존성으로만 넣는다 (프로세스 내).

## 2. 컴포넌트 경계

| 컴포넌트 | 책임 | 비책임 |
|----------|------|--------|
| Native Sidebar | Agent(Walkthrough/Steering/Mirror Spec), Tree, Debt Meter | 소스 편집, DAP 본체 |
| Custom Editor Webview (Canvas) | 그래프, Time Bar, Injector UI, Local Cache, **Mental-Map Preserving** layout | 파일 I/O, Mirror 호출 |
| Native TextEditor | 소스; Beside reveal/highlight | AST 엔진 |
| Native Panel | Mirror/Bypass/Sanitize/CLI 로그, Run 콘솔 | 합의 UX(Sidebar) |
| Extension Host (adapter) | vscode API, Enforcement 훅, SpecSync, message bridge | 순수 분석 로직 |
| Pure core (`extension/core`) | AST/KG map, fingerprint, edge confidence(`extracted`/`inferred`), path·subgraph query, Sanitizer, Delta, friction score, Spec draft helpers | vscode import; 외부 Graphify 서비스/CLI |
| Isolated Debug Runner | Replay 세션, Mock I/O, Snapshot(요약), State Inject | UI, Spec 기록 |
| SpecSync | fingerprint 매핑, rename/delete 사이드카 동기화 | Judge |

## 3. UI 표면 매핑

| 논리 영역 | 구현 표면 |
|-----------|-----------|
| A Agent & Architecture | Native Sidebar |
| B Microworld Canvas | Custom Editor Webview (+ Beside TextEditor) |
| C Code & Gate / Mirror | TextEditor + Sidebar(합의 UX) |
| Time-Control | Canvas 상단 Time Bar (+ Hot Reboot) |
| Telemetry | Native Panel |

## 4. 스키마 (컴포넌트 간)

### 4.1 Graph

```ts
type NodeKind = "module" | "class" | "function" | "object";
type VerifyState = "unverified" | "verified" | "bypassed";
type ZoomLevel = "boundary" | "function" | "detail";
/** Graphify EXTRACTED/INFERRED 개념. Debt 집계는 extracted만 */
type EdgeConfidence = "extracted" | "inferred";

interface GraphNode {
  id: string;
  fingerprint: string;      // AST signature hash — Living Spec 키
  kind: NodeKind;
  name: string;
  uri: string;
  range: { startLine: number; startCol: number; endLine: number; endCol: number };
  verifyState: VerifyState;
  confidence?: EdgeConfidence; // 기본 extracted
  parentId?: string;
  /** layout anchor — zoom 시 유지 */
  anchor?: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: "depends" | "calls" | "contains" | "references";
  confidence?: EdgeConfidence; // 기본 extracted
}

interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  zoomLevel: ZoomLevel;
}

/** 기본 IPC — 전체 GraphSnapshot 대체 */
interface GraphDelta {
  upsertNodes?: GraphNode[];
  removeNodeIds?: string[];
  upsertEdges?: GraphEdge[];
  removeEdgeIds?: string[];
  zoomLevel?: ZoomLevel;
}

/** Walkthrough/ChangeScore용 부분그래프 (Graphify path/query 개념, in-process) */
interface GraphPathQuery {
  fromFingerprint: string;
  toFingerprint: string;
}

interface GraphPathResult {
  nodeIds: string[];
  edgeIds: string[];
  /** extracted 경로만 기본; inferred 포함은 명시 옵트인 */
  confidence: EdgeConfidence;
}
```

### 4.2 Runtime / Timeline

```ts
interface RuntimeSnapshot {
  id: string;
  tMs: number;
  marker: "call" | "mutation" | "exception" | "checkpoint";
  callStackIds: string[];
  /** shallow ≤3, sanitized primitives only */
  objects: Array<{ id: string; typeName: string; fields: Record<string, string> }>;
}

interface StateInjectRequest {
  snapshotId: string;
  objectId: string;
  field: string;
  valueJson: string;
}

interface TimelineSync {
  type: "timeline.onChangeEnd";
  snapshotId: string;
}

interface ReplayRequest {
  entryFingerprint: string;
  inputsJson: string;       // sanitized
  breakFingerprint?: string;
}
```

### 4.3 Gate / Mirror

```ts
type FrictionTier = "none" | "light" | "full";
type SoloLevel = 1 | 2 | 3 | 4 | 5;

interface ChangeScore {
  entropy: number;      // 0..1 변경 복잡도
  coupling: number;     // 0..1
  criticality: number;  // 0..1
  /** 직전 작업 시간·게이트 빈도 기반 세션 부하 (cognitive: 피로도) */
  sessionLoad: number;  // 0..1 — 높을수록 tier 하향(none/light 선호)
  tier: FrictionTier;
  /** Bypass 허용 여부 — 고정 attempt 횟수가 아니라 score 정책으로 산출 */
  bypassAllowed: boolean;
}

interface GateTrigger {
  reason: "commit" | "test" | "verify";
  uris: string[];
  score: ChangeScore;
}

type TeachBackModality =
  | { kind: "text"; text: string }
  | { kind: "spatial"; orderedNodeIds: string[] }
  | { kind: "quiz"; answers: string[] }
  | { kind: "diagnostic"; finding: string };

interface TeachBackSubmission {
  modality: TeachBackModality;
  nodeFingerprints: string[];
  /** 텔레메트리용 시도 횟수 — Bypass 트리거로 사용하지 않음 */
  attempt: number;
}

interface MirrorDraft {
  livingSpecMarkdown: string;
  soloAdvisory?: SoloLevel; // Pass/Fail 권한 없음
  questions: string[];      // self-correction prompts
  hintNodeIds?: string[];
}

interface ConsensusResult {
  accepted: boolean;        // human confirmed MirrorDraft
  draft: MirrorDraft;
}

interface BypassRecord {
  fingerprints: string[];
  uris: string[];
  at: string;
  reason: string;
  tier: FrictionTier;
  score: ChangeScore;
}
```

### 4.4 Living Spec / Test Gen

```ts
interface LivingSpecArtifact {
  path: string;             // e.g. src/foo.ts.codingland.md
  fingerprints: string[];
  scenarios: Array<{
    scenarioId: string;
    bdd: string;            // human-readable
    jestPath?: string;      // 1:1 optional link
  }>;
  consensusAt: string;
}

interface SimulationTestArtifact {
  scenarioId: string;       // Living Spec과 동일
  path: string;
  sourceSnapshotId: string;
  injects: StateInjectRequest[];
}
```

### 4.5 Sanitizer

```ts
interface SanitizeOptions {
  maxDepth: 3;
  namePatterns: string[];   // password|token|secret|...
  astSensitiveParams: string[]; // from fingerprint params
}
```

## 5. 이벤트 (Host ↔ Webview / Runner)

| 이벤트 | 방향 | 페이로드 |
|--------|------|----------|
| `graph.full` | → Canvas | `GraphSnapshot` (세션 시작만) |
| `graph.delta` | → Canvas | `GraphDelta` |
| `graph.select` | ← Canvas | `{ nodeId }` |
| `graph.path.query` | ← Sidebar | `GraphPathQuery` |
| `graph.path.result` | → Sidebar/Canvas | `GraphPathResult` |
| `editor.revealBeside` | → Editor | `{ uri, range }` |
| `timeline.cache` | → Canvas | `RuntimeSnapshot[]` |
| `timeline.onChangeEnd` | ← Canvas | `TimelineSync` |
| `inject.request` | ← Canvas | `StateInjectRequest` |
| `replay.request` | → Runner | `ReplayRequest` |
| `runner.hotReboot` | ← Canvas | `{}` |
| `debt.updated` | → Sidebar | `{ unverified, verified, bypassed }` |
| `gate.trigger` | host | `GateTrigger` |
| `gate.walkthrough` | → Sidebar/Canvas | `{ fingerprints, summary }` |
| `gate.teachback` | ← Sidebar/Canvas | `TeachBackSubmission` |
| `gate.mirror` | → Sidebar | `MirrorDraft` |
| `gate.consensus` | ← Sidebar | `ConsensusResult` |
| `gate.bypass` | ← Sidebar | `BypassRecord` |
| `spec.written` | → Panel | `LivingSpecArtifact` |
| `test.generated` | → Panel | `SimulationTestArtifact` |

## 6. 보안 파이프라인

```text
Runner memory (raw, shallow candidates)
  → AST/name-pattern target + depth≤3 Sanitize
  → disk Snapshot | Panel | Judge/Mirror prompt | Living Spec
```

## 7. Gate 상태 (적응형 — cognitive 우선)

```text
Explore --ChangeScore(entropy,coupling,criticality,sessionLoad)-->
    tier none: stay Explore (Debt only)
    tier light: MirrorDraft confirm (single step)
    tier full: Walkthrough --> TeachBack(prefer non-text modality when sessionLoad high)
                   --> MirrorDraft --> Consensus
                   -->|reject + progressive hints| TeachBack (lighter modality)
                   -->|score.bypassAllowed| Bypassed
```

고정 `attempt >= 3` → Bypass 전이는 없다.