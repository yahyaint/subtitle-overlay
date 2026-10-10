const $ = id => document.getElementById(id);
let tabId, lastDownload;
let savedEntries=[];
let activeLibraryId=null;
let localChoices=[];
let playerTrackBusy=false;
const saveIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 3h13l4 4v14H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></svg>';
let defaultSearchUrl;
function searchMode() {
  const api=$('searchMode').value==='api';
  $('searchButton').textContent=api ? 'Find subtitles' : 'Open OpenSubtitles';
  $('searchHint').textContent=api ? 'API search needs a key.' : 'Website search needs no extension API key.';
  $('results').replaceChildren();
}
$('searchMode').onchange=()=>{searchMode();provider({type:'SAVE_SUBTITLE_SEARCH',mode:$('searchMode').value}).catch(error=>status(error.message,true));};
$('websiteForm').onsubmit=event=>{event.preventDefault();task(event.submitter,async()=>{await provider({type:'SAVE_SUBTITLE_SEARCH',urlTemplate:$('searchUrl').value});status('Search link saved.');});};
$('resetSearchUrl').onclick=()=>task($('resetSearchUrl'),async()=>{await provider({type:'SAVE_SUBTITLE_SEARCH',urlTemplate:defaultSearchUrl});$('searchUrl').value=defaultSearchUrl;status('Default search link restored.');});
const views = ['find', 'saved', 'settings'];
function showView(name, focus = false) {
  for (const view of views) {
    const selected = view === name;
    $('view-' + view).hidden = !selected;
    $('tab-' + view).setAttribute('aria-selected', String(selected));
    $('tab-' + view).tabIndex = selected ? 0 : -1;
  }
  if (focus) $('tab-' + name).focus();
}
for (const [index, view] of views.entries()) {
  $('tab-' + view).onclick = () => showView(view);
  $('tab-' + view).onkeydown = event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % views.length;
    if (event.key === 'ArrowLeft') next = (index + views.length - 1) % views.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = views.length - 1;
    if (next !== undefined) { event.preventDefault(); showView(views[next], true); }
  };
}
$('setupLink').onclick = () => { showView('settings'); $('providerSetup').open = true; $('key').focus(); };
$('savePlayerReport').onclick=()=>task($('savePlayerReport'),async()=>{await attach();await provider({type:'EXPORT_PLAYER_REPORT',tabId});status('Report download started. Save the file if your browser asks.');});
function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
async function provider(message) {
  const reply = await chrome.runtime.sendMessage(message);
  if (!reply?.ok) throw new Error(reply?.error || 'Extension unavailable. Reload the extension.');
  return reply;
}
async function attach(show=true) {
  if (!tabId) throw new Error('Open a film in a normal browser tab first.');
  await chrome.scripting.executeScript({target:{tabId},func:hidden=>{globalThis.__subtitleOverlayStartHidden=hidden;},args:[!show]});
  await chrome.scripting.executeScript({target: {tabId}, files: ['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js', 'content.js']});
  const reply = await chrome.tabs.sendMessage(tabId, {type: show ? 'SHOW_PANEL' : 'GET_STATUS'});
  if (!reply?.ok) throw new Error('Could not attach overlay.');
  $('player').textContent = reply.player ? 'Video connected. Controls are on the video.' : 'Start the film to connect the video.';
  return reply;
}
async function refreshPlayerTracks() {
  if(playerTrackBusy)return;
  const reply=await chrome.tabs.sendMessage(tabId,{type:'GET_PLAYER_TRACKS'});
  if(!reply?.ok)throw new Error(reply?.error || 'Open controls to connect the video.');
  const previous=$('playerTracks').value,tracks=reply.tracks;
  $('playerTracks').replaceChildren();
  for(const track of tracks){const option=document.createElement('option');option.value=track.id;option.textContent=track.label+(track.language && track.language!==track.label ? ' · '+track.language : '')+' · '+(track.count===null ? 'not loaded' : track.count+' lines');$('playerTracks').append(option);}
  $('playerTracks').value=tracks.some(track=>track.id===previous) ? previous : (tracks.find(track=>track.mode==='showing') || tracks[0])?.id || '';
  $('playerTrackCount').textContent=String(tracks.length);$('playerTracks').disabled=!tracks.length;
  $('usePlayerTrack').disabled=!tracks.length;$('importPlayerTrack').disabled=!tracks.length;
  $('playerTracksHint').textContent=tracks.length ? 'Select a track. Import copies the lines the player exposes.' : 'No readable tracks. Select a language in the player, then refresh.';
}
for(const [id,action] of [['usePlayerTrack','original'],['importPlayerTrack','import'],['restorePlayerTracks','restore']])$(id).onclick=()=>task($(id),async()=>{
  playerTrackBusy=true;
  try{await attach(false);const reply=await chrome.tabs.sendMessage(tabId,{type:'PLAYER_TRACK_ACTION',action,id:$('playerTracks').value});if(!reply?.ok)throw new Error(reply?.error || 'Track load failed.');status(action==='import' ? reply.count+' loaded lines imported. Use video controls for timing, style, and Save.' : action==='original' ? 'Player subtitles shown. Import to change timing or style.' : 'Player subtitle choices restored.');}
  finally{playerTrackBusy=false;await refreshPlayerTracks();}
});
$('refreshPlayerTracks').onclick=()=>task($('refreshPlayerTracks'),async()=>{await attach(false);await refreshPlayerTracks();});
async function task(button, action) {
  button.disabled = true;
  try { await action(); } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
}
function renderLibrary() {
  $('library').replaceChildren();
  const entries=savedEntries.filter(item=>item.filmKey===$('savedFilm').value);
  for(const entry of entries) {
    const row=document.createElement('div');row.className='saved-track';
    const load=document.createElement('button');load.className='saved-name';load.textContent=`${entry.language ? `${entry.language} · ` : ''}${entry.name}`;load.title=entry.name;
    load.onclick=()=>task(load,async()=>{await attach();lastDownload=await provider({type:'LIBRARY_LOAD',id:entry.id,tabId});activeLibraryId=entry.id;renderLibrary();$('saveFile').hidden=false;status(`${lastDownload.count} saved lines loaded. Saved settings restored if available.`);});
    const good=document.createElement('button');good.className='rating';good.innerHTML=saveIcon;good.title=entry.id===activeLibraryId ? 'Save current subtitle settings' : 'Load this file to save its settings';good.setAttribute('aria-label',good.title);good.setAttribute('aria-pressed',String(Boolean(entry.settingsSaved)));good.disabled=entry.id!==activeLibraryId;
    good.onclick=()=>task(good,async()=>{await provider({type:'SAVE_ACTIVE_SUBTITLE',libraryId:entry.id,tabId});await refreshLibrary(entry.filmKey);status('Subtitle, timing, and text style saved.');});
    const bad=document.createElement('button');bad.className='rating';bad.textContent='👎';bad.title="Doesn't work — delete saved subtitle";bad.setAttribute('aria-label',"Subtitle doesn't work; delete it");
    bad.onclick=()=>task(bad,async()=>{await provider({type:'LIBRARY_RATE',id:entry.id,verdict:'bad',tabId});lastDownload=null;$('saveFile').hidden=true;await refreshLibrary(entry.filmKey);status('Subtitle deleted. This file will not appear in search results.');});
    row.append(load,good,bad);$('library').append(row);
  }
  $('libraryHint').textContent=savedEntries.length ? 'Load a file. Save stores its settings. 👎 deletes it.' : 'No saved subtitles. Downloads are saved here by film.';
  $('savedCount').textContent=String(savedEntries.length);
}
async function refreshLibrary(selected) {
  try{activeLibraryId=(await chrome.tabs.sendMessage(tabId,{type:'GET_STATUS'}))?.libraryId || null;}catch{activeLibraryId=null;}
  const previous=selected || $('savedFilm').value;
  savedEntries=(await provider({type:'LIBRARY_LIST'})).entries;
  $('savedFilm').replaceChildren(); const seen=new Set();
  for(const entry of savedEntries) {
    if(seen.has(entry.filmKey)) continue;seen.add(entry.filmKey);
    const option=document.createElement('option');option.value=entry.filmKey;option.textContent=`${entry.title}${entry.year ? ` (${entry.year})` : ''}`;$('savedFilm').append(option);
  }
  $('savedFilm').hidden=!savedEntries.length;
  if(seen.has(previous)) $('savedFilm').value=previous;renderLibrary();
}
$('savedFilm').onchange=()=>{const entry=savedEntries.find(item=>item.filmKey===$('savedFilm').value);if(entry){$('query').value=entry.title;$('year').value=entry.year;}renderLibrary();};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes.subtitleLibrary) refreshLibrary().catch(error=>status(error.message,true));});
$('attach').onclick = () => task($('attach'), async () => { await attach(); status('Controls opened on the video.'); });
$('dubLibrary').onclick = () => {
  const params = new URLSearchParams($('query').value.trim() ? {title: $('query').value, language: $('language').value, year: $('year').value} : {});
  chrome.tabs.create({url: `${chrome.runtime.getURL('dub-library.html')}?${params}`});
};
$('file').onchange = async () => {
  const file = $('file').files[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('Choose a file smaller than 2 MB.');
    await attach();
    const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.subarray(at,at+8192));
    const reply=await provider({type:'IMPORT_LOCAL_SUBTITLE',tabId,data:btoa(binary),name:file.name,encoding:$('encoding').value,fps:Number($('fileFps').value)});
    localChoices=reply.choices;$('localTracks').replaceChildren();for(const [index,choice] of localChoices.entries()){const option=document.createElement('option');option.value=String(index);option.textContent=choice.name;$('localTracks').append(option);}$('localTracks').hidden=localChoices.length<2;
    status(`${reply.count} lines loaded.${localChoices.length>1 ? ' Select an archive file above.' : ' Adjust timing on the video.'}`+(reply.note ? ' '+reply.note : ''));
  } catch (error) { status(error.message, true); }finally{$('file').value='';}
};
$('localTracks').onchange=async()=>{try{const choice=localChoices[Number($('localTracks').value)];if(!choice)return;await attach();const result=await chrome.tabs.sendMessage(tabId,{type:'LOAD_SUBTITLES',...choice});if(!result?.ok)throw new Error(result?.error || 'Load failed.');status(result.count+' lines loaded.'+(choice.note ? ' '+choice.note : ''));}catch(error){status(error.message,true);}};
$('saveKey').onclick = () => task($('saveKey'), async () => {
  if (!$('key').value.trim()) throw new Error('Enter your API key.');
  const enabled = await chrome.permissions.request({origins: ['https://*.opensubtitles.com/*']});
  if (!enabled) throw new Error('Provider access was not enabled. Local file import remains available.');
  await provider({type: 'SAVE_KEY', apiKey: $('key').value}); status('Key saved. Log in if a download requires it.');
});
$('login').onsubmit = event => {
  event.preventDefault(); const button = event.submitter;
  task(button, async () => {
    const password = $('password').value; $('password').value = '';
    if (!$('username').value || !password) throw new Error('Enter username and password.');
    await provider({type: 'LOGIN', username: $('username').value, password}); status('Logged in for this browser session.');
  });
};
$('forget').onclick = () => task($('forget'), async () => {
  await provider({type: 'FORGET'}); await chrome.permissions.remove({origins: ['https://*.opensubtitles.com/*']});
  $('key').value = ''; $('username').value = ''; $('password').value = ''; $('results').replaceChildren(); status('Account access removed. Saved subtitles are kept.');
});
$('search').onsubmit = event => {
  event.preventDefault(); task(event.submitter, async () => {
    const current={query:$('query').value,language:$('language').value.trim(),year:$('year').value,mode:$('searchMode').value};
    await provider({type:'SAVE_SUBTITLE_SEARCH',...current});
    if (current.mode==='website') {
      await attach();await provider({type:'OPEN_SUBTITLE_WEBSITE',...current,tabId});
      status('Search window opened. Subtitle downloads load automatically.');return;
    }
    status('Searching…'); $('results').replaceChildren();
    const {results} = await provider({type: 'SEARCH', query: $('query').value, language: $('language').value.trim(), year: $('year').value});
    for (const result of results) {
      const card = document.createElement('div'); card.className = 'result';
      const title = document.createElement('strong'); title.textContent = result.title || result.name;
      const detail = document.createElement('small'); detail.textContent = `${result.language} · ${result.release || result.name}${result.hearingImpaired ? ' · SDH' : ''}`;
      const button = document.createElement('button'); button.textContent = 'Use subtitles';
      button.onclick = () => task(button, async () => {
        await attach(); status('Download in progress. Keep this window open.');
        const film={title:result.title || $('query').value,year:result.year || $('year').value};
        lastDownload = await provider({type: 'DOWNLOAD', fileId: result.fileId, tabId,film,language:result.language});
        $('saveFile').hidden = false;await refreshLibrary();status(`${lastDownload.count} lines loaded.${lastDownload.saved ? ' Saved for this film.' : ` Save failed: ${lastDownload.saveError}`}`);
      });
      card.append(title, detail, button); $('results').append(card);
    }
    status(results.length ? `${results.length} ${results.length===1 ? 'file' : 'files'} found. Select a file for your film.` : 'No files found. Try another title or language.');
  });
};
$('saveFile').onclick = () => {
  if (!lastDownload) return;
  const url = URL.createObjectURL(new Blob([lastDownload.text], {type: 'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = lastDownload.name.replace(/[\\/:*?"<>|]/g, '_'); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
(async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true}); tabId = tab?.id;
  const settings = await provider({type: 'GET_SETTINGS'}); $('key').value = settings.apiKey;
  const searchSettings=await provider({type:'SUBTITLE_SEARCH_SETTINGS'});
  const prefs=searchSettings.preferences;
  defaultSearchUrl=searchSettings.defaultUrl;
  $('query').value=prefs.title || '';$('language').value=prefs.language;$('year').value=prefs.year || '';
  $('searchMode').value=prefs.mode;$('searchUrl').value=prefs.urlTemplate;searchMode();
  try{
    const previousTitle=$('query').value;
    await chrome.scripting.executeScript({target:{tabId},files:['film-detection.js']});
    const [suggestion]=await chrome.scripting.executeScript({target:{tabId},func:()=>globalThis.SubtitleFilm?.detect()});
    if(suggestion?.result){
      const film=suggestion.result;
      if($('query').value===previousTitle){$('query').value=film.title;$('year').value=film.year;}
      $('filmSuggestion').hidden=false;$('filmSuggestion').textContent=(film.source==='Player metadata' ? 'From player: ' : 'From page: ')+film.title;
    }
  }catch{/* activeTab access is available after a toolbar click on a web page. */}
  await refreshLibrary();
  if (settings.loggedIn) status('Provider logged in. Ready.');
  try {
    const reply = await attach(false);await refreshPlayerTracks();
    if (reply?.ok) $('player').textContent = `${reply.player ? 'Video found' : 'Waiting for video'}${reply.name ? ` · ${reply.name}` : ''}`;
  } catch { /* Browser pages may not allow video access. */ }
  setInterval(()=>refreshPlayerTracks().catch(()=>{}),1500);
})().catch(error => status(error.message, true));
