(() => {
  const startHidden=globalThis.__subtitleOverlayStartHidden===true;delete globalThis.__subtitleOverlayStartHidden;
  if (globalThis.__subtitleOverlay) { if(!startHidden)globalThis.__subtitleOverlay.show(); return; }
  const core = globalThis.SubtitleCore;
  const settingsCore=globalThis.SubtitleSettings;
  let sourceText='',savedSettings='',anchors=[],lastCueIndex=-1,lastSyncTime=null,savingPreset=false,localChoices=[];
  let cueWindowSource=null,cueWindowFilter=null,cueWindowStart=-1,cueWindowMatches=[];
  let observedVideo=null;
  let nativeSubtitleMode=false,nativeSubtitleId='',playerTracksSignature='',playerTrackBusy=false;
  let manualCueSelection=null;
  let pageClock=null,clockToken='',clockBridgeError='';
  let clockSample=null,clockLastNative=null,clockTimelineElement=null,clockNeedsPosition=false,timelineElements=[],timelineChecked=-Infinity;
  const state = {cues: [], ends: [], delay: 0, rate: 1, size: 30, font: 'system-ui, sans-serif', shadow:true, shadowColor:'#000000', shadowOpacity:100, shadowBlur:3, shadowOffset:2, color: '#edf0fb', background: '#000000', opacity: 72, bottom: 10, enabled: true, name: '', libraryId:null, browserFullscreen:false, video: null, href: location.href};
  const host = document.createElement('div'); host.id = 'subtitle-overlay-root'; host.dir='ltr'; host.lang='en';
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;direction:ltr!important;unicode-bidi:isolate!important;';
  const shadow = host.attachShadow({mode: 'open'});
  const saveIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 3h13l4 4v14H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></svg>';
  // Static markup only. Imported and downloaded strings always use textContent.
  shadow.innerHTML = `<style>
    :host{color-scheme:dark;font:13px/1.45 system-ui,sans-serif;color:#edf1f7}
    #panel,#captions,#toggle{font:13px/1.45 system-ui,sans-serif;color:#edf1f7;color-scheme:dark}
    *{box-sizing:border-box}[hidden]{display:none!important}button,input,select{font:inherit;color:inherit;min-width:0}button{cursor:pointer}
    #captions{position:fixed;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;padding:0 3%}
    #text{white-space:pre-line;unicode-bidi:plaintext;text-align:center;font-weight:600;line-height:1.35;max-width:100%;background:rgba(0,0,0,.72);padding:.12em .4em;border-radius:5px;text-shadow:0 2px 3px #000;overflow-wrap:anywhere}#text:empty{display:none}
    #toggle{position:fixed;top:20px;right:20px;border:1px solid #3a5f7b;background:#102c42d9;color:#79bce9;width:42px;height:38px;border-radius:12px;pointer-events:auto;font-weight:750;opacity:.7}#toggle:hover{opacity:1}
    #panel{position:fixed;right:20px;top:68px;width:304px;max-width:calc(100vw - 40px);max-height:calc(100dvh - 88px);overflow:auto;background:rgba(18,24,32,.98);border:1px solid #344153;border-radius:16px;box-shadow:0 16px 60px #0007;padding:16px;pointer-events:auto}
    header{display:flex;gap:8px;align-items:center;margin-bottom:12px}header svg{width:28px;height:28px;flex:none}h2{font-size:13px;font-weight:650;letter-spacing:-.2px;margin:0;flex:1}
    button{background:#202b38;border:1px solid #344153;padding:8px;border-radius:8px}button:hover{background:#2a3848;border-color:#607086}button:disabled{opacity:.4;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid #216aa3;outline-offset:2px}header button{background:none;border:0;font-size:18px;padding:2px;width:28px;height:28px}
    label{display:block;margin:10px 0 5px;font-size:11px;color:#bec9d7}input,select{display:block;width:100%;padding:8px;background:#0d141d;border:1px solid #344153;border-radius:7px;margin-top:5px}input[type=checkbox]{display:inline;width:auto;margin:0 7px 0 0;accent-color:#79bce9}input[type=range]{padding:0;border:0;accent-color:#79bce9}
    .row{display:flex;gap:6px;margin-top:8px}.row>*{flex:1}.grid{display:grid;grid-template-columns:1fr 70px;gap:10px}.grid label{margin-top:0}.hint{font-size:10px;color:#94a1b2;margin:6px 0;line-height:1.5}.meta{display:flex;align-items:center;justify-content:space-between;gap:8px}.meta #videoStatus{margin:0}.meta #time{font-size:10px;color:#79bce9;font-variant-numeric:tabular-nums}
    .track-row{display:flex;align-items:center;gap:5px;margin-top:9px;padding-bottom:12px;border-bottom:1px solid #2c3848}#filename{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#bec9d7}.track-row button{flex:none;width:30px;height:30px;padding:3px}
    .enabled{margin:12px 0;font-size:12px}.delay-row{display:grid;grid-template-columns:36px 1fr 36px 48px;align-items:end;gap:6px}.delay-row input{margin:0;text-align:center}.delay-row button{height:36px;padding:5px;font-size:12px}.delay-row #earlier,.delay-row #later{font-size:18px}#delay{height:36px}
    details{border-top:1px solid #2c3848;margin-top:12px;padding-top:12px}summary{cursor:pointer;font-size:12px;font-weight:550;list-style:none;display:flex;align-items:center;justify-content:space-between}summary::-webkit-details-marker{display:none}summary::after{content:'+';color:#93a1b4;font-weight:400;font-size:16px}details[open]>summary::after{content:'−'}details[open]>summary{margin-bottom:10px}
    #sync{width:100%;margin-top:8px;background:#216aa3;color:#f2f8fc;border-color:#79bce9;font-weight:600}#sizeNumber{flex:0 0 62px;width:62px;margin-top:0}input[type=color]{height:36px;padding:4px;cursor:pointer}.file input{font-size:11px}#remove{width:100%;margin-top:12px;background:none;color:#a6b3c6;font-size:11px}
    #message{border-top:1px solid #2c3848;margin:12px 0 0;padding-top:10px;color:#a7d5f5;font-size:10px;line-height:1.5;overflow-wrap:anywhere}#message.error{color:#ffb5b5}
      #panel,#toggle{direction:ltr;unicode-bidi:isolate;text-align:left}#panel{top:64px;width:320px;padding:16px;scrollbar-width:thin;scrollbar-color:#42536a transparent}header{gap:10px;margin-bottom:14px}h2{line-height:1.4}header button{flex:none;display:grid;place-items:center}header svg{flex:none}#toggle{display:grid;place-items:center;padding:6px;opacity:.85}#toggle svg{display:block;width:24px;height:24px}
    #videoStatus,#time,#message{unicode-bidi:isolate}#filename{unicode-bidi:plaintext}#time{white-space:nowrap}#filename:hover{white-space:normal;overflow-wrap:anywhere}.enabled{display:flex;align-items:center;gap:8px;margin:14px 0}input[type=checkbox]{margin:0;flex:none}label{line-height:1.5}#delay,#sizeNumber{font-variant-numeric:tabular-nums}details{margin-top:14px;padding-top:12px}summary{min-height:22px}summary::after{margin-left:12px}#text{direction:ltr;unicode-bidi:plaintext}
    nav{display:flex;gap:4px;padding:4px;background:#0c1219;border-radius:9px;margin:0 0 14px}nav button{flex:1;border:0;background:none;padding:6px 3px;font-size:11px;color:#a6b4c6}nav button[aria-selected=true]{background:#2a3849;color:#fff}nav button:hover{background:#233041}
    .fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fields label{margin-top:10px}.search-method{display:flex;gap:8px;align-items:center;margin:12px 0}.search-method label{flex:1;margin:0}.search-method select{width:126px;margin:0;font-size:11px}#overlaySearchButton{width:100%;background:#216aa3;color:#f2f8fc;font-weight:600;border-color:#79bce9}#overlayQuery{margin-top:5px}#overlaySearch>label:first-child{margin-top:0}
    #backgroundColor{height:36px}.swatches{display:grid;grid-template-columns:1fr 1fr;gap:10px}.swatches label{margin-top:10px}#opacityLabel{float:right;color:#94a1b2}#searchLinkSettings{font-size:11px}#overlaySearchUrl{font-size:10px}#saveSearchLink{width:100%;margin-top:8px}
    #overlayResults,#overlayLibrary{max-height:240px;overflow:auto}.result{padding:10px;margin-top:10px;border:1px solid #344153;border-radius:8px;background:#1c2734}.result strong{display:block;font-size:11px;overflow-wrap:anywhere}.result small{display:block;font-size:10px;color:#94a1b2;margin:5px 0 8px;overflow-wrap:anywhere}.result button{width:100%;font-size:11px;padding:7px}.saved-track{display:flex;gap:5px;margin-top:8px}.saved-track button{font-size:10px;padding:8px}.saved-name{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.saved-track .rating{width:32px;flex:none;padding:4px}.rating[aria-pressed=true]{border-color:#79bce9;background:#163b5a}#refreshSaved{width:100%;margin-top:12px;font-size:11px}#overlaySavedFilm{margin-top:0}#view-saved>label{margin-top:0}
    @media(max-height:600px){#panel{top:58px;max-height:calc(100dvh - 70px)}#toggle{top:10px}}
  .rating svg,.track-row button svg{display:block;margin:auto;width:18px;height:18px}#saveSubtitle[aria-pressed=true]{background:#163b5a}#pairSync button{width:100%;margin-top:8px}#anchorStatus{overflow-wrap:anywhere}
  #toggle,#toggle:hover{border:0;background:transparent;box-shadow:none}#filmSuggestion{overflow-wrap:anywhere}.shadow-options{border:0;margin-top:8px;padding-top:6px}.shadow-options .fields{gap:10px}.shadow-options label{margin-top:6px}</style>
  <div id="captions" aria-hidden="true"><div id="text"></div></div>
  <button id="toggle" title="Subtitle controls (Alt+Shift+O)" aria-label="Toggle subtitle controls"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#216aa3"/><path d="M34 32h60a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H62L38 106V92h-4a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10Z" fill="#f2f8fc"/><path d="M43 52h42M43 70h26" fill="none" stroke="#216aa3" stroke-width="9" stroke-linecap="round"/></svg></button>
  <section id="panel" dir="ltr" lang="en" aria-label="Subtitle controls">
    <header><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" aria-hidden="true" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#216aa3"/><path d="M34 32h60a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H62L38 106V92h-4a10 10 0 0 1-10-10V42a10 10 0 0 1 10-10Z" fill="#f2f8fc"/><path d="M43 52h42M43 70h26" fill="none" stroke="#216aa3" stroke-width="9" stroke-linecap="round"/></svg><h2>Subtitle Overlay</h2><button id="fullscreen" title="Full screen (F11)" aria-label="Toggle browser fullscreen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg></button><button id="close" title="Hide controls" aria-label="Hide subtitle controls"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20"/></svg></button></header>
    <nav role="tablist" aria-label="Overlay tools"><button id="tab-controls" role="tab" aria-controls="view-controls" aria-selected="true">Controls</button><button id="tab-find" role="tab" aria-controls="view-find" aria-selected="false" tabindex="-1">Find</button><button id="tab-saved" role="tab" aria-controls="view-saved" aria-selected="false" tabindex="-1">Saved</button></nav>
    <div id="view-controls" role="tabpanel" aria-labelledby="tab-controls">
    <div class="meta"><p id="videoStatus" class="hint">Find video…</p><span id="time">00:00:00</span></div>
    <div class="track-row"><span id="filename" dir="auto" title="Active subtitle file">No subtitle file</span><button id="saveSubtitle" title="Save subtitle and settings" aria-label="Save subtitle and settings" disabled>${saveIcon}</button><button id="broken" title="Delete this saved subtitle" aria-label="Subtitle doesn't work; delete it" disabled>👎</button></div>
    <label class="enabled"><input id="enabled" type="checkbox" checked>Show subtitles</label>
    <label for="delay">Delay (seconds)</label><div class="delay-row"><button id="earlier" title="Show subtitles 0.25 seconds earlier" aria-label="Show subtitles earlier">−</button><input id="delay" type="number" value="0" step="0.25" min="-86400" max="86400"><button id="later" title="Show subtitles 0.25 seconds later" aria-label="Show subtitles later">+</button><button id="reset" title="Reset timing">Reset</button></div>
    <p class="hint">A positive delay shows subtitles later.</p>
    <details id="syncSettings"><summary>Sentence sync</summary><label for="syncMode">Use</label><select id="syncMode"><option value="one">One sentence</option><option value="two">Two sentences</option><option value="three">Three sentences</option></select><p id="syncHint" class="hint">The current line is selected as the film plays. Pause when you hear a line start. Check the selected line, then click Sync.</p><label for="filter">Words you hear</label><input id="filter" placeholder="Enter part of the line" maxlength="200"><select id="cues" aria-label="Subtitle line to sync"></select><button id="sync">Sync to now</button><div id="pairSync" hidden><p id="anchorStatus" class="hint">No sync points set.</p><button id="markFirst">Set first point</button><button id="syncSecond" disabled>Sync second point</button><button id="syncThird" hidden disabled>Sync third point</button><button id="clearAnchors">Clear points</button></div></details>
    <details id="textSettings"><summary>Text style</summary><div class="grid"><label>Font<select id="font"><option value="system-ui, sans-serif">System</option><option value="Arial, sans-serif">Arial</option><option value="Verdana, sans-serif">Verdana</option><option value="Tahoma, sans-serif">Tahoma</option><option value="Georgia, serif">Georgia</option><option value="'Courier New', monospace">Courier New</option></select></label><label>Color<input id="color" type="color" value="#edf0fb"></label></div><div class="swatches"><label>Background<input id="backgroundColor" type="color" value="#000000" aria-label="Subtitle background color"></label><label>Opacity <span id="opacityLabel">72%</span><input id="backgroundOpacity" type="range" min="0" max="100" value="72" aria-label="Subtitle background opacity"></label></div><p class="hint">0% is clear. 100% is solid.</p><details id="shadowSettings" class="shadow-options"><summary>Shadow</summary><label class="enabled"><input id="shadowEnabled" type="checkbox" checked>Show shadow</label><div class="fields"><label>Color<input id="shadowColor" type="color" value="#000000"></label><label>Opacity<input id="shadowOpacity" type="range" min="0" max="100" value="100"></label><label>Blur (px)<input id="shadowBlur" type="number" min="0" max="20" value="3"></label><label>Offset (px)<input id="shadowOffset" type="number" min="0" max="20" value="2"></label></div></details><label>Size <span id="sizeLabel">30px</span></label><div class="row"><input id="size" type="range" min="12" max="96" value="30" aria-label="Subtitle size slider"><input id="sizeNumber" type="number" min="12" max="96" value="30" aria-label="Subtitle size in pixels"></div><label>Height <span id="bottomLabel">10%</span><input id="bottom" type="range" min="2" max="65" value="10"></label></details>
    <details id="advancedSettings"><summary>More settings</summary><label for="rate">Timing scale (%)</label><input id="rate" type="number" value="100" step="0.1" min="50" max="200"><p class="hint">Use 100 for normal timing. Increase this if subtitles gradually appear too early.</p><label class="file">Load subtitle file<input id="file" type="file" accept=".srt,.vtt,.sub,.ass,.ssa,.zip,.gz"></label><select id="localTracks" aria-label="Choose a subtitle file from the archive" hidden></select><label>File encoding<select id="encoding"><option value="utf-8">Automatic (UTF-8 / UTF-16)</option><option value="windows-1256">Arabic (Windows-1256)</option><option value="windows-1252">Western (Windows-1252)</option><option value="utf-16le">UTF-16 LE</option></select></label><label for="fileFps">SUB FPS (if needed)</label><input id="fileFps" type="number" min="1" max="120" step=".001" placeholder="23.976"><p class="hint">Use the FPS listed for a frame-based SUB file.</p><p class="hint">Alt+Shift+O: show controls.<br>Alt+Shift+Left/Right: change delay.</p><button id="remove">Remove overlay</button></details>
    </div>
    <div id="view-find" role="tabpanel" aria-labelledby="tab-find" hidden>
      <details id="playerTracksSettings"><summary>Player subtitles <span id="playerTrackCount">0</span></summary><select id="playerTracks" aria-label="Subtitle track from this player"></select><p id="playerTracksHint" class="hint">No readable tracks. Select a subtitle language in the player, then refresh.</p><div class="row"><button id="usePlayerTrack" disabled>Use player</button><button id="importPlayerTrack" disabled>Import</button></div><div class="row"><button id="refreshPlayerTracks">Refresh</button><button id="restorePlayerTracks">Restore player</button></div><p class="hint">Use player keeps its display. Import loads lines for timing, style, and saving.</p></details>
      <form id="overlaySearch"><p id="filmSuggestion" class="hint" hidden></p><label for="overlayQuery">Film title</label><input id="overlayQuery" required maxlength="200" placeholder="Enter a film title"><div class="fields"><label>Language<input id="overlayLanguage" value="en" maxlength="40" placeholder="en, ar, de…"></label><label>Year (optional)<input id="overlayYear" type="number" min="1880" max="2199" placeholder="2004"></label></div><div class="search-method"><label for="overlaySearchMode">Search with</label><select id="overlaySearchMode"><option value="website">Website</option><option value="api">API</option></select></div><button id="overlaySearchButton" type="submit">Open OpenSubtitles</button></form>
      <p id="overlaySearchHint" class="hint">Website search needs no extension API key.</p><div id="overlayResults"></div>
      <details id="searchLinkSettings"><summary>Edit search link</summary><label for="overlaySearchUrl">Search URL</label><input id="overlaySearchUrl" type="url" maxlength="2000"><p class="hint">Use {title}, {language}, {language3}, and {year}.</p><button id="saveSearchLink">Save link</button></details>
    </div>
    <div id="view-saved" role="tabpanel" aria-labelledby="tab-saved" hidden><label for="overlaySavedFilm">Film</label><select id="overlaySavedFilm" hidden></select><div id="overlayLibrary"></div><p id="savedHint" class="hint">No saved subtitles.</p><button id="refreshSaved">Refresh saved files</button></div>
    <p id="message" role="status" aria-live="polite">Load a file or find subtitles in the extension.</p>
  </section>`;
  const $ = id => shadow.getElementById(id);
  $('panel').hidden=startHidden;
  const playerTracks=globalThis.SubtitlePlayerTracks?.create({getVideo:()=>state.video,getTime:()=>playbackTime(),core});
  function setNativeSubtitleMode(active) {
    nativeSubtitleMode=active;if(!active)nativeSubtitleId='';
    const label=active ? 'Player: '+(playerTracks?.list().find(track=>track.id===nativeSubtitleId)?.label || 'Subtitles') : state.name || 'No subtitle file';
    $('filename').textContent=label;$('filename').title=label;$('broken').disabled=active || !state.libraryId;
    for(const id of ['enabled','delay','earlier','later','reset','rate'])$(id).disabled=active;
    $('textSettings').inert=active;$('syncSettings').inert=active;
    updateSyncButtons();updateSaveIcon();
  }
  function refreshPlayerTracks(force=false) {
    const tracks=playerTracks?.list() || [],signature=JSON.stringify(tracks);
    if(nativeSubtitleMode && !tracks.some(track=>track.id===nativeSubtitleId))setNativeSubtitleMode(false);
    if(!force && signature===playerTracksSignature)return tracks;
    playerTracksSignature=signature;const previous=$('playerTracks').value;
    $('playerTracks').replaceChildren();
    for(const track of tracks){const option=document.createElement('option');option.value=track.id;option.textContent=track.label+(track.language && track.language!==track.label ? ' · '+track.language : '')+' · '+(track.count===null ? 'not loaded' : track.count+' lines');$('playerTracks').append(option);}
    $('playerTracks').value=tracks.some(track=>track.id===previous) ? previous : (tracks.find(track=>track.mode==='showing') || tracks[0])?.id || '';
    $('playerTrackCount').textContent=String(tracks.length);$('playerTracks').disabled=!tracks.length;
    $('usePlayerTrack').disabled=playerTrackBusy || !tracks.length;$('importPlayerTrack').disabled=playerTrackBusy || !tracks.length;
    $('playerTracksHint').textContent=tracks.length ? 'Select a track. Import loads its file or copies readable lines.' : 'No readable tracks. Select a subtitle language in the player, then refresh.';
    return tracks;
  }
  async function playerTrackAction(action,id) {
    if(!playerTracks)throw new Error('Reload the extension and film tab first.');
    if(playerTrackBusy)throw new Error('Wait for the current track to load.');
    playerTrackBusy=true;
    try {
    if(action==='restore'){playerTracks.restore();setNativeSubtitleMode(false);message('Player subtitle choices restored.');}
    else if(action==='original'){playerTracks.use(id);nativeSubtitleId=id;setNativeSubtitleMode(true);view('controls');message('Player subtitles shown. Import to change timing or style.');}
    else if(action==='import'){
      const snapshot=await playerTracks.read(id);load(snapshot.text,snapshot.name);playerTracks.hide();
      state.enabled=true;$('enabled').checked=true;if(snapshot.language)$('overlayLanguage').value=snapshot.language;
      message(snapshot.count+' loaded lines imported. Timing, text style, and Save are available. Import again if the player loads more lines.');
    }else throw new Error('Choose Use player, Import, or Restore player.');
    if(action!=='restore')show();refreshPlayerTracks(true);draw();return {count:state.cues.length,tracks:playerTracks.list()};
    } finally {playerTrackBusy=false;refreshPlayerTracks(true);}
  }
  for(const [id,action] of [['usePlayerTrack','original'],['importPlayerTrack','import'],['restorePlayerTracks','restore']])$(id).onclick=event=>{if(event.isTrusted)task($(id),()=>playerTrackAction(action,$('playerTracks').value));};
  $('refreshPlayerTracks').onclick=event=>{if(event.isTrusted)refreshPlayerTracks(true);};
  // Native details groups keep one settings section open at a time.
  for (const id of ['syncSettings', 'textSettings', 'advancedSettings']) $(id).name = 'subtitle-settings';
  function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }

  for(const id of ['fullscreen','close']) $(id).querySelector('svg').style.cssText='width:18px;height:18px;';
  let savedEntries=[],filmIdentity='',committedFilm=null,pendingFilmIdentity='',routeRevision=0;
  const filmName=value=>String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const filmRank=film=>['Tab title','Page title','Visible title','Page metadata','Player metadata'].indexOf(film?.source);
  function retainFilm(film){
    if(committedFilm && (!film || state.video?.seeking || state.cues.length && filmRank(film)<filmRank(committedFilm)))return committedFilm;
    return committedFilm && film && filmName(film.title)===filmName(committedFilm.title) && !film.year ? {...film,year:committedFilm.year} : film;
  }
  function identityOf(film){return location.href+'|'+filmName(film?.title)+'|'+(film?.year || '');}
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
    if(focus) $('tab-'+name).focus();
    if(name==='saved' && refresh) refreshSaved().catch(error=>message(error.message,true));
  }
  for(const [index,name] of views.entries()) {
    $('tab-'+name).onclick=event=>{if(event.isTrusted)view(name);};
    $('tab-'+name).onkeydown=event=>{
      if(!event.isTrusted)return;let next;
      if(event.key==='ArrowRight')next=(index+1)%views.length;
      if(event.key==='ArrowLeft')next=(index+views.length-1)%views.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=views.length-1;
      if(next!==undefined){event.preventDefault();view(views[next],true);}
    };
  }
  const query=()=>({query:$('overlayQuery').value,language:$('overlayLanguage').value,year:$('overlayYear').value,mode:$('overlaySearchMode').value});
  function searchMode() {
    const api=$('overlaySearchMode').value==='api';
    $('overlaySearchButton').textContent=api ? 'Find subtitles' : 'Open OpenSubtitles';
    $('overlaySearchHint').textContent=api ? 'API search needs a key. Set it in the extension Settings.' : 'Select a file in the search window. It saves and loads automatically.';
    $('overlayResults').replaceChildren();
  }
  $('overlaySearchMode').onchange=()=>{searchMode();rpc('OVERLAY_PREFERENCES',{mode:$('overlaySearchMode').value}).catch(error=>message(error.message,true));};
  $('saveSearchLink').onclick=event=>{if(event.isTrusted)task($('saveSearchLink'),async()=>{await rpc('OVERLAY_PREFERENCES',{urlTemplate:$('overlaySearchUrl').value});message('Search link saved.');});};
  function renderSaved() {
    $('overlayLibrary').replaceChildren();
    for(const entry of savedEntries.filter(item=>item.filmKey===$('overlaySavedFilm').value)) {
      const row=document.createElement('div');row.className='saved-track';
      const button=document.createElement('button');button.className='saved-name';button.textContent=(entry.language ? entry.language+' · ' : '')+entry.name;button.title=entry.name;
      button.onclick=event=>{if(event.isTrusted)task(button,async()=>{const loaded=await rpc('OVERLAY_LOAD',{id:entry.id});view('controls');message(loaded.count+' saved lines loaded.');});};
      row.append(button);
      const save=document.createElement('button');save.className='rating';save.innerHTML=saveIcon;
      save.title='Save current subtitle settings';save.setAttribute('aria-label',save.title);save.disabled=entry.id!==state.libraryId;
      save.setAttribute('aria-pressed',String(Boolean(entry.settingsSaved)));
      save.onclick=event=>{if(event.isTrusted)task(save,async()=>{await saveCurrent(entry.id);await refreshSaved();});};
      const bad=document.createElement('button');bad.className='rating';bad.textContent='👎';bad.title='Delete this saved subtitle';bad.setAttribute('aria-label',bad.title);
      bad.onclick=event=>{if(event.isTrusted)task(bad,async()=>{await rpc('OVERLAY_RATE',{id:entry.id,verdict:'bad'});await refreshSaved();message('Subtitle deleted. This file will not appear in search results.');});};
      row.append(save,bad);
      $('overlayLibrary').append(row);
    }
    $('savedHint').textContent=savedEntries.length ? 'Load a file. Save stores its settings. 👎 deletes it.' : 'No saved subtitles. Downloads are saved here by film.';
  }
  async function refreshSaved(preferred) {
    const previous=preferred || $('overlaySavedFilm').value,revision=routeRevision;
    const entries=(await rpc('OVERLAY_LIBRARY')).entries;if(revision!==routeRevision)return;savedEntries=entries;
    $('overlaySavedFilm').replaceChildren();const seen=new Set();
    for(const entry of savedEntries) {
      if(seen.has(entry.filmKey))continue;seen.add(entry.filmKey);
      const option=document.createElement('option');option.value=entry.filmKey;option.textContent=entry.title+(entry.year ? ' ('+entry.year+')' : '');$('overlaySavedFilm').append(option);
    }
    $('overlaySavedFilm').hidden=!savedEntries.length;
    if(seen.has(previous))$('overlaySavedFilm').value=previous;renderSaved();
  }
  $('overlaySavedFilm').onchange=renderSaved;
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
  rpc('OVERLAY_SETTINGS').then(settings=>{
    const prefs=settings.preferences;$('overlayQuery').value=prefs.title || '';$('overlayLanguage').value=prefs.language;$('overlayYear').value=prefs.year || '';
    $('overlaySearchMode').value=prefs.mode;$('overlaySearchUrl').value=prefs.urlTemplate;searchMode();
    suggestFilm();
  }).catch(error=>message(error.message,true));
  let detectedTitle='',detectedYear='';
  function suggestFilm(film=retainFilm(globalThis.SubtitleFilm?.detect())) {
    if(!film)return;
    const input=$('overlayQuery');
    if(!detectedTitle || !input.value || input.value===detectedTitle){
      input.value=film.title;
      if(!detectedTitle || !$('overlayYear').value || $('overlayYear').value===detectedYear)$('overlayYear').value=film.year;
    }
    detectedTitle=film.title;detectedYear=film.year;
    $('filmSuggestion').hidden=false;$('filmSuggestion').textContent=(film.source==='Player metadata' ? 'From player: ' : 'From page: ')+film.title;
    return film;
  }

  async function routeFilm(film) {
    view('find');const revision=routeRevision,identity=filmIdentity;
    try{
      const entries=(await rpc('OVERLAY_LIBRARY')).entries;
      if(revision!==routeRevision || identity!==filmIdentity || state.cues.length)return;
      const matching=film && entries.find(entry=>filmName(entry.title)===filmName(film.title) && (!film.year || !entry.year || String(entry.year)===String(film.year)));
      if(matching){view('saved',false,false);await refreshSaved(matching.filmKey);}
    }catch(error){if(revision===routeRevision)message(error.message,true);}
  }
  function clearFilm() {
    playerTracks?.restore();setNativeSubtitleMode(false);
    clockToken=crypto.randomUUID();pageClock=null;clockSample=null;clockLastNative=null;clockTimelineElement=null;clockNeedsPosition=false;manualCueSelection=null;lastControlSnapshot=null;
    observedVideo?.setAttribute('data-subtitle-overlay-clock',clockToken);
    sourceText='';savedSettings='';anchors=[];localChoices=[];lastCueIndex=-1;lastSyncTime=null;
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
    const candidates=videos(document).map(videoInfo).filter(item=>item.visible);
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
      if(changed){clearFilm();if(film){$('overlayQuery').value=film.title;$('overlayYear').value=film.year;}}routeFilm(film);
    }else if(sameTitle && film){committedFilm={...film,year:film.year || committedFilm?.year || ''};}
    suggestFilm(committedFilm || film);
    $('videoStatus').textContent = state.video ? 'Video connected' : 'Start the film to connect.';
    refreshPlayerTracks();mount(); draw();
  }
  function seekFinished(){lastSyncTime=-1;lastCueIndex=-1;clockNeedsPosition=clockNeedsPosition || Boolean(clockSample);clockSample=null;clockLastNative=null;timelineChecked=-Infinity;}
  function draw() {
    const video = state.video;
    if (!video?.isConnected) { $('text').textContent = ''; return; }
    const rect = video.getBoundingClientRect();
    const bottom = rect.bottom - rect.height * state.bottom / 100;
    $('captions').style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${Math.max(0, bottom - rect.top)}px;`;
    $('text').style.fontSize = `${state.size}px`;
    $('text').style.fontFamily = state.font;
    $('text').style.color = state.color;
    const rgb=[1,3,5].map(at=>parseInt(state.background.slice(at,at+2),16));
    $('text').style.backgroundColor='rgba('+rgb.join(',')+','+(state.opacity/100)+')';
    const shadowRgb=[1,3,5].map(at=>parseInt(state.shadowColor.slice(at,at+2),16));
    $('text').style.textShadow=state.shadow ? '0 '+state.shadowOffset+'px '+state.shadowBlur+'px rgba('+shadowRgb.join(',')+','+(state.shadowOpacity/100)+')' : 'none';
    const clock=playbackClock(),time=clock.time;
    const text = state.enabled && !nativeSubtitleMode ? core.active(state.cues, state.ends, time, state.delay, state.rate) : '';
    if ($('text').textContent !== text) $('text').textContent = text;
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
    const ready=Boolean(!nativeSubtitleMode && state.video?.isConnected && !state.video.seeking && Number.isFinite(playbackTime()) && $('cues').value && state.cues[Number($('cues').value)]);
    $('sync').disabled=!ready;$('markFirst').disabled=!ready;$('syncSecond').disabled=!ready || !anchors.length;$('syncThird').disabled=!ready || anchors.length<2;
  }
  function load(text, name, libraryId=null, preset) {
    const cues = core.parse(text); // Parse first: bad imports preserve the current valid track.
    const settings=preset ? settingsCore.validate(preset,cues) : null;
    playerTracks?.restore();setNativeSubtitleMode(false);
    sourceText=text;savedSettings='';anchors=[];lastCueIndex=-1;lastSyncTime=null;manualCueSelection=null;localChoices=[];$('localTracks').hidden=true;
    state.cues = cues; state.ends = core.createIndex(cues); state.name = String(name || 'Subtitles').slice(0, 250);
    state.libraryId=libraryId; $('saveSubtitle').disabled=false; $('broken').disabled=!libraryId;
    state.delay = 0; state.rate = 1; $('delay').value = '0'; $('rate').value = '100'; $('filter').value = '';
    if(settings){applySettings(settings);savedSettings=JSON.stringify(currentSettings());}else{$('syncMode').value='one';syncMode();}
    $('filename').textContent = state.name; $('filename').title = state.name; view('controls');renderCues(); draw();
    message(`${cues.length} lines loaded.${settings ? ' Saved timing and text style restored.' : ' Adjust the delay if needed.'}`);
    return cues.length;
  }
  function clearSaved(id) {
    if(state.libraryId!==id) return;
    playerTracks?.restore();setNativeSubtitleMode(false);
    sourceText='';savedSettings='';anchors=[];localChoices=[];$('localTracks').hidden=true;state.cues=[];state.ends=[];state.name='';state.libraryId=null; $('filename').textContent='No subtitle file';$('saveSubtitle').disabled=true;$('broken').disabled=true;renderCues();draw();message('Subtitle deleted. Choose another file.');
  }
  function currentSettings(){
    return {...Object.fromEntries(Object.keys(settingsCore.defaults).filter(key=>key in state).map(key=>[key,state[key]])),encoding:$('encoding').value,syncMode:$('syncMode').value,anchors};
  }
  function updateSaveIcon(){
    $('saveSubtitle').disabled=nativeSubtitleMode || !state.cues.length || savingPreset;
    const saved=Boolean(savedSettings && savedSettings===JSON.stringify(currentSettings()));
    $('saveSubtitle').setAttribute('aria-pressed',String(saved));$('saveSubtitle').style.borderColor=saved ? '#216aa3' : '';
    $('saveSubtitle').title=saved ? 'Subtitle and current settings saved' : 'Save subtitle and settings';
  }
  function applySettings(settings){
    const clean=settingsCore.validate(settings,state.cues);Object.assign(state,Object.fromEntries(Object.entries(clean).filter(([key])=>key in state)));
    anchors=clean.anchors;$('encoding').value=clean.encoding;$('syncMode').value=clean.syncMode;
    for(const [id,key] of [['delay','delay'],['font','font'],['color','color'],['backgroundColor','background'],['backgroundOpacity','opacity'],['bottom','bottom'],['shadowColor','shadowColor'],['shadowOpacity','shadowOpacity'],['shadowBlur','shadowBlur'],['shadowOffset','shadowOffset']])$(id).value=String(key==='delay' ? Math.round(state.delay*1000)/1000 : state[key]);
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
  $('font').onchange = () => { state.font = $('font').value; draw(); };
  $('color').oninput = () => { state.color = $('color').value; draw(); };
  $('shadowEnabled').onchange=()=>{state.shadow=$('shadowEnabled').checked;draw();};
  $('shadowColor').oninput=()=>{state.shadowColor=$('shadowColor').value;draw();};
  for(const [id,key,max] of [['shadowOpacity','shadowOpacity',100],['shadowBlur','shadowBlur',20],['shadowOffset','shadowOffset',20]]) $(id).oninput=()=>{state[key]=Math.max(0,Math.min(max,Number($(id).value)||0));draw();};
  $('backgroundColor').oninput=()=>{state.background=$('backgroundColor').value;draw();};
  $('backgroundOpacity').oninput=()=>{state.opacity=Number($('backgroundOpacity').value);$('opacityLabel').textContent=state.opacity+'%';draw();};
  function setSize(value) {
    if (!Number.isFinite(value) || value < 12 || value > 96) return;
    state.size = Math.round(value); $('size').value = String(state.size); $('sizeNumber').value = String(state.size);
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
      if(request.type==='GET_PLAYER_TRACKS'){discover();reply({ok:true,tracks:refreshPlayerTracks(true)});return;}
      if(request.type==='PLAYER_TRACK_ACTION'){playerTrackAction(request.action,request.id).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;}
      if(request.type==='GET_SUBTITLE_SNAPSHOT' && nativeSubtitleMode)throw new Error('Import the player track before saving it.');
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
  window.addEventListener('resize',browserFullscreenStatus);
  document.addEventListener('keydown', keydown);
  const discoveryTimer = setInterval(discover, 1200), drawTimer = setInterval(draw, 80);
  $('remove').onclick = () => {
    playerTracks?.restore();
    document.removeEventListener('subtitle-overlay-player-clock',pageClockUpdated);document.dispatchEvent(new Event('subtitle-overlay-clock-stop'));observedVideo?.removeAttribute('data-subtitle-overlay-clock');
    observedVideo?.removeEventListener('seeked',seekFinished);
    clearInterval(discoveryTimer); clearInterval(drawTimer);clearTimeout(idleTimer);clearTimeout(controlCaptureTimer);document.removeEventListener('pointermove',captureControls); chrome.runtime.onMessage.removeListener(receive);
    document.removeEventListener('fullscreenchange', fullscreenChanged); document.removeEventListener('keydown', keydown);document.removeEventListener('pointermove',wakeControls);window.removeEventListener('resize',browserFullscreenStatus);
    host.remove(); delete globalThis.__subtitleOverlay;
  };
  globalThis.__subtitleOverlay = {show}; mount(); renderCues(); discover();browserFullscreenStatus();
})();
