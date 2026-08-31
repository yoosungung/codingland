import { ProtocolEvents } from "@codingland/core";

/** Canvas Custom Editor webview HTML (M2 Time Bar / zoom / graph). */
export function buildCanvasHtml(): string {
  const hotReboot = ProtocolEvents.RUNNER_HOT_REBOOT;
  const select = ProtocolEvents.GRAPH_SELECT;
  const delta = ProtocolEvents.GRAPH_DELTA;
  const timelineCache = ProtocolEvents.TIMELINE_CACHE;
  const timelineEnd = ProtocolEvents.TIMELINE_ON_CHANGE_END;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    body { margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; height: 100vh; }
    #time-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #time-bar input[type=range] { flex: 1; }
    #zoom { display: flex; gap: 6px; padding: 6px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #canvas { flex: 1; position: relative; overflow: auto; }
    .node {
      position: absolute;
      min-width: 100px;
      padding: 8px 10px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 12px;
      appearance: none;
      -webkit-appearance: none;
    }
    .node:hover { outline: 1px solid var(--vscode-focusBorder); }
    .kind { opacity: 0.7; font-size: 10px; color: var(--vscode-descriptionForeground, var(--vscode-foreground)); }
    button {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      color: var(--vscode-foreground);
      background: var(--vscode-button-secondaryBackground, var(--vscode-editorWidget-background));
      border: 1px solid var(--vscode-button-border, var(--vscode-panel-border));
      padding: 4px 8px;
    }
    button:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground)); }
  </style>
</head>
<body>
  <div id="time-bar" role="toolbar" aria-label="Time Bar">
    <span>Time Bar</span>
    <input id="scrub" type="range" min="0" max="0" value="0" aria-label="Timeline scrub" />
    <span id="scrub-label"></span>
    <button id="hot-reboot" type="button">Hot Reboot</button>
  </div>
  <div id="zoom" role="toolbar" aria-label="Semantic Zoom">
    <span>Zoom:</span>
    <button type="button" data-zoom="boundary">boundary</button>
    <button type="button" data-zoom="function">function</button>
    <button type="button" data-zoom="detail">detail</button>
    <span id="zoom-label"></span>
  </div>
  <div id="canvas" aria-label="Knowledge graph"></div>
  <script>
    const vscode = acquireVsCodeApi();
    let timeline = [];
    const scrub = document.getElementById('scrub');
    const scrubLabel = document.getElementById('scrub-label');
    function applyScrub() {
      const idx = Number(scrub.value) || 0;
      const snap = timeline[idx];
      scrubLabel.textContent = snap ? (snap.marker + ' @' + snap.tMs) : '';
      if (snap) {
        vscode.postMessage({ type: '${timelineEnd}', payload: { snapshotId: snap.id } });
      }
    }
    scrub.addEventListener('change', applyScrub);
    document.getElementById('hot-reboot').addEventListener('click', () => {
      vscode.postMessage({ type: '${hotReboot}', payload: {} });
    });
    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        vscode.postMessage({ type: 'canvas.zoom', payload: { zoomLevel: btn.getAttribute('data-zoom') } });
      });
    });
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === '${timelineCache}') {
        timeline = Array.isArray(msg.payload) ? msg.payload : [];
        scrub.max = Math.max(0, timeline.length - 1);
        scrub.value = scrub.max;
        applyScrub();
        return;
      }
      if (msg.type !== '${delta}') return;
      const payload = msg.payload || {};
      const canvas = document.getElementById('canvas');
      canvas.innerHTML = '';
      (payload.upsertNodes || []).forEach((n) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'node';
        el.style.left = ((n.anchor && n.anchor.x) || 0) + 'px';
        el.style.top = ((n.anchor && n.anchor.y) || 0) + 'px';
        const kind = document.createElement('div');
        kind.className = 'kind';
        kind.textContent = n.kind || '';
        const name = document.createElement('div');
        name.textContent = n.name || '';
        el.appendChild(kind);
        el.appendChild(name);
        el.addEventListener('click', () => {
          vscode.postMessage({ type: '${select}', payload: n });
        });
        canvas.appendChild(el);
      });
      document.getElementById('zoom-label').textContent =
        (payload.zoomLevel || '') + (payload.truncated ? ' (truncated)' : '');
    });
  </script>
</body>
</html>`;
}
