(() => {
  const startHidden=globalThis.__subtitleOverlayStartHidden===true;delete globalThis.__subtitleOverlayStartHidden;
  if (globalThis.__subtitleOverlay) { if(!startHidden)globalThis.__subtitleOverlay.show(); return; }
  const core = globalThis.SubtitleCore;
  const settingsCore=globalThis.SubtitleSettings;
  let sourceText='',savedSettings='',anchors=[],lastCueIndex=-1,lastSyncTime=null,savingPreset=false,localChoices=[];
  let cueWindowSource=null,cueWindowFilter=null,cueWindowStart=-1,cueWindowMatches=[];
  let observedVideo=null;
  let playerTracksSignature='',playerTrackBusy=false;
  let manualCueSelection=null;
  let controlElements=[],controlsChecked=-Infinity,controlsVideo=null,controlsPosition='',nativeControlsAt=-Infinity,nativePointerInside=false;
  let pageClock=null,clockToken='',clockBridgeError='';
  let clockSample=null,clockLastNative=null,clockTimelineElement=null,clockNeedsPosition=false,timelineElements=[],timelineChecked=-Infinity;
  const state = {cues: [], ends: [], delay: 0, rate: 1, size: 30, font: 'system-ui, sans-serif', shadow:true, shadowColor:'#000000', shadowOpacity:100, shadowBlur:3, shadowOffset:2, color: '#edf0fb', background: '#000000', opacity: 72, bottom: 10, horizontal:50,width:94,positionEdge:'bottom',avoidControls:true,align:'center',weight:600,italic:false,lineHeight:1.35,paddingX:12,paddingY:3.6,radius:5,shadowX:0,originalStyle:null,enabled: true, name: '', libraryId:null, browserFullscreen:false, video: null, href: location.href};
  const host = document.createElement('div'); host.id = 'subtitle-overlay-root'; host.dir='ltr'; host.lang='en';
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;direction:ltr!important;unicode-bidi:isolate!important;';
  const shadow = host.attachShadow({mode: 'open'});
  const saveIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 3h13l4 4v14H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></svg>';
  // Static markup only. Imported and downloaded strings always use textContent.
  shadow.innerHTML = `<style>
:host{color-scheme:dark;font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef5ff}*{box-sizing:border-box}[hidden]{display:none!important}#panel,#toggle,#captions{color-scheme:dark}button,input,select{font:inherit;color:inherit;min-width:0}button{cursor:pointer}#captions{position:fixed;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;padding:0 3%}#text{white-space:pre-line;unicode-bidi:plaintext;text-align:center;font-weight:600;line-height:1.35;max-width:100%;background:rgba(0,0,0,.72);padding:.12em .4em;border-radius:5px;text-shadow:0 2px 3px #000;overflow-wrap:anywhere;direction:ltr}#text:empty{display:none}#text.controls-motion{transition:bottom .16s ease-out}#toggle{position:fixed;top:20px;right:16px;width:38px;height:36px;pointer-events:auto;border:0;background:transparent;box-shadow:none;padding:5px;opacity:.8;display:grid;place-content:center}#toggle:hover{opacity:1}#toggle svg{width:24px;height:24px}#panel{position:fixed;right:16px;top:64px;width:384px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 80px);display:flex;flex-direction:column;overflow:hidden;background:#101d2e;border:1px solid #2c425b;border-radius:20px;box-shadow:0 20px 80px #0008;padding:0;pointer-events:auto;direction:ltr;text-align:left;font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef5ff}#panel header{display:flex;align-items:center;gap:10px;padding:15px 16px;border-bottom:1px solid #2c425b;background:linear-gradient(110deg,#142a43,#101d2e);flex:none}#panel header>svg{width:28px;height:28px;flex:none}h2{flex:1;margin:0;font-size:14px;line-height:1.3;font-weight:650;letter-spacing:-.25px}button{padding:9px 11px;min-height:38px;background:#17283c;border:1px solid #2c425b;border-radius:10px;transition:background .15s,border-color .15s}button:hover{background:#213952;border-color:#527696}button:active{background:#274562}button:disabled{opacity:.42;cursor:not-allowed}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,.file:focus-within{outline:2px solid #a8bdd0;outline-offset:3px}header button{display:grid;place-content:center;border:0;background:transparent;width:30px;height:30px;min-height:30px;padding:5px;flex:none}header button svg{width:18px;height:18px}header button:hover{background:#233b54}#panel .panel-workspace{display:grid;grid-template-columns:64px minmax(0,1fr);min-height:0;overflow:hidden}nav{display:flex;flex-direction:column;align-self:stretch;gap:8px;background:#0b1421;border-right:1px solid #2c425b;padding:14px 6px}nav button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:none;border:0;border-radius:12px;padding:11px 2px;min-height:61px;font-size:10px;font-weight:550;color:#a6b7cd}nav button svg{width:19px;height:19px;flex:none}nav button[aria-selected=true]{background:#1b3b59;color:#b6e2ff}nav button[aria-selected=true]::before{content:"";position:absolute;left:-6px;width:3px;height:22px;border-radius:0 2px 2px 0;background:#a8bdd0}.workspace-content{padding:16px;min-width:0;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#416181 transparent}.workspace-content::-webkit-scrollbar{width:5px}.workspace-content::-webkit-scrollbar-thumb{background:#416181;border-radius:6px}.view-heading{font-size:19px;font-weight:650;letter-spacing:-.55px;margin:0 0 13px;line-height:1.25}label{display:block;margin:10px 0 5px;font-size:11px;font-weight:550;color:#c5d3e5}input,select{display:block;width:100%;min-height:40px;background:#17283c;border:1px solid transparent;border-bottom-color:#527696;border-radius:8px;padding:9px 10px;margin-top:5px}input::placeholder{color:#9aaec6}input:focus,select:focus{border-color:#70b4e8}input:hover,select:hover{border-bottom-color:#80a8c7}input[type=checkbox]{appearance:auto;display:inline;width:15px;height:15px;min-height:0;margin:0;flex:none;accent-color:#a8bdd0}input[type=range]{min-height:24px;border:0;padding:0;accent-color:#a8bdd0;background:transparent}input[type=color]{height:40px;padding:4px}.hint{color:#a6b7cd;font-size:11px;line-height:1.5;margin:8px 0}.meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}.meta #videoStatus{margin:0;max-width:126px;font-size:10px;line-height:1.45}.meta #time{font:21px/1.1 ui-monospace,SFMono-Regular,Consolas,monospace;color:#b6e2ff;font-variant-numeric:tabular-nums;white-space:nowrap;letter-spacing:-1px}.track-row{display:flex;align-items:center;gap:6px;background:#14283d;border:1px solid #2c425b;border-radius:12px;padding:10px}.track-symbol{width:17px;height:17px;color:#a8bdd0;flex:none}#filename{flex:1;min-width:0;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d9e7f6;unicode-bidi:plaintext}#filename:hover{white-space:normal;overflow-wrap:anywhere}.track-row button{display:grid;place-content:center;width:32px;height:32px;min-height:32px;padding:5px;flex:none}.track-row button svg,.rating svg{display:block;width:18px;height:18px}#saveSubtitle[aria-pressed=true]{background:#1a4364;border-color:#a8bdd0}#broken:hover{color:#ffd0d0;border-color:#b87782}.enabled{display:flex;align-items:center;gap:9px;margin:13px 0;font-size:12px;font-weight:500}.timing-card{background:#14283d;border:1px solid #2c425b;border-radius:14px;padding:13px;margin-bottom:14px}.timing-header{display:flex;align-items:center;justify-content:space-between;gap:8px}.timing-header label{font-size:11px;color:#b6d3ef;margin:0}.timing-header #reset{border:0;background:none;padding:0 2px;font-size:10px;min-height:24px;color:#b6d3ef;text-decoration:underline;text-underline-offset:3px}.delay-row{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;gap:8px;margin:10px 0 8px}.delay-row button{display:grid;place-content:center;padding:0;width:36px;height:36px;min-height:36px;font-size:22px;font-weight:400}.delay-row input{font:29px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:-1px;text-align:center;padding:2px 0;margin:0;border:0;min-height:42px;background:none;color:#f3f8ff}.delay-row input::-webkit-inner-spin-button{appearance:none}.timing-card .hint{font-size:10px;margin:0;color:#a6b7cd;line-height:1.4}.row{display:flex;gap:8px;margin-top:9px}.row>*{flex:1;min-width:0}.grid{display:grid;grid-template-columns:minmax(0,1fr) 66px;gap:10px}.fields,.swatches{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.swatches input[type=color]{width:100%}.row #size{flex:1}.row #sizeNumber{flex:none;width:78px}.fields label,.swatches label{margin-top:8px}details{border:1px solid #2c425b;border-radius:12px;background:#132237;padding:0 12px;margin-top:8px}summary{display:flex;align-items:center;justify-content:space-between;gap:8px;list-style:none;cursor:pointer;min-height:43px;font-size:12px;font-weight:600}summary::-webkit-details-marker{display:none}summary::after{content:"+";color:#a8bdd0;font-size:17px;font-weight:400}details[open]{padding-bottom:12px}details[open]>summary::after{content:"−"}details[open]>summary{margin-bottom:4px}.section-icon{width:18px;height:18px;color:#a8bdd0;flex:none}summary .summary-label{flex:1}.shadow-options{background:#0f1c2d;margin-top:10px}.shadow-options summary{font-size:11px;min-height:37px}.shadow-options label{margin-top:7px}#sync,#pairSync button,#restorePlayerStyle,#remove,#refreshSaved,#importPlayerTrack,#refreshPlayerTracks,#saveSearchLink{width:100%;margin-top:9px}#sync,#syncSecond,#syncThird,#overlaySearchButton{background:#274c73;border-color:#438fc7;color:#fff;font-weight:600}#pairSync button{margin-top:8px}#anchorStatus{overflow-wrap:anywhere}#cues{unicode-bidi:plaintext;white-space:nowrap}#restorePlayerStyle{font-size:11px}.file{display:block;position:relative;border:1px dashed #527696;background:#14283d;border-radius:10px;padding:12px;cursor:pointer;overflow:hidden;font-size:12px;text-align:center;font-weight:550}.file input{position:absolute;inset:0;opacity:0;margin:0;padding:0;width:100%;height:100%;min-height:0;cursor:pointer}#message{font-size:11px;line-height:1.5;color:#a6d9fb;margin:14px 0 0;padding-top:11px;border-top:1px solid #2c425b;overflow-wrap:anywhere;unicode-bidi:isolate}#message.error{color:#ffc2ca}#videoStatus,#time{unicode-bidi:isolate}.search-method{display:flex;align-items:center;gap:12px;margin:11px 0 9px}.search-method label{flex:1;margin:0;color:#a6b7cd;font-weight:400}.search-method select{width:116px;min-height:32px;padding:5px 8px;font-size:11px;margin:0}#overlaySearchButton{width:100%;margin-top:9px;min-height:42px}#overlayResults{display:grid;gap:9px;margin-top:10px}.result{padding:12px;border:1px solid #2c425b;border-radius:12px;background:#17283c}.result strong{display:block;font-size:12px}.result small{display:block;color:#a6b7cd;font-size:10px;margin:5px 0 9px;overflow-wrap:anywhere}.result button{width:100%}.saved-track{display:flex;gap:5px;margin-top:9px}.saved-track .saved-name{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.saved-track .rating{display:grid;place-content:center;width:34px;min-height:38px;padding:7px;flex:none}.rating[aria-pressed=true]{background:#1a4364;border-color:#a8bdd0}#filmSuggestion{font-size:10px;border:0;padding:0;overflow-wrap:anywhere}#playerTracksSettings{background:transparent}#playerTrackCount{color:#a8bdd0;font-size:10px;margin-left:auto;padding-right:5px}@media(max-height:600px){#panel{top:52px;max-height:calc(100dvh - 64px)}#toggle{top:8px}}@media(max-width:420px){#panel{right:8px;max-width:calc(100vw - 16px)}.workspace-content{padding:12px}#panel .panel-workspace{grid-template-columns:58px minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){#text.controls-motion,button{transition:none}}

/* Muted marine/gold palette. Caption colors remain user settings. */
.saved-kind{display:flex;gap:4px;padding:4px;background:#102234;border-radius:10px;margin:0 0 14px}.saved-kind button{flex:1;min-height:34px;border:0;background:transparent;color:#b0c0d5;font-size:12px;padding:6px 8px}.saved-kind button[aria-pressed=true]{background:#294864;color:#e7edf3}.saved-episode-fields{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px}.saved-episode-fields>div{min-width:0}#view-find>#playerTracksSettings{margin:0 0 20px}#panel,#toggle{font-family:SubtitleOverlayInter,system-ui,sans-serif;font-optical-sizing:auto;font-feature-settings:"calt" 1}#panel{background:#172b41;color:#e7edf3;border-color:#40596f}#panel header{background:linear-gradient(110deg,#274c73,#172b41)}#panel h2,.view-heading{color:#e7edf3}#panel nav{background:#102234;border-color:#40596f}#panel nav button{font-size:11px}#panel nav button[aria-selected=true]{background:#294864;color:#dce4ec}#panel nav button[aria-selected=true]::before{background:#dce4ec}summary::after,.section-icon{color:#dce4ec}#panel button:focus-visible,#panel input:focus-visible,#panel select:focus-visible,#panel summary:focus-visible,#panel .file:focus-within{outline-color:#dce4ec}.track-row{background:#294863;border-color:#607b94;color:#e7edf3}#filename{color:#e7edf3}.track-symbol{color:#dce4ec}.track-row button{background:transparent;border-color:#90aecb;color:#e7edf3}.track-row button:hover{background:#365775;border-color:#c8d9ea}#saveSubtitle[aria-pressed=true]{background:#dce4ec;border-color:#dce4ec;color:#102234}.meta #time,.delay-row input{font-family:SubtitleOverlayInter,system-ui,sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1,"ss02" 1}.meta #time{color:#dce4ec}.delay-row input{color:#e7edf3}.timing-card{background:#1b324a;border-color:#40596f}#panel input:not([type=checkbox]):not([type=range]):not([type=color]),#panel select{background:#223b53;border-bottom-color:#7392b1}#panel .delay-row input{background:transparent;border:0}#panel details{background:#1b3048;border-color:#40596f}#panel .shadow-options{background:#172b41}#sync,#syncSecond,#syncThird,#overlaySearchButton{background:#274c73;border-color:#6d89a4}.rating[aria-pressed=true]{background:#dce4ec;border-color:#dce4ec;color:#102234}#filmSuggestion{color:#b0c0d5}
</style>
  <div id="captions" aria-hidden="true"><div id="text"></div></div>
  <button id="toggle" title="Subtitle controls (Alt+Shift+O)" aria-label="Toggle subtitle controls"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#274c73"/><path d="M34 32h60a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H62L38 106V92h-4a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10Z" fill="#f2f8fc"/><path d="M43 52h42M43 70h26" fill="none" stroke="#274c73" stroke-width="9" stroke-linecap="round"/></svg></button>
  <section id="panel" dir="ltr" lang="en" aria-label="Subtitle controls">
    <header><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" aria-hidden="true" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#274c73"/><path d="M34 32h60a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H62L38 106V92h-4a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10Z" fill="#f2f8fc"/><path d="M43 52h42M43 70h26" fill="none" stroke="#274c73" stroke-width="9" stroke-linecap="round"/></svg><h2>Subtitle Overlay</h2><button id="fullscreen" title="Full screen (F11)" aria-label="Toggle browser fullscreen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg></button><button id="close" title="Hide controls" aria-label="Hide subtitle controls"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20"/></svg></button></header>
    <div class="panel-workspace"><nav role="tablist" aria-label="Overlay tools" aria-orientation="vertical"><button id="tab-controls" role="tab" aria-controls="view-controls" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></svg><span>Controls</span></button><button id="tab-find" role="tab" aria-controls="view-find" aria-selected="false" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Find</span></button><button id="tab-saved" role="tab" aria-controls="view-saved" aria-selected="false" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h14v18l-7-4-7 4Z"/><path d="M9 7h6"/></svg><span>Saved</span></button></nav><div class="workspace-content">
    <div id="view-controls" role="tabpanel" aria-labelledby="tab-controls">
    <div class="meta"><p id="videoStatus" class="hint">Find video…</p><span id="time">00:00:00</span></div>
    <div class="track-row"><span class="track-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h4M9 14l3-3 3 3m-3-3v7"/></svg></span><span id="filename" dir="auto" title="Active subtitle file">No subtitle file</span><button id="saveSubtitle" title="Save subtitle and settings" aria-label="Save subtitle and settings" disabled>${saveIcon}</button><button id="broken" title="Delete this saved subtitle" aria-label="Subtitle doesn't work; delete it" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h9a3 3 0 0 1 3 3l-2 6H13v6a2 2 0 0 1-4 0l-1-6H4V4Z"/></svg></button></div>
    <label class="enabled"><input id="enabled" type="checkbox" checked>Show subtitles</label>
    <div class="timing-card"><div class="timing-header"><label for="delay">Delay (seconds)</label><button id="reset" title="Reset timing">Reset</button></div><div class="delay-row"><button id="earlier" title="Show subtitles 0.25 seconds earlier" aria-label="Show subtitles earlier">−</button><input id="delay" type="number" value="0" step="0.25" min="-86400" max="86400"><button id="later" title="Show subtitles 0.25 seconds later" aria-label="Show subtitles later">+</button></div>
    <p class="hint">A positive delay shows subtitles later.</p></div>
    <details id="syncSettings"><summary><span class="section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7a9 9 0 0 0-15-3L2 7m0-4v4h4M4 17a9 9 0 0 0 15 3l3-3m0 4v-4h-4"/></svg></span><span class="summary-label">Sentence sync</span></summary><label for="syncMode">Use</label><select id="syncMode"><option value="one">One sentence</option><option value="two">Two sentences</option><option value="three">Three sentences</option></select><p id="syncHint" class="hint">The current line is selected as the film plays. Pause when you hear a line start. Check the selected line, then click Sync.</p><label for="filter">Words you hear</label><input id="filter" placeholder="Enter part of the line" maxlength="200"><select id="cues" aria-label="Subtitle line to sync"></select><button id="sync">Sync to now</button><div id="pairSync" hidden><p id="anchorStatus" class="hint">No sync points set.</p><button id="markFirst">Set first point</button><button id="syncSecond" disabled>Sync second point</button><button id="syncThird" hidden disabled>Sync third point</button><button id="clearAnchors">Clear points</button></div></details>
    <details id="textSettings"><summary><span class="section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16M12 5v15M8 20h8M5 5v3m14-3v3"/></svg></span><span class="summary-label">Text style</span></summary><button id="restorePlayerStyle" disabled>Restore player style</button><p id="playerStyleHint" class="hint" hidden></p><div class="grid"><label>Font<select id="font"><option value="system-ui, sans-serif">System</option><option value="Arial, sans-serif">Arial</option><option value="Verdana, sans-serif">Verdana</option><option value="Tahoma, sans-serif">Tahoma</option><option value="Georgia, serif">Georgia</option><option value="'Courier New', monospace">Courier New</option></select></label><label>Color<input id="color" type="color" value="#edf0fb"></label></div><div class="fields"><label>Weight<input id="weight" type="number" min="100" max="900" step="100" value="600"></label><label class="enabled"><input id="italic" type="checkbox">Italic</label></div><div class="swatches"><label>Background<input id="backgroundColor" type="color" value="#000000" aria-label="Subtitle background color"></label><label>Opacity <span id="opacityLabel">72%</span><input id="backgroundOpacity" type="range" min="0" max="100" value="72" aria-label="Subtitle background opacity"></label></div><p class="hint">0% is clear. 100% is solid.</p><details id="shadowSettings" class="shadow-options"><summary>Shadow</summary><label class="enabled"><input id="shadowEnabled" type="checkbox" checked>Show shadow</label><div class="fields"><label>Color<input id="shadowColor" type="color" value="#000000"></label><label>Opacity<input id="shadowOpacity" type="range" min="0" max="100" value="100"></label><label>Blur (px)<input id="shadowBlur" type="number" min="0" max="20" value="3"></label><label>Offset (px)<input id="shadowOffset" type="number" min="-20" max="20" value="2"></label><label>Horizontal offset (px)<input id="shadowX" type="number" min="-20" max="20" value="0"></label></div></details><label>Size <span id="sizeLabel">30px</span></label><div class="row"><input id="size" type="range" min="12" max="96" value="30" aria-label="Subtitle size slider"><input id="sizeNumber" type="number" min="12" max="96" value="30" aria-label="Subtitle size in pixels"></div><details id="positionSettings" class="shadow-options"><summary>Position</summary><label class="enabled"><input id="avoidControls" type="checkbox" checked>Avoid player controls</label><div class="fields"><label>Edge<select id="positionEdge"><option value="bottom">Bottom</option><option value="top">Top</option></select></label><label>Text align<select id="align"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option><option value="start">Start</option><option value="end">End</option></select></label></div><label>Distance from edge <span id="bottomLabel">10%</span><input id="bottom" type="range" min="0" max="100" step="0.1" value="10"></label><label>Horizontal position<input id="horizontal" type="range" min="0" max="100" step="0.1" value="50"></label><label>Maximum width<input id="width" type="range" min="1" max="100" value="94"></label></details><details class="shadow-options"><summary>Spacing</summary><div class="fields"><label>Line height<input id="lineHeight" type="number" min="0.5" max="4" step="0.05" value="1.35"></label><label>Corner radius (px)<input id="radius" type="number" min="0" max="96" value="5"></label><label>Side padding (px)<input id="paddingX" type="number" min="0" max="96" step="0.1" value="12"></label><label>Vertical padding (px)<input id="paddingY" type="number" min="0" max="96" step="0.1" value="3.6"></label></div></details></details>
    <details id="advancedSettings"><summary><span class="section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#0d1827"/><circle cx="15" cy="17" r="3" fill="#0d1827"/></svg></span><span class="summary-label">More settings</span></summary><label for="rate">Timing scale (%)</label><input id="rate" type="number" value="100" step="0.1" min="50" max="200"><p class="hint">Use 100 for normal timing. Increase this if subtitles gradually appear too early.</p><label class="file">Load subtitle file<input id="file" type="file" accept=".srt,.vtt,.sub,.ass,.ssa,.zip,.gz"></label><select id="localTracks" aria-label="Choose a subtitle file from the archive" hidden></select><label>File encoding<select id="encoding"><option value="utf-8">Automatic (UTF-8 / UTF-16)</option><option value="windows-1256">Arabic (Windows-1256)</option><option value="windows-1252">Western (Windows-1252)</option><option value="utf-16le">UTF-16 LE</option></select></label><label for="fileFps">SUB FPS (if needed)</label><input id="fileFps" type="number" min="1" max="120" step=".001" placeholder="23.976"><p class="hint">Use the FPS listed for a frame-based SUB file.</p><p class="hint">Alt+Shift+O: show controls.<br>Alt+Shift+Left/Right: change delay.</p><button id="remove">Remove overlay</button></details>
    </div>
    <div id="view-find" role="tabpanel" aria-labelledby="tab-find" hidden><details id="playerTracksSettings"><summary>Player subtitles <span id="playerTrackCount">0</span></summary><label>Language<select id="playerLanguage" aria-label="Player subtitle language"><option value="*">All languages</option></select></label><label>Track<select id="playerTracks" aria-label="Subtitle track from this player"></select></label><p id="playerTracksHint" class="hint">No tracks exposed yet. Open the player subtitle menu. Tracks update automatically.</p><div class="row"><button id="importPlayerTrack" disabled>Import</button><button id="refreshPlayerTracks">Refresh</button></div><p class="hint">Import copies lines, readable text style, and position. Save keeps your changes.</p></details><h3 class="view-heading">Find subtitles</h3>

      <form id="overlaySearch"><label for="overlayQuery">Film or show</label><input id="overlayQuery" required maxlength="200" placeholder="Enter a film or show"><p id="filmSuggestion" class="hint" hidden></p><div class="fields"><label>Language<select id="overlayLanguage"><option value="af">Afrikaans</option><option value="sq">Albanian</option><option value="ar">Arabic</option><option value="eu">Basque</option><option value="bn">Bengali</option><option value="bs">Bosnian</option><option value="bg">Bulgarian</option><option value="ca">Catalan</option><option value="zh">Chinese</option><option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option value="en">English</option><option value="et">Estonian</option><option value="tl">Filipino</option><option value="fi">Finnish</option><option value="fr">French</option><option value="de">German</option><option value="el">Greek</option><option value="he">Hebrew</option><option value="hi">Hindi</option><option value="hu">Hungarian</option><option value="is">Icelandic</option><option value="id">Indonesian</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="lv">Latvian</option><option value="lt">Lithuanian</option><option value="mk">Macedonian</option><option value="ms">Malay</option><option value="ml">Malayalam</option><option value="no">Norwegian</option><option value="fa">Persian</option><option value="pl">Polish</option><option value="pt">Portuguese</option><option value="pt-br">Portuguese (Brazil)</option><option value="ro">Romanian</option><option value="ru">Russian</option><option value="sr">Serbian</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="es">Spanish</option><option value="sw">Swahili</option><option value="sv">Swedish</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="th">Thai</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="ur">Urdu</option><option value="vi">Vietnamese</option></select></label><label>Year (optional)<input id="overlayYear" type="number" min="1880" max="2199" placeholder="Year"></label></div><div class="search-method"><label for="overlaySearchMode">Search with</label><select id="overlaySearchMode"><option value="website">Website</option><option value="api">API</option></select></div><button id="overlaySearchButton" type="submit">Open OpenSubtitles</button></form>
      <p id="overlaySearchHint" class="hint">Website search needs no extension API key.</p><div id="overlayResults"></div>

      <details id="searchLinkSettings"><summary>Edit search link</summary><label for="overlaySearchUrl">Search URL</label><input id="overlaySearchUrl" type="url" maxlength="2000"><p class="hint">Use {title}, {language}, {language3}, and {year}.</p><button id="saveSearchLink">Save link</button></details>
    </div>
    <div id="view-saved" role="tabpanel" aria-labelledby="tab-saved" hidden><h3 class="view-heading">Saved subtitles</h3><div class="saved-kind" role="group" aria-label="Saved content"><button id="overlaySavedFilms" type="button" aria-pressed="true">Films (0)</button><button id="overlaySavedShows" type="button" aria-pressed="false">Shows (0)</button></div><div id="overlaySavedFilmField"><label for="overlaySavedFilm">Film</label><select id="overlaySavedFilm"></select></div><div id="overlaySavedShowFields" hidden><label for="overlaySavedShow">Show</label><select id="overlaySavedShow"></select><div class="saved-episode-fields"><div><label for="overlaySavedSeason">Season</label><select id="overlaySavedSeason"></select></div><div><label for="overlaySavedEpisode">Episode</label><select id="overlaySavedEpisode"></select></div></div></div><div id="overlayLibrary"></div><p id="savedHint" class="hint">No saved subtitles.</p><button id="refreshSaved">Refresh saved files</button></div>
    <p id="message" role="status" aria-live="polite">Load a file or find subtitles in the extension.</p></div></div>
  </section>`;
  const $ = id => shadow.getElementById(id);
  // Load a bundled UI font from the extension context. No remote font request.
  let uiFont=null;
  (async()=>{
    try{
      const response=await fetch(chrome.runtime.getURL('inter-variable.woff2'));
      if(!response.ok)return;
      const face=await new FontFace('SubtitleOverlayInter',await response.arrayBuffer(),{weight:'100 900',style:'normal',display:'swap'}).load();
      if(!host.isConnected)return;
      document.fonts.add(face);uiFont=face;
    }catch{ /* Keep a readable system fallback if the local font cannot load. */ }
  })();

  $('panel').hidden=startHidden;
  const playerTracks=globalThis.SubtitlePlayerTracks?.create({getVideo:()=>state.video,getTime:()=>playbackTime(),core,onChange:scheduleDiscovery});
  function refreshPlayerTracks(force=false) {
    const tracks=playerTracks?.list() || [],signature=JSON.stringify(tracks);
    if(!force && signature===playerTracksSignature)return tracks;
    const changed=signature!==playerTracksSignature;playerTracksSignature=signature;if(changed)chrome.runtime.sendMessage({type:'PLAYER_TRACKS_CHANGED'}).catch(()=>{});const grouped=globalThis.SubtitlePlayerTracks.renderOptions(tracks,$('playerTracks'),$('playerLanguage'));
    $('playerTrackCount').textContent=String(tracks.length);$('playerTracks').disabled=!tracks.length;
    $('importPlayerTrack').disabled=playerTrackBusy || !grouped.visible.length;
    $('playerTracksHint').textContent=tracks.length ? grouped.languages+' languages. Select a track, then Import.' : 'No tracks exposed yet. Open the player subtitle menu. Tracks update automatically.';
    return tracks;
  }
  async function playerTrackAction(action,id) {
    if(!playerTracks)throw new Error('Reload the extension and film tab first.');
    if(playerTrackBusy)throw new Error('Wait for the current track to load.');
    playerTrackBusy=true;
    try {
    if(action==='import'){
      const snapshot=await playerTracks.read(id);load(snapshot.text,snapshot.name);
      if(snapshot.style){applySettings({...currentSettings(),...snapshot.style,originalStyle:settingsCore.appearance({...currentSettings(),...snapshot.style})});}
      playerTracks.hide();
      state.enabled=true;$('enabled').checked=true;if(snapshot.language)setLanguage(snapshot.language);
      message(snapshot.count+' loaded lines imported. '+(snapshot.styleSource==='player' ? 'Player text style and position copied.' : snapshot.styleSource==='position' ? 'Position copied. Player font style is not readable.' : 'Player style is not readable. Current text style kept.')+' Change timing or style, then Save.');
    }else throw new Error('Choose Import.');
    show();refreshPlayerTracks(true);draw();return {count:state.cues.length,tracks:playerTracks.list()};
    } finally {playerTrackBusy=false;refreshPlayerTracks(true);}
  }
  for(const [id,action] of [['importPlayerTrack','import']])$(id).onclick=event=>{if(event.isTrusted)task($(id),()=>playerTrackAction(action,$('playerTracks').value));};
  $('playerLanguage').onchange=()=>refreshPlayerTracks(true);
  $('refreshPlayerTracks').onclick=event=>{if(event.isTrusted){discover();document.dispatchEvent(new Event('subtitle-overlay-sources-refresh'));refreshPlayerTracks(true);}};
  // Native details groups keep one settings section open at a time.
  for (const id of ['syncSettings', 'textSettings', 'advancedSettings']) $(id).name = 'subtitle-settings';
  function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }

  for(const id of ['fullscreen','close']) $(id).querySelector('svg').style.cssText='width:18px;height:18px;';
  let savedEntries=[],filmIdentity='',committedFilm=null,pendingFilmIdentity='',routeRevision=0;
  const filmName=value=>String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const filmRank=film=>['Tab title','Page title','Visible title','Page metadata','Player metadata'].indexOf(film?.source);
  function retainFilm(film){
    if(committedFilm?.showTitle && film && !film.showTitle && filmName(film.title)===filmName(committedFilm.showTitle))return {...committedFilm,source:film.source};
    if(committedFilm && (!film || state.video?.seeking || state.cues.length && filmRank(film)<filmRank(committedFilm)))return committedFilm;
    return committedFilm && film && filmName(film.title)===filmName(committedFilm.title) && !film.year ? {...film,year:committedFilm.year} : film;
  }
  function identityOf(film){return location.href+'|'+filmName(film?.showTitle ? film.showTitle+' S'+film.season+'E'+film.episode : film?.title)+'|'+(film?.showTitle ? '' : film?.year || '');}
  function currentFilmIdentity(){return identityOf(location.href===state.href ? retainFilm(globalThis.SubtitleFilm?.detect()) : globalThis.SubtitleFilm?.detect());}
  const views=['controls','find','saved'];
  async function rpc(type, data={}) {
    const result=await chrome.runtime.sendMessage({type,...data});
    if(!result?.ok) throw new Error(result?.error || 'Reload the extension and the film tab.');
    return result;
  }
  async function task(button,action) {
    if(button.disabled) return;button.disabled=true;
    try{await action();}catch(error){message(error.message,true);}finally{button.disabled=false;}
  }
  function view(name, focus=false, refresh=true) {
    routeRevision++;
    for(const current of views) {
      const selected=current===name;$('view-'+current).hidden=!selected;
      $('tab-'+current).setAttribute('aria-selected',String(selected));$('tab-'+current).tabIndex=selected ? 0 : -1;
    }
    shadow.querySelector('.workspace-content').scrollTop=0;
    if(focus) $('tab-'+name).focus();
    if(name==='saved' && refresh) refreshSaved().catch(error=>message(error.message,true));
  }
  for(const [index,name] of views.entries()) {
    $('tab-'+name).onclick=event=>{if(event.isTrusted)view(name);};
    $('tab-'+name).onkeydown=event=>{
      if(!event.isTrusted)return;let next;
      if(event.key==='ArrowRight' || event.key==='ArrowDown')next=(index+1)%views.length;
      if(event.key==='ArrowLeft' || event.key==='ArrowUp')next=(index+views.length-1)%views.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=views.length-1;
      if(next!==undefined){event.preventDefault();view(views[next],true);}
    };
  }
  function setLanguage(value){const select=$('overlayLanguage'),code=String(value || 'en').toLowerCase();if(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(code) && !Array.from(select.options).some(item=>item.value===code)){const option=document.createElement('option');option.value=code;option.textContent=code;select.append(option);}select.value=code;if(!select.value)select.value='en';}
  setLanguage('en');
  const query=()=>({query:$('overlayQuery').value,language:$('overlayLanguage').value,year:$('overlayYear').value,mode:$('overlaySearchMode').value});
  function searchMode() {
    const api=$('overlaySearchMode').value==='api';
    $('overlaySearchButton').textContent=api ? 'Find subtitles' : 'Open OpenSubtitles';
    $('overlaySearchHint').textContent=api ? 'API search needs a key. Set it in the extension Settings.' : 'Select a file in the search window. It saves and loads automatically.';
    $('overlayResults').replaceChildren();
  }
  $('overlaySearchMode').onchange=()=>{searchMode();rpc('OVERLAY_PREFERENCES',{mode:$('overlaySearchMode').value}).catch(error=>message(error.message,true));};
  $('saveSearchLink').onclick=event=>{if(event.isTrusted)task($('saveSearchLink'),async()=>{await rpc('OVERLAY_PREFERENCES',{urlTemplate:$('overlaySearchUrl').value});message('Search link saved.');});};
  const savedBrowser=SubtitleLibraryView.create(shadow,'overlaySaved',()=>renderSaved());
  function renderSaved() {
    $('overlayLibrary').replaceChildren();
    for(const entry of savedBrowser.selected()) {
      const row=document.createElement('div');row.className='saved-track';
      const button=document.createElement('button');button.className='saved-name';button.textContent=(entry.language ? entry.language+' · ' : '')+entry.name;button.title=entry.name;
      button.onclick=event=>{if(event.isTrusted)task(button,async()=>{const loaded=await rpc('OVERLAY_LOAD',{id:entry.id});view('controls');message(loaded.count+' saved lines loaded.');});};
      row.append(button);
      const save=document.createElement('button');save.className='rating';save.innerHTML=saveIcon;
      save.title='Save current subtitle settings';save.setAttribute('aria-label',save.title);save.disabled=entry.id!==state.libraryId;
      save.setAttribute('aria-pressed',String(Boolean(entry.settingsSaved)));
      save.onclick=event=>{if(event.isTrusted)task(save,async()=>{await saveCurrent(entry.id);await refreshSaved();});};
      const bad=document.createElement('button');bad.className='rating';bad.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h9a3 3 0 0 1 3 3l-2 6H13v6a2 2 0 0 1-4 0l-1-6H4V4Z"/></svg>';bad.title='Delete this saved subtitle';bad.setAttribute('aria-label',bad.title);
      bad.onclick=event=>{if(event.isTrusted)task(bad,async()=>{await rpc('OVERLAY_RATE',{id:entry.id,verdict:'bad'});await refreshSaved();message('Subtitle deleted. This file will not appear in search results.');});};
      row.append(save,bad);
      $('overlayLibrary').append(row);
    }
    $('savedHint').textContent=savedBrowser.hint();
  }
  async function refreshSaved(preferred) {
    const revision=routeRevision;
    const entries=(await rpc('OVERLAY_LIBRARY')).entries;if(revision!==routeRevision)return;savedEntries=entries;
    savedBrowser.update(entries,preferred,$('overlayQuery').value);renderSaved();
  }
  $('refreshSaved').onclick=event=>{if(event.isTrusted)task($('refreshSaved'),refreshSaved);};
  $('overlaySearch').onsubmit=event=>{
    event.preventDefault();if(!event.isTrusted)return;
    task($('overlaySearchButton'),async()=>{
      const current=query();await rpc('OVERLAY_PREFERENCES',current);$('overlayResults').replaceChildren();
      if(current.mode==='website'){await rpc('OVERLAY_WEBSITE',current);message('Search window opened. Subtitle downloads load automatically.');return;}
      message('Search in progress…');
      const result=await rpc('OVERLAY_SEARCH',current);
      for(const entry of result.results) {
        const card=document.createElement('div');card.className='result';
        const title=document.createElement('strong');title.textContent=entry.title || entry.name;
        const detail=document.createElement('small');detail.textContent=entry.language+' · '+(entry.release || entry.name);
        const button=document.createElement('button');button.textContent='Use subtitles';
        button.onclick=event=>{if(event.isTrusted)task(button,async()=>{message('Download in progress…');const loaded=await rpc('OVERLAY_DOWNLOAD',{fileId:entry.fileId});view('controls');message(loaded.count+' lines loaded.'+(loaded.saved ? ' Saved for this film.' : ' Save failed: '+loaded.saveError));});};
        card.append(title,detail,button);$('overlayResults').append(card);
      }
      message(result.results.length ? result.results.length+(result.results.length===1 ? ' file found.' : ' files found.')+' Select a file for your film.' : 'No files found. Try another title or language.');
    });
  };
  let titleEdited=false,yearEdited=false;
  $('overlayQuery').oninput=()=>{titleEdited=true;};
  $('overlayYear').oninput=()=>{yearEdited=true;};
  const searchReady=rpc('OVERLAY_SETTINGS').then(settings=>{
    const prefs=settings.preferences;
    // Saved searches are a fallback. They must not replace the current film.
    if(!titleEdited && !detectedTitle)$('overlayQuery').value=prefs.title || '';
    if(!yearEdited && !detectedTitle)$('overlayYear').value=prefs.year || '';
    setLanguage(prefs.language);
    $('overlaySearchMode').value=prefs.mode;$('overlaySearchUrl').value=prefs.urlTemplate;searchMode();
    suggestFilm();
  }).catch(error=>message(error.message,true));
  let detectedTitle='';
  function suggestFilm(film=retainFilm(globalThis.SubtitleFilm?.detect())) {
    if(!film)return;
    const input=$('overlayQuery');
    if(!titleEdited)input.value=film.title;
    if(!yearEdited)$('overlayYear').value=film.year || '';
    detectedTitle=film.title;
    $('filmSuggestion').hidden=false;$('filmSuggestion').textContent=(film.source==='Player metadata' ? 'From player: ' : 'From page: ')+film.title;
    return film;
  }

  function searchSnapshot(){return {...query(),urlTemplate:$('overlaySearchUrl').value,href:location.href,suggestion:$('filmSuggestion').textContent,suggestionHidden:$('filmSuggestion').hidden};}

  async function routeFilm(film) {
    view('find');const revision=routeRevision,identity=filmIdentity;
    try{
      const entries=(await rpc('OVERLAY_LIBRARY')).entries;
      if(revision!==routeRevision || identity!==filmIdentity || state.cues.length)return;
      const matching=film && entries.find(entry=>(film.showTitle && entry.showTitle ? filmName(entry.showTitle)===filmName(film.showTitle) && entry.season===film.season && entry.episode===film.episode : filmName(entry.title)===filmName(film.title)) && (!film.year || !entry.year || String(entry.year)===String(film.year)));
      if(matching){view('saved',false,false);await refreshSaved(matching.filmKey);}
    }catch(error){if(revision===routeRevision)message(error.message,true);}
  }
  function clearFilm() {
    playerTracks?.restore();
    clockToken=crypto.randomUUID();pageClock=null;clockSample=null;clockLastNative=null;clockTimelineElement=null;clockNeedsPosition=false;manualCueSelection=null;lastControlSnapshot=null;
    observedVideo?.setAttribute('data-subtitle-overlay-clock',clockToken);
    state.originalStyle=null;sourceText='';savedSettings='';anchors=[];localChoices=[];lastCueIndex=-1;lastSyncTime=null;
    $('localTracks').hidden=true;state.cues=[];state.ends=[];state.name='';state.libraryId=null;
    state.delay=0;state.rate=1;$('delay').value='0';$('rate').value='100';$('filter').value='';
    $('filename').textContent='No subtitle file';$('text').textContent='';$('saveSubtitle').disabled=true;$('broken').disabled=true;
    syncMode();message('New video. Find subtitles or load a saved file.');
  }

  let idleTimer;
  function fullScreen() { return Boolean(document.fullscreenElement || state.browserFullscreen); }
  function wakeControls() {
    $('toggle').hidden=false; clearTimeout(idleTimer);
    if (fullScreen()) idleTimer=setTimeout(()=>{if($('panel').hidden) $('toggle').hidden=true;},1800);
  }
  function show() { $('panel').hidden = false; wakeControls(); }
  function toggle() { $('panel').hidden = !$('panel').hidden; wakeControls(); }
  $('toggle').onclick = toggle;
  $('close').onclick = () => { $('panel').hidden = true; wakeControls(); };
  function fullscreenChanged() { mount(); if(fullScreen()) $('panel').hidden=true; wakeControls(); }
  async function browserFullscreenStatus() {
    try {
      const reply=await chrome.runtime.sendMessage({type:'FULLSCREEN_STATUS'});
      if(reply?.ok && state.browserFullscreen!==reply.fullscreen) { state.browserFullscreen=reply.fullscreen;fullscreenChanged(); }
    } catch { /* Extension can be reloaded while a page remains open. */ }
  }
  $('fullscreen').onclick=async event=>{
    if(!event.isTrusted) return;
    try {
      const reply=await chrome.runtime.sendMessage({type:'TOGGLE_FULLSCREEN'});
      if(!reply?.ok) throw new Error(reply?.error || 'Use F11 for browser fullscreen.');
      state.browserFullscreen=reply.fullscreen;fullscreenChanged();
    }catch(error){message(error.message,true);}
  };
  // Follow the fullscreen container into the browser's top layer.
  function mount() {
    const fullscreen = document.fullscreenElement;
    const parent = fullscreen && fullscreen.tagName !== 'VIDEO' ? fullscreen : document.body || document.documentElement;
    if (host.parentNode !== parent) parent.append(host);
    if (fullscreen?.tagName === 'VIDEO') message('Native video fullscreen hides overlays. Exit it and use browser fullscreen (F11).', true);
  }
  function videos(root) {
    const found = [...root.querySelectorAll('video')];
    for (const element of root.querySelectorAll('*')) if (element.shadowRoot && element !== host) found.push(...videos(element.shadowRoot));
    return found;
  }
  function videoInfo(video){
    const rect=video.getBoundingClientRect();let visible=rect.width>80 && rect.height>60 && rect.bottom>0 && rect.right>0 && rect.left<innerWidth && rect.top<innerHeight;
    for(let element=video;element && visible;element=element.parentElement || element.getRootNode()?.host){
      const style=getComputedStyle(element);if(style.display==='none' || style.visibility==='hidden' || Number(style.opacity)<=.01)visible=false;
    }
    let painted=0;
    if(visible)for(const [x,y] of [[.5,.5],[.3,.6],[.65,.4]]){
      const atX=Math.min(innerWidth-1,Math.max(0,rect.left+rect.width*x)),atY=Math.min(innerHeight-1,Math.max(0,rect.top+rect.height*y));
      const first=document.elementsFromPoint(atX,atY).find(element=>element.tagName==='VIDEO');
      if(first===video)painted++;
    }
    return {video,visible,area:visible ? rect.width*rect.height : 0,painted,playing:!video.paused && !video.ended,ready:video.readyState>=2};
  }
  function selectVideo(){
    const candidates=videos(document).map(videoInfo).filter(item=>item.visible && !/^(?:background trailer|trailer|preview|hover preview)$/i.test((item.video.getAttribute('title') || item.video.getAttribute('aria-label') || '').trim()));
    const largest=Math.max(0,...candidates.map(item=>item.area));
    // Ignore small hover previews. For stacked players, actual playback and paint
    // order matter more than equal rectangles or DOM insertion order.
    return candidates.filter(item=>item.area>=largest*.45).sort((a,b)=>b.painted-a.painted || Number(b.playing)-Number(a.playing) || Number(b.ready)-Number(a.ready) || b.area-a.area)[0]?.video || null;
  }
  function timestampFromLabel(text){
    const match=String(text || '').match(/(?:^|[^\d])((?:\d{1,3}:)?\d{1,2}:\d{2})(?:[^\d]|$)/);
    if(!match)return null;const parts=match[1].split(':').map(Number);
    if(parts.at(-1)>59 || parts.length===3 && parts[1]>59)return null;
    return parts.reduce((sum,part)=>sum*60+part,0);
  }
  function publicRoots(root=document){
    const roots=[root];for(let i=0;i<roots.length;i++)for(const element of roots[i].querySelectorAll('*'))if(element!==host && element.shadowRoot)roots.push(element.shadowRoot);
    return roots;
  }
  function timelinePosition(element){
    const hint=[element.getAttribute('aria-label'),element.getAttribute('data-testid'),element.getAttribute('data-role'),element.className].join(' ');
    if(/volume|sound|brightness|remaining|duration/i.test(hint))return null;
    if(element.matches('[role="slider"],input[type="range"]')){
      if(!/seek|progress|timeline|scrub|playback|playhead|وقت|تقدم/i.test(hint))return null;
      const label=element.getAttribute('aria-valuetext');
      const value=Number(element.getAttribute('aria-valuenow') ?? element.value),max=Number(element.getAttribute('aria-valuemax') ?? element.max),min=Number(element.getAttribute('aria-valuemin') ?? element.min ?? 0);
      if(Number.isFinite(value) && Number.isFinite(max) && min===0 && max>120 && value>=0 && value<=max && max<=864000)return {time:value,source:'Player timeline',element};
      if(!/remaining|left|متبق|^\s*-/i.test(label || '')){const time=timestampFromLabel(label);if(time!==null)return {time,source:'Player timeline',element};}
    }else{const time=timestampFromLabel(element.textContent);if(time!==null)return {time,source:'Player elapsed time',element};}
    return null;
  }
  function playerPosition(video){
    const now=performance.now(),rect=video.getBoundingClientRect();
    if(now-timelineChecked>600){
      const selector='[role="slider"],input[type="range"],[data-testid*="current-time" i],[data-role="current-time"],.vjs-current-time-display,.jw-text-elapsed';
      // The film's HUD can be a sibling web component with several open shadow
      // roots. The video's own nearest player wrapper does not contain that HUD.
      timelineElements=publicRoots().flatMap(root=>[...root.querySelectorAll(selector)]).filter(element=>element!==host && !host.contains(element));
      timelineChecked=now;
    }
    const candidates=[];
    for(const element of timelineElements){
      if(!element.isConnected || !element.getClientRects().length || getComputedStyle(element).visibility==='hidden')continue;
      const bounds=element.getBoundingClientRect();
      if(bounds.right<rect.left || bounds.left>rect.right || bounds.top<rect.top-80 || bounds.top>rect.bottom+120)continue;
      const position=timelinePosition(element);if(position)candidates.push({...position,distance:Math.abs(bounds.top-rect.bottom),width:bounds.width});
    }
    return candidates.sort((a,b)=>b.width-a.width || a.distance-b.distance)[0] || null;
  }
  function playbackClock(){
    const video=state.video;if(!video?.isConnected)return {time:NaN,source:'No player'};
    const native=video.currentTime;
    // A relative media clock may restart without a seeked event. Do not keep an
    // obsolete absolute mapping after that discontinuity while the HUD is absent.
    if(clockSample && Number.isFinite(clockLastNative) && Number.isFinite(native) && native<clockLastNative-.1){clockSample=null;clockNeedsPosition=true;timelineChecked=-Infinity;}
    if(Number.isFinite(native))clockLastNative=native;
    const position=playerPosition(video);
    if(pageClock?.token===clockToken && performance.now()-pageClock.at<1000 && Number.isFinite(pageClock.time) && Number.isFinite(native) && Math.abs(pageClock.time-native)>=2)return {time:pageClock.time,source:'Page video clock'};
    if(!Number.isFinite(native))return {time:NaN,source:'Waiting for player clock'};
    if(position){
      clockNeedsPosition=false;clockTimelineElement=position.element;
      if(Math.abs(position.time-native)<2){clockSample=null;return {time:native,source:'Video clock'};}
      if(!clockSample || clockSample.video!==video || clockSample.position!==position.time || video.seeking)clockSample={video,position:position.time,native,source:position.source,element:position.element};
    }else if(clockTimelineElement?.isConnected && !timelinePosition(clockTimelineElement)){
      // A control changed into volume/remaining/percentage-only UI. It is no
      // longer a valid clock; this differs from a genuine timeline being hidden.
      clockSample=null;clockNeedsPosition=false;clockTimelineElement=null;
    }
    if(clockSample){
      const advance=!video.seeking ? Math.max(0,native-clockSample.native) : 0;
      return {time:clockSample.position+advance,source:clockSample.source};
    }
    if(pageClock?.token===clockToken && performance.now()-pageClock.at<1000 && Number.isFinite(pageClock.mediaTime))return {time:pageClock.mediaTime,source:'Playback position'};
    if(clockNeedsPosition)return {time:NaN,source:'Waiting for player timeline'};
    return {time:native,source:'Video clock'};
  }
  function playbackTime(){return playbackClock().time;}
  function pageClockUpdated(event){
    try{if(typeof event.detail!=='string' || event.detail.length>1000)return;const data=JSON.parse(event.detail);
      if(data.token!==clockToken || !['time','mediaTime','duration','mediaDuration'].every(key=>data[key]===null || Number.isFinite(data[key]) && data[key]>=0 && data[key]<=864000))return;
      pageClock={...data,at:performance.now()};
    }catch{/* Ignore malformed page messages; clocks confer no extension privileges. */}
  }
  document.addEventListener('subtitle-overlay-player-clock',pageClockUpdated);
  rpc('INSTALL_PLAYER_CLOCK').catch(error=>{clockBridgeError=error.message;});
  let lastControlSnapshot=null,controlCaptureTimer=null,controlCaptureAt=-Infinity;
  function publicClockControls(){
    const items=[],roots=[document],videoRect=state.video?.getBoundingClientRect();let scanned=0,shadowRoots=0;
    const timePattern=/^-?\s*(?:\d{1,3}:)?\d{1,2}:\d{2}(?:\s*(?:\/|of)\s*(?:\d{1,3}:)?\d{1,2}:\d{2})?\s*$/i;
    const hintOf=element=>({tag:element.tagName,id:element.id.slice(0,100),className:(typeof element.className==='string' ? element.className : '').slice(0,200)});
    // Read public playback UI only. Keep hidden controls: moving into the overlay
    // often hides the film's controls before this diagnostic is requested.
    for(let i=0;i<roots.length;i++)for(const element of roots[i].querySelectorAll('*')){
      if(element===host || host.contains(element))continue;
      if(element.shadowRoot){roots.push(element.shadowRoot);shadowRoots++;}
      scanned++;
      if(element.matches('script,style,link,meta,noscript,template'))continue;
      const label=element.getAttribute('aria-label') || '',testId=element.getAttribute('data-testid') || '',className=typeof element.className==='string' ? element.className : '';
      const hint=[element.id,className,label,testId].join(' ');
      const text=element.childElementCount<=6 ? [...element.childNodes].filter(node=>node.nodeType===3 || node.nodeType===1 && node.childElementCount<=3).map(node=>node.textContent).join('').trim() : '';
      const timeText=text.length<=40 && timePattern.test(text) ? text : '';
      const clockHint=/seek|scrub|progress|remaining|current[-_ ]?time|elapsed/i.test(hint);
      const rect=element.getBoundingClientRect();
      const nearBottom=videoRect && rect.width>0 && rect.height>0 && rect.top>=videoRect.bottom-180 && rect.top<=videoRect.bottom+100 && rect.right>=videoRect.left && rect.left<=videoRect.right;
      const interactive=element.matches('input[type=range],progress,[role=slider]') || nearBottom && element.matches('button,[role=button]');
      if(!clockHint && !timeText && !interactive)continue;
      const style=getComputedStyle(element),parent=element.parentElement?.getBoundingClientRect(),variables={};
      for(const name of element.style)if(name.startsWith('--') && /progress|percent|position|played|elapsed/i.test(name)){const value=element.style.getPropertyValue(name).trim();if(/^-?[\d.]+(?:%|px|s)?$/.test(value))variables[name]=value;}
      items.push({...hintOf(element),kind:clockHint ? 'clock control' : timeText ? 'time label' : 'player button',visible:rect.width>0 && rect.height>0 && style.visibility!=='hidden' && Number(style.opacity)>0,label:label.slice(0,160),testId:testId.slice(0,100),role:element.getAttribute('role'),value:element.getAttribute('aria-valuenow') ?? (element.matches('input[type=range],progress') ? element.value : null),max:element.getAttribute('aria-valuemax') ?? (element.matches('input[type=range],progress') ? element.max : null),valueText:element.getAttribute('aria-valuetext')?.slice(0,100),timeText,inline:{width:element.style.width,left:element.style.left,transform:element.style.transform,variables},x:Math.round(rect.left*100)/100,width:Math.round(rect.width*100)/100,height:Math.round(rect.height*100)/100,parentWidth:parent ? Math.round(parent.width*100)/100 : null,transform:style.transform,ancestors:[element.parentElement,element.parentElement?.parentElement,element.getRootNode().host].filter(Boolean).map(hintOf)});
    }
    const selected=items.filter(item=>item.kind!=='player button').slice(0,50).concat(items.filter(item=>item.kind==='player button').slice(0,12));
    return {scanned,shadowRoots,iframeCount:document.querySelectorAll('iframe').length,items:selected};
  }
  function captureControls(event){
    if(!state.video || Number.isFinite(state.video.duration) || event.composedPath().includes(host) || performance.now()-controlCaptureAt<750)return;
    controlCaptureAt=performance.now();clearTimeout(controlCaptureTimer);
    controlCaptureTimer=setTimeout(()=>{const captured=publicClockControls();if(captured.items.length)lastControlSnapshot={at:performance.now(),...captured};},120);
  }
  function playerReport(){
    const items=videos(document),clock=playbackClock();
    const info={version:chrome.runtime.getManifest().version,selectedVideo:items.indexOf(state.video),clockSource:clock.source,filmTime:clock.time,pageClock:pageClock ? {time:pageClock.time,duration:pageClock.duration,durationKind:pageClock.durationKind,mediaTime:pageClock.mediaTime,ageMs:Math.round(performance.now()-pageClock.at)} : null,clockBridgeError,videos:items.map(video=>{const item=videoInfo(video);return {time:video.currentTime,duration:video.duration,durationKind:Number.isFinite(video.duration) ? 'finite' : video.duration===Infinity ? 'infinite' : 'unknown',paused:video.paused,seeking:video.seeking,readyState:video.readyState,controls:video.controls,root:video.getRootNode().host ? {tag:video.getRootNode().host.tagName} : 'document',visible:item.visible,painted:item.painted,width:Math.round(video.getBoundingClientRect().width),height:Math.round(video.getBoundingClientRect().height)};}),timelines:timelineElements.slice(0,20).map(element=>({label:element.getAttribute('aria-label'),text:element.getAttribute('aria-valuetext'),value:element.getAttribute('aria-valuenow') ?? element.value,max:element.getAttribute('aria-valuemax') ?? element.max,testId:element.getAttribute('data-testid')}))};
    const controls=publicClockControls();info.filmClockAnchor=clockSample ? {filmTime:clockSample.position,nativeTime:clockSample.native} : null;info.needsPlayerClock=clockNeedsPosition;info.playerControls=controls.items;info.controlScan={scanned:controls.scanned,shadowRoots:controls.shadowRoots,iframeCount:controls.iframeCount};
    if(lastControlSnapshot && performance.now()-lastControlSnapshot.at<60000)info.recentControls={ageMs:Math.round(performance.now()-lastControlSnapshot.at),items:lastControlSnapshot.items};
    return info;
  }
  const playerInfo=document.createElement('button');playerInfo.id='copyPlayerInfo';playerInfo.textContent='Copy player info';playerInfo.style.cssText='width:100%;margin-top:12px';$('remove').before(playerInfo);
  const saveReport=document.createElement('button');saveReport.id='savePlayerReport';saveReport.textContent='Save player report';saveReport.style.cssText='width:100%;margin-top:8px';playerInfo.after(saveReport);
  saveReport.onclick=event=>{if(event.isTrusted)task(saveReport,async()=>{await rpc('OVERLAY_EXPORT_REPORT');message('Report download started. Save the file if your browser asks.');});};
  playerInfo.onclick=async()=>{
    const text=JSON.stringify(playerReport(),null,2);
    try{await navigator.clipboard.writeText(text);message('Player info copied. Paste it in the support chat.');}
    catch{let field=$('playerInfoText');if(!field){field=document.createElement('textarea');field.id='playerInfoText';field.readOnly=true;field.setAttribute('aria-label','Player info');playerInfo.after(field);}field.value=text;field.focus();field.select();message('Player info selected. Copy it and paste it in the support chat.');}
  };
  function discover() {
    for(let i=discoveryObservers.length-1;i>=0;i--){const item=discoveryObservers[i];if(item.root.host && !item.root.host.isConnected){item.observer.disconnect();watchedRoots.delete(item.root);discoveryObservers.splice(i,1);}}
    for(const root of publicRoots())watchDiscovery(root);
    const pageChanged=location.href!==state.href;state.href=location.href;
    // Seek controls may temporarily hide or replace a video. Retain a connected clock.
    state.video = selectVideo() || (state.video?.isConnected ? state.video : null);
    if(observedVideo!==state.video){clockNeedsPosition=clockNeedsPosition || Boolean(clockSample);clockLastNative=null;clockTimelineElement=null;observedVideo?.removeEventListener('seeked',seekFinished);observedVideo?.removeAttribute('data-subtitle-overlay-clock');observedVideo=state.video;clockToken=crypto.randomUUID();pageClock=null;observedVideo?.setAttribute('data-subtitle-overlay-clock',clockToken);observedVideo?.addEventListener('seeked',seekFinished);timelineChecked=-Infinity;clockSample=null;seekFinished();}
    const detected=globalThis.SubtitleFilm?.detect(),film=pageChanged ? detected : retainFilm(detected);
    const sameTitle=filmName(film?.title)===filmName(committedFilm?.title);
    const identity=identityOf(sameTitle && film && committedFilm && !film.year ? {...film,year:committedFilm.year} : film);
    // A new title must survive two discovery passes. Missing or weaker metadata
    // during a seek is not a new film and must never reset its timing or subtitle.
    const changed=pageChanged || Boolean(filmIdentity && identity!==filmIdentity && pendingFilmIdentity===identity);
    pendingFilmIdentity=identity!==filmIdentity ? identity : '';
    if(changed || !filmIdentity && state.video){
      filmIdentity=identity;committedFilm=film;pendingFilmIdentity='';
      if(changed){clearFilm();titleEdited=false;yearEdited=false;if(film){$('overlayQuery').value=film.title;$('overlayYear').value=film.year || '';}}routeFilm(film);
    }else if(identity===filmIdentity && film){committedFilm={...film,year:film.year || committedFilm?.year || ''};}
    suggestFilm(committedFilm || film);
    $('videoStatus').textContent = state.video ? 'Video connected' : 'Start the film to connect.';
    refreshPlayerTracks();mount(); draw();
  }
  function seekFinished(){lastSyncTime=-1;lastCueIndex=-1;clockNeedsPosition=clockNeedsPosition || Boolean(clockSample);clockSample=null;clockLastNative=null;timelineChecked=-Infinity;}
  // Control clearance is a render offset, never part of the film clock or saved position.
  function controlsVisible(element){
    for(let node=element;node;node=node.parentElement || node.getRootNode()?.host){
      const style=getComputedStyle(node);
      if(node.hidden || style.display==='none' || style.visibility==='hidden' || style.visibility==='collapse' || Number(style.opacity)<.05)return false;
    }
    return true;
  }
  function nativeControlsActivity(event){
    const video=state.video;
    if(!video?.controls)return;
    if(event.composedPath().includes(host) || event.type==='pointerout' && !event.relatedTarget){nativePointerInside=false;return;}
    if(event.type==='pointerout')return;
    if(event.type==='keydown' || event.type==='focusin'){
      if(event.composedPath().includes(video))nativeControlsAt=performance.now();
      return;
    }
    const rect=video.getBoundingClientRect();
    nativePointerInside=event.clientX>=rect.left && event.clientX<=rect.right && event.clientY>=rect.top && event.clientY<=rect.bottom;
    if(nativePointerInside)nativeControlsAt=performance.now();
  }
  function liftCaptions(video,rect,animate){
    const text=$('text'),style=text.style,base=rect.height*state.bottom/100;
    if(controlsVideo!==video){controlsVideo=video;controlsPosition='';controlElements=[];controlsChecked=-Infinity;nativeControlsAt=-Infinity;nativePointerInside=false;}
    const position=[rect.left,rect.top,rect.width,rect.height,state.bottom,state.positionEdge,state.avoidControls].join(':');
    text.classList.toggle('controls-motion',animate && controlsPosition===position);controlsPosition=position;
    if(state.positionEdge!=='bottom'){style.bottom='auto';return;}
    if(!state.avoidControls || !text.textContent || rect.height<=0){style.bottom=state.bottom+'%';return;}
    const now=performance.now();
    if(now-controlsChecked>600){
      controlsChecked=now;
      const selector='[role="slider"],input[type="range"],button[aria-label],button[title],[data-testid*="control" i],[class*="controls" i],[class*="control-bar" i],[class*="controlbar" i]';
      controlElements=publicRoots().flatMap(root=>[...root.querySelectorAll(selector)]).filter(element=>{
        const hints=[element.className,element.id,element.getAttribute('data-testid'),element.getAttribute('aria-label'),element.getAttribute('title')].join(' ');
        return !/volume|brightness/i.test(hints) && /controls?|timeline|seek|scrub|progress|play|pause|full.?screen|تشغيل|إيقاف/i.test(hints);
      }).slice(0,200);
    }
    const caption=text.getBoundingClientRect();let controlTop=rect.bottom;
    for(const element of controlElements){
      if(!element.isConnected || !controlsVisible(element))continue;
      const box=element.getBoundingClientRect();
      // Ignore page toolbars, controls below the video, and full-size player wrappers.
      if(box.width<=0 || box.height<=0 || box.top<rect.top+rect.height*.6 || box.bottom>rect.bottom+2 || box.height>rect.height*.4 || box.left>=caption.right || box.right<=caption.left)continue;
      controlTop=Math.min(controlTop,box.top);
    }
    // Browser-drawn controls have no public DOM. Use a bounded interaction fallback.
    const nativeActive=video.controls && (now-nativeControlsAt<2500 || video.paused && nativePointerInside && Number.isFinite(nativeControlsAt));
    if(nativeActive)controlTop=Math.min(controlTop,rect.bottom-Math.min(72,rect.height*.2));
    const needed=controlTop<rect.bottom ? rect.bottom-controlTop+12 : base;
    const bottom=Math.max(base,Math.min(needed,Math.max(0,rect.height-caption.height-8)));
    style.bottom=bottom>base ? bottom+'px' : state.bottom+'%';
  }
  function draw() {
    const video = state.video;
    if (!video?.isConnected) { $('text').textContent = ''; return; }
    const rect = video.getBoundingClientRect();
    $('captions').style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;padding:0;`;
    const textStyle=$('text').style;
    textStyle.position='absolute';textStyle.left=state.horizontal+'%';textStyle.transform='translateX(-50%)';textStyle.maxWidth=state.width+'%';
    textStyle.top=state.positionEdge==='top' ? state.bottom+'%' : 'auto';
    textStyle.textAlign=state.align;textStyle.fontWeight=String(state.weight);textStyle.fontStyle=state.italic ? 'italic' : 'normal';textStyle.lineHeight=String(state.lineHeight);textStyle.padding=state.paddingY+'px '+state.paddingX+'px';textStyle.borderRadius=state.radius+'px';
    $('text').style.fontSize = `${state.size}px`;
    $('text').style.fontFamily = state.font;
    $('text').style.color = state.color;
    const rgb=[1,3,5].map(at=>parseInt(state.background.slice(at,at+2),16));
    $('text').style.backgroundColor='rgba('+rgb.join(',')+','+(state.opacity/100)+')';
    const shadowRgb=[1,3,5].map(at=>parseInt(state.shadowColor.slice(at,at+2),16));
    $('text').style.textShadow=state.shadow ? state.shadowX+'px '+state.shadowOffset+'px '+state.shadowBlur+'px rgba('+shadowRgb.join(',')+','+(state.shadowOpacity/100)+')' : 'none';
    const clock=playbackClock(),time=clock.time;
    const text = state.enabled ? core.active(state.cues, state.ends, time, state.delay, state.rate) : '';
    const startsCaption=!$('text').textContent && Boolean(text);
    if ($('text').textContent !== text) $('text').textContent = text;
    liftCaptions(video,rect,!startsCaption);
    $('time').textContent = Number.isFinite(time) ? core.clock(time) : '--:--:--';$('time').title=clock.source;
    $('videoStatus').textContent=Number.isFinite(time) ? 'Video connected' : clockNeedsPosition ? 'Show video controls to read time.' : 'Wait for the video clock.';
    updateSyncButtons();
    if($('syncSettings').open && !video.seeking && Number.isFinite(time)){
      const manual=manualCueSelection && manualCueSelection.video===video && video.paused!==false && Math.abs(time-manualCueSelection.time)<.001;
      if(!manual)manualCueSelection=null;
      const moved=lastSyncTime!==null && Math.abs(time-lastSyncTime)>.001;
      const searching=(video.paused===false || moved) && Boolean($('filter').value);
      if(searching && !manual)$('filter').value='';
      const current=core.currentIndex(state.cues,state.ends,time,state.delay,state.rate);
      const playingSelection=(video.paused===false || moved) && $('cues').value!==String(current);
      if(!manual && (searching || current!==lastCueIndex || playingSelection)){lastCueIndex=current;renderCues();}
      lastSyncTime=time;
    }
    updateSaveIcon();
  }
  function renderCues() {
    const filter = $('filter').value.trim().toLocaleLowerCase();
    const time=playbackTime(),clock=Number.isFinite(time) ? time : 0;
    const subtitleTime=(clock-state.delay)/state.rate,currentIndex=core.currentIndex(state.cues,state.ends,clock,state.delay,state.rate);
    const changed=cueWindowSource!==state.cues || cueWindowFilter!==filter;
    if(changed){
      cueWindowMatches=filter ? state.cues.flatMap((cue,index)=>cue.text.toLocaleLowerCase().includes(filter) ? [index] : []) : [];
      cueWindowSource=state.cues;cueWindowFilter=filter;cueWindowStart=-1;
    }
    const count=filter ? cueWindowMatches.length : state.cues.length;
    const indexAt=position=>filter ? cueWindowMatches[position] : position;
    let closestPosition=Math.max(0,currentIndex);
    if(filter){
      let distance=Infinity;closestPosition=0;
      cueWindowMatches.forEach((index,position)=>{const delta=Math.abs(state.cues[index].start-subtitleTime);if(delta<distance){closestPosition=position;distance=delta;}});
      const activePosition=cueWindowMatches.indexOf(currentIndex);if(activePosition>=0)closestPosition=activePosition;
    }
    // Reuse the same options while the current line stays inside their window.
    // Unfiltered playback performs indexed lookup, not a full-track scan every tick.
    if(changed || closestPosition<cueWindowStart || closestPosition>=cueWindowStart+80){
      cueWindowStart=Math.max(0,closestPosition-20);const options=[];
      for(let position=cueWindowStart;position<Math.min(count,cueWindowStart+80);position++){
        const index=indexAt(position),cue=state.cues[index],option=document.createElement('option');option.value=String(index);
        option.textContent=`${core.clock(cue.start)} ${cue.text.replace(/\n/g,' ').slice(0,100)}`;options.push(option);
      }
      $('cues').replaceChildren(...options);
    }
    if(count)$('cues').value=String(indexAt(closestPosition));
    updateSyncButtons();
  }
  function updateSyncButtons(){
    const ready=Boolean(state.video?.isConnected && !state.video.seeking && Number.isFinite(playbackTime()) && $('cues').value && state.cues[Number($('cues').value)]);
    $('sync').disabled=!ready;$('markFirst').disabled=!ready;$('syncSecond').disabled=!ready || !anchors.length;$('syncThird').disabled=!ready || anchors.length<2;
  }
  function load(text, name, libraryId=null, preset) {
    const cues = core.parse(text); // Parse first: bad imports preserve the current valid track.
    const settings=preset ? settingsCore.validate(preset,cues) : null;
    playerTracks?.restore();
    sourceText=text;savedSettings='';anchors=[];lastCueIndex=-1;lastSyncTime=null;manualCueSelection=null;localChoices=[];$('localTracks').hidden=true;
    state.originalStyle=null;state.cues = cues; state.ends = core.createIndex(cues); state.name = String(name || 'Subtitles').slice(0, 250);
    state.libraryId=libraryId; $('saveSubtitle').disabled=false; $('broken').disabled=!libraryId;
    state.delay = 0; state.rate = 1; $('delay').value = '0'; $('rate').value = '100'; $('filter').value = '';
    if(settings){applySettings(settings);savedSettings=JSON.stringify(currentSettings());}else{$('syncMode').value='one';syncMode();}
    $('filename').textContent = state.name; $('filename').title = state.name; view('controls');renderCues(); draw();
    message(`${cues.length} lines loaded.${settings ? ' Saved timing and text style restored.' : ' Adjust the delay if needed.'}`);
    return cues.length;
  }
  function clearSaved(id) {
    if(state.libraryId!==id) return;
    playerTracks?.restore();
    state.originalStyle=null;sourceText='';savedSettings='';anchors=[];localChoices=[];$('localTracks').hidden=true;state.cues=[];state.ends=[];state.name='';state.libraryId=null; $('filename').textContent='No subtitle file';$('saveSubtitle').disabled=true;$('broken').disabled=true;renderCues();draw();message('Subtitle deleted. Choose another file.');
  }
  function currentSettings(){
    return {...Object.fromEntries(Object.keys(settingsCore.defaults).filter(key=>key in state).map(key=>[key,state[key]])),encoding:$('encoding').value,syncMode:$('syncMode').value,anchors};
  }
  function updateSaveIcon(){
    $('restorePlayerStyle').disabled=!state.originalStyle;
    $('playerStyleHint').hidden=!state.originalStyle;
    $('saveSubtitle').disabled=!state.cues.length || savingPreset;
    const saved=Boolean(savedSettings && savedSettings===JSON.stringify(currentSettings()));
    $('saveSubtitle').setAttribute('aria-pressed',String(saved));$('saveSubtitle').style.borderColor=saved ? '#216aa3' : '';
    $('saveSubtitle').title=saved ? 'Subtitle and current settings saved' : 'Save subtitle and settings';
  }
  function applySettings(settings){
    const clean=settingsCore.validate(settings,state.cues);Object.assign(state,Object.fromEntries(Object.entries(clean).filter(([key])=>key in state)));
    if(!Array.from($('font').options).some(option=>option.value===state.font)){const option=document.createElement('option');option.value=state.font;option.textContent=state.font;$('font').append(option);}
    anchors=clean.anchors;$('encoding').value=clean.encoding;$('syncMode').value=clean.syncMode;
    for(const [id,key] of [['weight','weight'],['positionEdge','positionEdge'],['align','align'],['horizontal','horizontal'],['width','width'],['lineHeight','lineHeight'],['paddingX','paddingX'],['paddingY','paddingY'],['radius','radius'],['shadowX','shadowX'],['delay','delay'],['font','font'],['color','color'],['backgroundColor','background'],['backgroundOpacity','opacity'],['bottom','bottom'],['shadowColor','shadowColor'],['shadowOpacity','shadowOpacity'],['shadowBlur','shadowBlur'],['shadowOffset','shadowOffset']])$(id).value=String(key==='delay' ? Math.round(state.delay*1000)/1000 : state[key]);
    $('avoidControls').checked=state.avoidControls;$('italic').checked=state.italic;$('playerStyleHint').hidden=!state.originalStyle;$('playerStyleHint').textContent=state.originalStyle ? 'Restore the appearance captured on Import. Timing stays the same.' : '';
    $('rate').value=String(state.rate*100);$('enabled').checked=state.enabled;$('shadowEnabled').checked=state.shadow;
    $('opacityLabel').textContent=state.opacity+'%';$('bottomLabel').textContent=state.bottom+'%';setSize(state.size);syncMode();
  }
  async function saveCurrent(id=state.libraryId){savingPreset=true;updateSaveIcon();try{await rpc('OVERLAY_SAVE',{libraryId:id});message('Subtitle, timing, and text style saved.');}finally{savingPreset=false;updateSaveIcon();}}
  $('saveSubtitle').onclick=event=>{if(event.isTrusted)task($('saveSubtitle'),()=>saveCurrent());};
  $('broken').onclick=event=>{if(event.isTrusted)task($('broken'),async()=>{const result=await rpc('OVERLAY_RATE',{id:state.libraryId,verdict:'bad'});clearSaved(result.libraryId);});};
  function syncMode(){
    const mode=$('syncMode').value,multi=mode!=='one';$('pairSync').hidden=!multi;$('sync').hidden=multi;$('syncThird').hidden=mode!=='three';
    $('syncSecond').textContent=mode==='three' ? 'Set second point' : 'Sync second point';
    $('syncHint').textContent=multi ? 'Pause when a line starts. Check the line and set the first point. Resume and repeat at a later line.'+(mode==='three' ? ' Repeat for a third line. All three points set delay and timing scale.' : ' The second point sets delay and timing scale.') : 'The current line is selected as the film plays. Pause when you hear a line start. Check the selected line, then click Sync.';
    $('anchorStatus').textContent=anchors.length ? anchors.map((point,index)=>(index+1)+': '+core.clock(point.videoTime)+' · '+state.cues[point.cueIndex].text.replace(/\n/g,' ').slice(0,80)).join(' / ') : 'No sync points set.';
    renderCues();updateSaveIcon();
  }
  function pointNow(){
    const cueIndex=Number($('cues').value),cue=state.cues[cueIndex];
    if(!state.video || !$('cues').value || !cue)throw new Error('Start the film and select a line first.');
    const time=playbackTime();if(state.video.seeking || !Number.isFinite(time))throw new Error('Wait for the seek to finish, then check the line.');
    return {cueIndex,subtitleTime:cue.start,videoTime:time};
  }
  $('syncMode').onchange=syncMode;
  $('syncSettings').addEventListener('toggle',()=>{lastSyncTime=playbackTime();if($('syncSettings').open){lastCueIndex=core.currentIndex(state.cues,state.ends,lastSyncTime,state.delay,state.rate);renderCues();}});
  $('markFirst').onclick=()=>{try{const point=pointNow();anchors=[point];setDelay(point.videoTime-point.subtitleTime*state.rate);syncMode();message('First point set. Resume and find a later line.');}catch(error){message(error.message,true);}};
  $('syncSecond').onclick=()=>{try{const point=pointNow();const result=core.syncPair(anchors[0],point);state.rate=result.rate;setDelay(result.delay);$('rate').value=String(state.rate*100);anchors=[anchors[0],point];syncMode();message('Two lines synced. Delay and timing scale set.');}catch(error){message(error.message,true);}};
  $('syncThird').onclick=()=>{try{const point=pointNow(),result=core.syncTriple(anchors[0],anchors[1],point);state.rate=result.rate;setDelay(result.delay);$('rate').value=String(state.rate*100);anchors=[anchors[0],anchors[1],point];syncMode();message('Three lines synced. Delay and timing scale set from all three points.');}catch(error){message(error.message,true);}};
  $('clearAnchors').onclick=()=>{anchors=[];syncMode();};
  function setDelay(value) {
    if (!Number.isFinite(value)) return;
    state.delay = Math.max(-86400, Math.min(86400, value)); $('delay').value = String(Math.round(state.delay * 1000) / 1000); draw();
  }
  $('delay').oninput = () => setDelay(Number($('delay').value));
  $('earlier').onclick = () => setDelay(state.delay - .25);
  $('later').onclick = () => setDelay(state.delay + .25);
  $('reset').onclick = () => { anchors=[];state.rate = 1; $('rate').value = '100';setDelay(0);syncMode(); };
  $('enabled').onchange = () => { state.enabled = $('enabled').checked; draw(); };
  function markManualCue(){manualCueSelection={video:state.video,time:playbackTime()};}
  $('filter').oninput = ()=>{renderCues();markManualCue();};
  $('cues').onchange=markManualCue;
  $('sync').onclick = () => {
    try{const point=pointNow();setDelay(point.videoTime-point.subtitleTime*state.rate);message(`Synced. Delay ${state.delay.toFixed(3)}s.`);}catch(error){message(error.message,true);}
  };
  $('rate').onchange = () => {
    const value = Number($('rate').value);
    if (!Number.isFinite(value) || value < 50 || value > 200) { $('rate').value = String(state.rate * 100); return; }
    // Preserve alignment at the current position while changing the drift correction.
    const time=playbackTime(),now=Number.isFinite(time) ? time : 0, subtitleTime = (now - state.delay) / state.rate;
    state.rate = value / 100; setDelay(now - subtitleTime * state.rate);
  };
  $('restorePlayerStyle').onclick=event=>{if(event.isTrusted && state.originalStyle){applySettings({...currentSettings(),...state.originalStyle});draw();message('Player text style and position restored. Timing kept.');}};
  $('avoidControls').onchange=()=>{state.avoidControls=$('avoidControls').checked;draw();};
  $('italic').onchange=()=>{state.italic=$('italic').checked;draw();};
  for(const key of ['positionEdge','align'])$(key).onchange=()=>{state[key]=$(key).value;draw();};
  for(const [key,min,max] of [['weight',100,900],['horizontal',0,100],['width',1,100],['lineHeight',.5,4],['paddingX',0,96],['paddingY',0,96],['radius',0,96]])$(key).oninput=()=>{const value=Number($(key).value);if($(key).value && Number.isFinite(value) && value>=min && value<=max){state[key]=value;draw();}};
  $('font').onchange = () => { state.font = $('font').value; draw(); };
  $('color').oninput = () => { state.color = $('color').value; draw(); };
  $('shadowEnabled').onchange=()=>{state.shadow=$('shadowEnabled').checked;draw();};
  $('shadowColor').oninput=()=>{state.shadowColor=$('shadowColor').value;draw();};
  for(const [id,key,max] of [['shadowOpacity','shadowOpacity',100],['shadowBlur','shadowBlur',20],['shadowOffset','shadowOffset',20],['shadowX','shadowX',20]]) $(id).oninput=()=>{state[key]=Math.max(['shadowOffset','shadowX'].includes(key) ? -20 : 0,Math.min(max,Number($(id).value)||0));draw();};
  $('backgroundColor').oninput=()=>{state.background=$('backgroundColor').value;draw();};
  $('backgroundOpacity').oninput=()=>{state.opacity=Number($('backgroundOpacity').value);$('opacityLabel').textContent=state.opacity+'%';draw();};
  function setSize(value) {
    if (!Number.isFinite(value) || value < 12 || value > 96) return;
    state.size = Math.round(value*100)/100; $('size').value = String(state.size); $('sizeNumber').value = String(state.size);
    $('sizeLabel').textContent = `${state.size}px`; draw();
  }
  $('size').oninput = () => setSize(Number($('size').value));
  $('sizeNumber').oninput = () => { if ($('sizeNumber').value) setSize(Number($('sizeNumber').value)); };
  $('sizeNumber').onchange = () => setSize(Math.max(12, Math.min(96, Number($('sizeNumber').value) || state.size)));
  $('bottom').oninput = () => { state.bottom = Number($('bottom').value); $('bottomLabel').textContent = `${state.bottom}%`; draw(); };
  $('file').onchange = async () => {
    const file = $('file').files[0]; if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Choose a file smaller than 2 MB.');
      const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.subarray(at,at+8192));
      const result=await rpc('OVERLAY_IMPORT',{name:file.name,data:btoa(binary),encoding:$('encoding').value,fps:Number($('fileFps').value)});
      localChoices=result.choices;renderLocalTracks();
      message(result.count+' lines loaded.'+(localChoices.length>1 ? ' Select a file from the archive.' : ' Adjust timing if needed.')+(result.note ? ' '+result.note : ''));
    } catch (error) { message(error.message, true); }
    $('file').value = '';
  };
  function renderLocalTracks(selected=0){
    $('localTracks').replaceChildren();for(const [index,choice] of localChoices.entries()){const option=document.createElement('option');option.value=String(index);option.textContent=choice.name;$('localTracks').append(option);}$('localTracks').value=String(selected);$('localTracks').hidden=localChoices.length<2;
  }
  $('localTracks').onchange=()=>{const choices=localChoices,index=Number($('localTracks').value),choice=choices[index];if(!choice)return;load(choice.text,choice.name);localChoices=choices;renderLocalTracks(index);if(choice.note)message(choice.note);};
  function keydown(event) {
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'KeyO') { event.preventDefault(); toggle(); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); setDelay(state.delay - .25); }
    if (event.code === 'ArrowRight') { event.preventDefault(); setDelay(state.delay + .25); }
  }
  // Prevent host player shortcuts from hijacking edits in the subtitle panel.
  for (const type of ['keydown', 'keyup', 'keypress']) $('panel').addEventListener(type, event => event.stopPropagation());
  function receive(request, sender, reply) {
    if (!sender.url?.startsWith(chrome.runtime.getURL(''))) return;
    try {
      if(request.type==='GET_PLAYER_TRACKS'){
        searchReady.then(()=>{discover();reply({ok:true,tracks:refreshPlayerTracks(true),search:searchSnapshot()});}).catch(error=>reply({ok:false,error:error.message}));return true;
      }
      if(request.type==='SET_SEARCH_STATE'){
        searchReady.then(()=>{
          if(request.href!==location.href)throw new Error('The film page changed. Reopen the extension.');
          const patch=request.patch || {};
          if(typeof patch.query==='string'){$('overlayQuery').value=patch.query.slice(0,200);titleEdited=true;}
          if(typeof patch.year==='string'){$('overlayYear').value=/^\d{0,4}$/.test(patch.year) ? patch.year : '';yearEdited=true;}
          if(typeof patch.language==='string')setLanguage(patch.language);
          if(['website','api'].includes(patch.mode) && patch.mode!==$('overlaySearchMode').value){$('overlaySearchMode').value=patch.mode;searchMode();}
          if(typeof patch.urlTemplate==='string')$('overlaySearchUrl').value=patch.urlTemplate.slice(0,2000);
          reply({ok:true,search:searchSnapshot()});
        }).catch(error=>reply({ok:false,error:error.message}));return true;
      }
      if(request.type==='PLAYER_TRACK_ACTION'){playerTrackAction(request.action,request.id).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;}
      if (request.type === 'LOAD_SUBTITLES') {
        if(request.expectedHref && request.expectedHref!==location.href)throw new Error('The film page changed. Start a new subtitle search.');
        if(request.expectedFilm && request.expectedFilm!==currentFilmIdentity())throw new Error('The film changed. Start a new subtitle search.');
        reply({ok: true, count: load(request.text, request.name,request.libraryId,request.settings)});
      }
      else if(request.type==='CLEAR_SUBTITLES') {clearSaved(request.libraryId);reply({ok:true});}
      else if(request.type==='GET_SUBTITLE_SNAPSHOT')reply({ok:true,text:sourceText,name:state.name,libraryId:state.libraryId,settings:currentSettings(),film:{title:$('overlayQuery').value || globalThis.SubtitleFilm?.detect()?.title || state.name,year:$('overlayYear').value},language:$('overlayLanguage').value,href:location.href});
      else if(request.type==='SUBTITLE_PRESET_SAVED'){
        if(request.expectedHref===location.href && sourceText===request.text && state.name===request.name){state.libraryId=request.libraryId;savedSettings=JSON.stringify(request.settings);$('broken').disabled=false;updateSaveIcon();}
        reply({ok:true});
      }
      else if(request.type==='SUBTITLE_SAVED') {
        if(state.libraryId===request.libraryId){$('broken').disabled=!request.saved;if(request.settings){applySettings(request.settings);savedSettings=JSON.stringify(currentSettings());}updateSaveIcon();}
        reply({ok:true});
      }
      else if(request.type==='WEBSITE_FILES_READY'){view('saved');message(request.count+' subtitle files saved. Select the correct file.');reply({ok:true});}
      else if(request.type==='WEBSITE_DOWNLOAD_FAILED'){message(request.error,true);reply({ok:true});}
      else if (request.type === 'SHOW_PANEL') { show(); discover(); reply({ok: true, player: Boolean(state.video)}); }
      else if(request.type==='GET_PLAYER_INFO')reply({ok:true,report:playerReport()});
      else if (request.type === 'GET_STATUS') reply({ok: true, player: Boolean(state.video), name: state.name,libraryId:state.libraryId,href:location.href,filmIdentity:currentFilmIdentity()});
    } catch (error) { reply({ok: false, error: error.message}); }
  }
  chrome.runtime.onMessage.addListener(receive);
  document.addEventListener('fullscreenchange', fullscreenChanged);
  document.addEventListener('pointermove',wakeControls);
  document.addEventListener('pointermove',captureControls);
  for(const name of ['pointermove','pointerdown','pointerout','keydown','focusin'])document.addEventListener(name,nativeControlsActivity);
  window.addEventListener('resize',browserFullscreenStatus);
  document.addEventListener('keydown', keydown);
  let discoveryQueued=null,removed=false;
  function scheduleDiscovery(){if(!removed && discoveryQueued===null)discoveryQueued=setTimeout(()=>{discoveryQueued=null;discover();},100);}
  const watchedRoots=new WeakSet(),discoveryObservers=[];
  function watchDiscovery(root){
    if(watchedRoots.has(root))return;watchedRoots.add(root);
    const observer=new MutationObserver(records=>{
      if(records.some(record=>{
        if(record.target===host || record.target.closest?.('#subtitle-overlay-root'))return false;
        if(record.type==='attributes')return true;
        return Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(node=>node.nodeType===1 && node!==host && (node.matches?.('video,track,h1,[data-subtitle-src],[data-caption-src]') || node.querySelector?.('video,track,h1,[data-subtitle-src],[data-caption-src]') || node.shadowRoot || record.target.closest?.('.video-js,.jwplayer,.artplayer-app,.plyr,[data-player]')));
      }))scheduleDiscovery();
    });
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srclang','label','kind','data-subtitle-src','data-caption-src','data-language','data-title','data-season','data-episode']});discoveryObservers.push({root,observer});
  }
  const discoveryTimer=setInterval(discover,1000),drawTimer=setInterval(draw,80);
  for(const name of ['loadedmetadata','loadeddata','emptied','load','error'])document.addEventListener(name,scheduleDiscovery,true);
  chrome.runtime.sendMessage({type:'INSTALL_PLAYER_SOURCES'}).catch(()=>{});
  $('remove').onclick = () => {
    removed=true;clearTimeout(discoveryQueued);for(const item of discoveryObservers)item.observer.disconnect();for(const name of ['loadedmetadata','loadeddata','emptied','load','error'])document.removeEventListener(name,scheduleDiscovery,true);
    playerTracks?.dispose();document.dispatchEvent(new Event('subtitle-overlay-sources-stop'));
    document.removeEventListener('subtitle-overlay-player-clock',pageClockUpdated);document.dispatchEvent(new Event('subtitle-overlay-clock-stop'));observedVideo?.removeAttribute('data-subtitle-overlay-clock');
    observedVideo?.removeEventListener('seeked',seekFinished);
    clearInterval(discoveryTimer); clearInterval(drawTimer);clearTimeout(idleTimer);clearTimeout(controlCaptureTimer);document.removeEventListener('pointermove',captureControls); chrome.runtime.onMessage.removeListener(receive);
    document.removeEventListener('fullscreenchange', fullscreenChanged); document.removeEventListener('keydown', keydown);document.removeEventListener('pointermove',wakeControls);window.removeEventListener('resize',browserFullscreenStatus);
    if(uiFont)document.fonts.delete(uiFont);
    host.remove(); delete globalThis.__subtitleOverlay;
    for(const name of ['pointermove','pointerdown','pointerout','keydown','focusin'])document.removeEventListener(name,nativeControlsActivity);
  };
  globalThis.__subtitleOverlay = {show}; mount(); renderCues(); discover();browserFullscreenStatus();
})();
