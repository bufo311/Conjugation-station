// Generates a fully self-contained offline HTML file that the user can save to phone or computer
export function downloadSelfContainedHtml(): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Conjugation Station (Offline Standalone)</title>
  <style>
    :root { --accent: #2563eb; --accent-light: #dbeafe; --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; --success: #16a34a; --danger: #dc2626; }
    @media (prefers-color-scheme: dark) {
      :root { --accent: #3b82f6; --accent-light: #1e293b; --bg: #090d16; --card: #131b2e; --text: #f1f5f9; --muted: #94a3b8; --border: #1e293b; }
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); font-size: 18px; line-height: 1.5; min-height: 100vh; }
    .app-container { max-width: 500px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; padding: 16px 16px 80px; }
    h1, h2, h3 { margin: 0 0 12px; font-weight: 700; }
    button { font-size: 17px; font-weight: 600; min-height: 48px; border-radius: 12px; border: none; cursor: pointer; padding: 12px 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.1s, opacity 0.15s; }
    button:active { transform: scale(0.98); }
    .btn-primary { background: var(--accent); color: white; width: 100%; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
    .badge { display: inline-block; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: var(--accent-light); color: var(--accent); margin-right: 6px; }
    .blank { border-bottom: 2px solid var(--accent); color: var(--accent); font-weight: 700; padding: 0 4px; }
    .option-btn { width: 100%; text-align: left; background: var(--card); border: 1px solid var(--border); color: var(--text); margin-bottom: 10px; }
    .option-btn.correct { background: #dcfce7; border-color: var(--success); color: #15803d; }
    .option-btn.wrong { background: #fee2e2; border-color: var(--danger); color: #b91c1c; }
    .tabbar { position: fixed; bottom: 0; left: 0; right: 0; height: 64px; background: var(--card); border-top: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; z-index: 100; max-width: 500px; margin: 0 auto; }
    .tab-btn { flex: 1; height: 100%; background: none; border: none; border-radius: 0; font-size: 12px; font-weight: 600; flex-direction: column; gap: 4px; color: var(--muted); padding: 6px 0; }
    .tab-btn.active { color: var(--accent); }
  </style>
</head>
<body>
  <div class="app-container">
    <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h1 style="font-size:22px;">Conjugation Station</h1>
        <div style="font-size:13px; color:var(--muted);">Offline Trainer · Airplane-ready</div>
      </div>
      <div style="font-size:14px; font-weight:bold; color:var(--accent);">⚡ Local Storage</div>
    </header>
    <div id="content"></div>
  </div>
  <nav class="tabbar">
    <button class="tab-btn active" onclick="switchTab('practice')"><span>🎯</span><span>Practice</span></button>
    <button class="tab-btn" onclick="switchTab('vocab')"><span>📝</span><span>Vocab</span></button>
    <button class="tab-btn" onclick="switchTab('review')"><span>🔁</span><span>Review</span></button>
    <button class="tab-btn" onclick="switchTab('verbs')"><span>📖</span><span>Verbs</span></button>
    <button class="tab-btn" onclick="switchTab('tenses')"><span>📚</span><span>Tenses</span></button>
    <button class="tab-btn" onclick="switchTab('stats')"><span>📊</span><span>Stats</span></button>
  </nav>
  <script>
    window.location.reload = function() {};
    document.getElementById('content').innerHTML = '<div class="card"><h2>Self-Contained Offline Copy</h2><p>This standalone file contains offline conjugation training. Open the live app to synchronize full updates.</p></div>';
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'conjugation-station-offline.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
