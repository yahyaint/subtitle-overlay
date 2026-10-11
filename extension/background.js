const PROVIDER_HOSTS = new Set(['api.opensubtitles.com', 'vip-api.opensubtitles.com']);
const APP = 'SubtitleOverlay v0.7.15';
importScripts('dub-sources.js', 'subtitle-search.js','subtitles.js','subtitle-settings.js','download-folder.js','subtitle-download.js');
const dubSearchCache = new Map();
let libraryQueue=Promise.resolve();
function libraryMutation(action) { const result=libraryQueue.then(action);libraryQueue=result.catch(()=>{});return result; }
// Files and compact metadata are stored separately so opening the popup stays quick.
async function subtitleLibrary() {
  const {subtitleLibrary = []} = await chrome.storage.local.get('subtitleLibrary'); return subtitleLibrary;
}
function saveSubtitle(fileId, text, name, film = {}, language = '', preset, customId) { return libraryMutation(async()=>{
  const id = customId || `opensubtitles:${fileId}`;
  const entry = {id, fileId, name: String(name).slice(0,250), title: String(film.title || name).slice(0,200), year: String(film.year || '').slice(0,4), language: String(language).slice(0,40), good:false, savedAt:Date.now()};
  const series=SubtitleSearch.episode(entry.title);if(series)Object.assign(entry,series);
  entry.filmKey = `${DubSources.normalize(series ? series.showTitle+' S'+String(series.season).padStart(2,'0')+'E'+String(series.episode).padStart(2,'0') : entry.title)}:${entry.year}`;
  const key=`subtitleFile:${id}`;
  const existing=await chrome.storage.local.get(key);
  const addedBytes=new TextEncoder().encode(JSON.stringify({text})).length - (existing[key] ? new TextEncoder().encode(JSON.stringify(existing[key])).length : 0);
  if ((await chrome.storage.local.getBytesInUse(null))+addedBytes > 9_000_000) throw new Error('Subtitle library is full. Remove an unused saved track first.');
  const entries=await subtitleLibrary(); const previous=entries.find(item=>item.id===id);
  entry.settings=preset || (existing[key]?.text===text ? previous?.settings : undefined);entry.settingsSaved=Boolean(entry.settings);entry.good=entry.settingsSaved || previous?.good || false;
  await chrome.storage.local.set({[key]:{text},subtitleLibrary:[entry,...entries.filter(item=>item.id!==id)]}); return entry;
}); }
async function saveActiveSubtitle(tabId, expectedLibraryId) {
  if(!Number.isSafeInteger(tabId))throw new Error('Open subtitle controls on a film first.');
  const snapshot=await chrome.tabs.sendMessage(tabId,{type:'GET_SUBTITLE_SNAPSHOT'});
  if(!snapshot?.ok || !snapshot.text)throw new Error('Load a subtitle file first.');
  if(expectedLibraryId!==undefined && snapshot.libraryId!==expectedLibraryId)throw new Error('Load this subtitle before saving its settings.');
  const cues=SubtitleCore.parse(snapshot.text),preset=SubtitleSettings.validate(snapshot.settings,cues);
  const bound=(await chrome.storage.session.get('activeSubtitle:'+tabId))['activeSubtitle:'+tabId];
  let entry;
  if(snapshot.libraryId){
    if(bound!==snapshot.libraryId)throw new Error('Load the saved subtitle again before saving.');
    const previous=(await subtitleLibrary()).find(item=>item.id===bound);
    if(!previous)throw new Error('Saved subtitle no longer available.');
    entry=await saveSubtitle(previous.fileId,snapshot.text,previous.name,previous,previous.language,preset,previous.id);
  }else{
    // Stable identity for a local file; name plus exact text prevents different edits colliding.
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(snapshot.name+'\n'+snapshot.text));
    const id='local:'+Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
    const current=await chrome.tabs.sendMessage(tabId,{type:'GET_STATUS'});
    if(!current?.ok || current.href!==snapshot.href)throw new Error('The film page changed. Load the file again.');
    entry=await saveSubtitle(null,snapshot.text,snapshot.name,snapshot.film,snapshot.language,preset,id);
  }
  const current=await chrome.tabs.sendMessage(tabId,{type:'GET_SUBTITLE_SNAPSHOT'});
  if(!current?.ok || current.href!==snapshot.href || current.text!==snapshot.text || current.name!==snapshot.name || current.libraryId!==snapshot.libraryId)return {libraryId:entry.id,settings:preset};
  await chrome.storage.session.set({['activeSubtitle:'+tabId]:entry.id});
  await chrome.tabs.sendMessage(tabId,{type:'SUBTITLE_PRESET_SAVED',libraryId:entry.id,name:entry.name,text:snapshot.text,settings:preset,expectedHref:snapshot.href}).catch(()=>{});
  return {libraryId:entry.id,settings:preset};
}
async function importLocalSubtitle(message, tabId) {
  if(!Number.isSafeInteger(tabId) || typeof message.data!=='string' || message.data.length>2700000 || !/^[a-z\d+/]*={0,2}$/i.test(message.data))throw new Error('Choose a subtitle file smaller than 2 MB.');
  const raw=Uint8Array.from(atob(message.data),char=>char.charCodeAt(0));
  const files=await SubtitleDownload.extract(raw,SubtitleFolder.filename(String(message.name || 'subtitles.srt')));
  const encoding=['utf-8','windows-1256','windows-1252','utf-16le'].includes(message.encoding) ? message.encoding : 'utf-8';
  const choices=files.map(file=>{
    const decoded=encoding==='utf-8' ? SubtitleCore.decode(file.bytes) : new TextDecoder(encoding).decode(file.bytes);
    const result=SubtitleCore.prepare(decoded,message.fps);
    return {name:result.converted ? file.name.replace(/\.[^.]*$/,'')+'.srt' : file.name,text:result.text,note:['ASS','SSA'].includes(result.format) ? 'ASS/SSA text and timing loaded. File styles and effects are not used.' : ''};
  });
  const loaded=await chrome.tabs.sendMessage(tabId,{type:'LOAD_SUBTITLES',text:choices[0].text,name:choices[0].name,expectedHref:message.expectedHref});
  if(!loaded?.ok)throw new Error(loaded?.error || 'Open controls on the film first.');
  await chrome.storage.session.remove('activeSubtitle:'+tabId);
  return {count:loaded.count,choices,note:choices[0].note};
}
function rateSubtitle(id, verdict, tabId) { return libraryMutation(async()=>{
  if (!['good','bad'].includes(verdict)) throw new Error('Invalid rating.');
  const entries=await subtitleLibrary(); const entry=entries.find(item=>item.id===id);
  if (!entry) throw new Error('Subtitle no longer saved.');
  if (verdict==='good') {
    entry.good=true; await chrome.storage.local.set({subtitleLibrary:entries});
    if(Number.isSafeInteger(tabId)) await chrome.tabs.sendMessage(tabId,{type:'SUBTITLE_SAVED',libraryId:id,saved:true,good:true}).catch(()=>{});
  } else {
    const {rejectedSubtitles=[]}=await chrome.storage.local.get('rejectedSubtitles');
    await chrome.storage.local.set({subtitleLibrary:entries.filter(item=>item.id!==id), rejectedSubtitles:Number.isSafeInteger(entry.fileId) ? [entry.fileId,...rejectedSubtitles.filter(fileId=>fileId!==entry.fileId)].slice(0,2000) : rejectedSubtitles});
    await chrome.storage.local.remove(`subtitleFile:${id}`);
    if (Number.isSafeInteger(tabId)) {
      await chrome.tabs.sendMessage(tabId,{type:'CLEAR_SUBTITLES',libraryId:id}).catch(()=>{});
      const key=`activeSubtitle:${tabId}`;const active=await chrome.storage.session.get(key);
      if(active[key]===id) await chrome.storage.session.remove(key);
    }
  }
  return {libraryId:id,good:verdict==='good'};
}); }
// Keep provider credentials out of the page/content-script environment.
async function restrictStorage() {
  await chrome.storage.local.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'});
  await chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'});
}
const storageReady = restrictStorage();
chrome.runtime.onInstalled.addListener(() => { restrictStorage().catch(console.error); });

async function api(path, body, query) {
  await storageReady;
  const {apiKey} = await chrome.storage.local.get('apiKey');
  const {token, baseHost} = await chrome.storage.session.get(['token', 'baseHost']);
  if (!apiKey) throw new Error('Add your OpenSubtitles API key first. Local file import works without a key.');
  const host = PROVIDER_HOSTS.has(baseHost) ? baseHost : 'api.opensubtitles.com';
  const url = new URL(`https://${host}/api/v1/${path}`);
  if (query) for (const key of Object.keys(query).sort()) url.searchParams.set(key, query[key]);
  const headers = {'Api-Key': apiKey, 'User-Agent': APP, 'X-User-Agent': APP, Accept: 'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {method: body ? 'POST' : 'GET', headers,
    body: body ? JSON.stringify(body) : undefined, credentials: 'omit', signal: AbortSignal.timeout(20000)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Report fixed errors rather than reflecting arbitrary remote messages.
    const reason = {401: 'Login expired or credentials invalid.', 403: 'API access denied; check API key.',
      406: 'Provider rejected this subtitle.', 429: 'Provider limit reached; try later.'}[response.status];
    throw new Error(reason || `OpenSubtitles request failed (HTTP ${response.status}).`);
  }
  return data;
}
function allowedDownload(link) {
  const url = new URL(link);
  return url.protocol === 'https:' && !url.username && !url.password &&
    (url.hostname === 'opensubtitles.com' || url.hostname.endsWith('.opensubtitles.com'));
}
async function handle(message, sender) {
  await storageReady;
  if (typeof message?.type !== 'string') throw new Error('Invalid request.');
  if (message.type.startsWith('DUB_')) return handleDub(message);
  if(message.type==='EXPORT_PLAYER_REPORT'){
    if(!Number.isSafeInteger(message.tabId))throw new Error('Open a film tab first.');
    const result=await chrome.tabs.sendMessage(message.tabId,{type:'GET_PLAYER_INFO'}).catch(()=>null);
    if(!result?.ok || !result.report)throw new Error('Refresh the film tab, open controls, then try again.');
    if(result.report.selectedVideo<0)throw new Error('Start the film before saving a player report.');
    const text=JSON.stringify(result.report,null,2);
    if(text.length>200000)throw new Error('Player report is too large.');
    const downloadId=await chrome.downloads.download({url:'data:application/json;charset=utf-8,'+encodeURIComponent(text),filename:'Subtitle Overlay/player-info.json',conflictAction:'uniquify',saveAs:false});
    return {downloadId};
  }
  if (message.type==='SUBTITLE_SEARCH_SETTINGS') {
    const {subtitleSearch = {}, apiKey} = await chrome.storage.local.get(['subtitleSearch','apiKey']);
    return {preferences:{mode:'website',language:'en',urlTemplate:SubtitleSearch.defaultUrl,...subtitleSearch},defaultUrl:SubtitleSearch.defaultUrl,apiReady:Boolean(apiKey)};
  }
  if (message.type==='SAVE_SUBTITLE_SEARCH') {
    const {subtitleSearch={}}=await chrome.storage.local.get('subtitleSearch');
    const next={...subtitleSearch};
    if (message.urlTemplate!==undefined) next.urlTemplate=SubtitleSearch.template(message.urlTemplate.trim());
    if (message.mode!==undefined) {if(!['website','api'].includes(message.mode)) throw new Error('Choose a search method.');next.mode=message.mode;}
    if (message.query!==undefined) Object.assign(next,SubtitleSearch.query(message));
    await chrome.storage.local.set({subtitleSearch:next});return {};
  }
  if (message.type==='OPEN_SUBTITLE_WEBSITE') {
    const current=SubtitleSearch.query(message);
    const {subtitleSearch={}}=await chrome.storage.local.get('subtitleSearch');
    const url=SubtitleSearch.website(subtitleSearch.urlTemplate || SubtitleSearch.defaultUrl,current);
    if(!Number.isSafeInteger(message.tabId))throw new Error('Open controls on the film tab first.');
    const video=await chrome.tabs.sendMessage(message.tabId,{type:'GET_STATUS'});
    if(!video?.ok)throw new Error('Open controls on the film tab first.');
    const enabled=await chrome.permissions.contains({permissions:['downloads'],origins:['https://*.opensubtitles.org/*','https://*.opensubtitles.com/*']});
    const ticket=crypto.randomUUID();
    const window=await chrome.windows.create({url:enabled ? url : chrome.runtime.getURL('website-permission.html')+'?ticket='+ticket,type:'popup',width:820,height:740,focused:true});
    const context={tabId:message.tabId,pageUrl:video.href,filmIdentity:video.filmIdentity,query:current,windowId:window.id,created:Date.now()};
    for(const tab of window.tabs || [])await chrome.storage.session.set({['websiteTab:'+tab.id]:context});
    await chrome.storage.session.set({['websiteWindow:'+window.id]:context});
    if(!enabled)await chrome.storage.session.set({['websiteTicket:'+ticket]:{...context,url}});
    for(const tab of window.tabs || []) injectWebsiteBridge(tab.id).catch(()=>{});
    return {url,windowId:window.id};
  }
  if(message.type==='RESUME_WEBSITE') {
    const key='websiteTicket:'+message.ticket;const stored=await chrome.storage.session.get(key);const context=stored[key];
    if(!context || Date.now()-context.created>600000)throw new Error('Start the search again.');
    if(!await chrome.permissions.contains({permissions:['downloads'],origins:['https://*.opensubtitles.org/*','https://*.opensubtitles.com/*']}))throw new Error('Allow website downloads first.');
    if(!Number.isSafeInteger(sender.tab?.id) || sender.tab.windowId!==context.windowId || !sender.url?.startsWith(chrome.runtime.getURL('website-permission.html')))throw new Error('Open the original search setup window again.');
    await chrome.tabs.update(sender.tab.id,{url:context.url});await chrome.storage.session.remove(key);return {};
  }
  if (message.type==='LIBRARY_LIST') return {entries:await subtitleLibrary()};
  if (message.type==='SAVE_ACTIVE_SUBTITLE')return saveActiveSubtitle(message.tabId,message.libraryId);
  if (message.type==='IMPORT_LOCAL_SUBTITLE')return importLocalSubtitle(message,message.tabId);
  if (message.type==='LIBRARY_RATE') return rateSubtitle(message.id,message.verdict,message.tabId);
  if (message.type==='LIBRARY_LOAD') {
    const entry=(await subtitleLibrary()).find(item=>item.id===message.id);
    if (!entry || !Number.isSafeInteger(message.tabId)) throw new Error('Choose a saved subtitle and video tab.');
    const key=`subtitleFile:${entry.id}`; const stored=await chrome.storage.local.get(key);
    if (!stored[key]) throw new Error('Saved subtitle file is missing.');
    const settings=entry.settings ? SubtitleSettings.validate(entry.settings,SubtitleCore.parse(stored[key].text)) : undefined;
    const loaded=await chrome.tabs.sendMessage(message.tabId,{type:'LOAD_SUBTITLES',text:stored[key].text,name:entry.name,libraryId:entry.id,settings,expectedHref:message.expectedHref,expectedFilm:message.expectedFilm});
    if (!loaded?.ok) throw new Error(loaded?.error || 'Attach the overlay again.');
    await chrome.storage.session.set({[`activeSubtitle:${message.tabId}`]:entry.id});
    return {text:stored[key].text,name:entry.name,count:loaded.count};
  }
  if (message.type === 'GET_SETTINGS') {
    const {apiKey = ''} = await chrome.storage.local.get('apiKey');
    const {token} = await chrome.storage.session.get('token');
    return {apiKey, loggedIn: Boolean(token)};
  }
  if (message.type === 'SAVE_KEY') {
    if (typeof message.apiKey !== 'string' || message.apiKey.length > 300) throw new Error('Invalid API key.');
    await chrome.storage.local.set({apiKey: message.apiKey.trim()});
    await chrome.storage.session.remove(['token', 'baseHost']);
    return {};
  }
  if (message.type === 'LOGIN') {
    const data = await api('login', {username: message.username, password: message.password});
    if (!data.token) throw new Error('Provider returned no login token.');
    await chrome.storage.session.set({token: data.token,
      baseHost: PROVIDER_HOSTS.has(data.base_url) ? data.base_url : 'api.opensubtitles.com'});
    return {};
  }
  if (message.type === 'FORGET') {
    await chrome.storage.local.remove('apiKey');
    await chrome.storage.session.remove(['token', 'baseHost']);
    return {};
  }
  if (message.type === 'SEARCH') {
    const current=SubtitleSearch.query(message);
    const query = {query:current.title, languages:current.language, order_by:'download_count', order_direction:'desc'};
    if (current.year) query.year=current.year;
    if(current.showTitle){query.query=current.showTitle;query.type='episode';query.season_number=current.season;query.episode_number=current.episode;}
    const data = await api('subtitles', undefined, query);
    const {rejectedSubtitles=[]}=await chrome.storage.local.get('rejectedSubtitles');
    return {results: (data.data || []).flatMap(item => (item.attributes?.files || []).filter(file=>!rejectedSubtitles.includes(file.file_id)).map(file => ({
      fileId: file.file_id, name: file.file_name, release: item.attributes.release,
      title: current.showTitle ? current.title : item.attributes.feature_details?.title, language: item.attributes.language,
      year: item.attributes.feature_details?.year,
      downloads: item.attributes.download_count, hearingImpaired: item.attributes.hearing_impaired
    }))).slice(0, 50)};
  }
  if (message.type === 'DOWNLOAD') {
    if (!Number.isSafeInteger(message.fileId) || message.fileId <= 0) throw new Error('Invalid subtitle file ID.');
    if (!Number.isSafeInteger(message.tabId)) throw new Error('Choose a video tab first.');
    const data = await api('download', {file_id: message.fileId, sub_format: 'srt'});
    if (!allowedDownload(data.link)) throw new Error('Provider returned an unsupported download host. Import the file manually.');
    const response = await fetch(data.link, {credentials: 'omit', signal: AbortSignal.timeout(20000)});
    if (!allowedDownload(response.url) || !response.ok) throw new Error('Subtitle download failed.');
    if (Number(response.headers.get('Content-Length')) > 2_000_000) throw new Error('Subtitle exceeds 2 MB.');
    const reader = response.body.getReader();
    const chunks = []; let length = 0;
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.length;
      if (length > 2_000_000) { await reader.cancel(); throw new Error('Subtitle exceeds 2 MB.'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let at = 0;
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
    const text = SubtitleCore.prepare(SubtitleCore.decode(bytes,String(message.language || '').startsWith('ar') ? 'windows-1256' : 'windows-1252')).text;
    const name=data.file_name || 'download.srt'; const libraryId=`opensubtitles:${message.fileId}`;
    const loaded = await chrome.tabs.sendMessage(message.tabId, {type: 'LOAD_SUBTITLES', text, name, libraryId});
    if (!loaded?.ok) throw new Error(loaded?.error || 'Overlay unavailable. Attach it again.');
    let saved=true,saveError='';
    let entry;
    try { entry=await saveSubtitle(message.fileId,text,name,message.film,message.language);await chrome.storage.session.set({[`activeSubtitle:${message.tabId}`]:libraryId}); }
    catch (error) { saved=false;saveError=error.message; }
    await chrome.tabs.sendMessage(message.tabId,{type:'SUBTITLE_SAVED',libraryId,saved,settings:entry?.settings}).catch(()=>{});
    return {text, name, count: loaded.count, saved,saveError};
  }
  throw new Error('Unknown request.');
}
async function jsonSource(url, headers = {}) {
  const parsed = DubSources.safeUrl(url);
  const permitted = await chrome.permissions.contains({origins: [`${parsed.origin}/*`]});
  if (!permitted) throw new Error(`Enable access to ${parsed.hostname} in the source settings first.`);
  const response = await fetch(parsed.href, {headers: {Accept: 'application/json', ...headers}, credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error(`Source request failed (HTTP ${response.status}).`);
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    length += value.length; if (length > 2_000_000) { await reader.cancel(); throw new Error('Catalog exceeds 2 MB.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error('Source returned a web page instead of a JSON audio catalog. Use website search for that source.'); }
}
async function dubConfiguration() {
  const {dubProviders = [], dubPreferences = {language: 'en'}} = await chrome.storage.local.get(['dubProviders', 'dubPreferences']);
  return {providers: [{id:'all',kind:'aggregate',name:'Search all audio catalogs'}, {id: 'archive', kind: 'archive', name: 'Internet Archive audio'}, {id:'soundcloud-search', kind:'website', name:'SoundCloud search', urlTemplate:'https://soundcloud.com/search/sounds?q={title}%20{languageName}'}, {id: 'leads', kind: 'leads', name: 'Researched Arabic source leads'}, ...dubProviders], preferences: dubPreferences};
}
async function handleDub(message) {
  if (message.type === 'DUB_SETTINGS') return dubConfiguration();
  if (message.type === 'DUB_SAVE_SOURCE') {
    const source = message.source;
    if (!source || !['json', 'website'].includes(source.kind) || !source.name?.trim() || source.name.length > 80) throw new Error('Enter a source name and source type.');
    const url = DubSources.template(source.urlTemplate, {title: 'test', language: 'en', year: '2000'});
    if (source.kind === 'website' && !source.urlTemplate.includes('{title}')) throw new Error('Website search URL must include {title}.');
    if (source.kind === 'json' && !await chrome.permissions.contains({origins: [`${new URL(url).origin}/*`]})) throw new Error('Source host access was not enabled.');
    const {dubProviders = []} = await chrome.storage.local.get('dubProviders');
    if (dubProviders.length >= 12) throw new Error('Remove a source before adding another (maximum 12).');
    const entry = {id: crypto.randomUUID(), kind: source.kind, name: source.name.trim(), urlTemplate: source.urlTemplate};
    await chrome.storage.local.set({dubProviders: [...dubProviders, entry]});
    if (message.token?.trim()) await chrome.storage.session.set({[`dubToken:${entry.id}`]: message.token.trim().slice(0, 2000)});
    dubSearchCache.clear(); return {id: entry.id};
  }
  if (message.type === 'DUB_REMOVE_SOURCE') {
    const {dubProviders = []} = await chrome.storage.local.get('dubProviders');
    await chrome.storage.local.set({dubProviders: dubProviders.filter(source => source.id !== message.id)});
    await chrome.storage.session.remove(`dubToken:${message.id}`); dubSearchCache.clear(); return {};
  }
  if (message.type === 'DUB_PREFERENCES') {
    await chrome.storage.local.set({dubPreferences: {language: String(message.language || 'en').trim().slice(0, 40), title: String(message.title || '').trim().slice(0, 200), year: String(message.year || '').slice(0, 4)}}); return {};
  }
  if (message.type === 'DUB_SEARCH') {
    const query = {title: String(message.title || '').trim(), language: String(message.language || '').trim().toLowerCase(), year: String(message.year || ''), includeUnknown: Boolean(message.includeUnknown)};
    if (!query.title || query.title.length > 200 || !query.language || query.language.length > 40 || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(query.language)) throw new Error('Enter film title and language code (e.g. en, ar, ar-eg).');
    if (query.year && !/^(18|19|20|21)\d{2}$/.test(query.year)) throw new Error('Enter a valid release year.');
    const {providers} = await dubConfiguration(); const source = providers.find(item => item.id === message.id);
    if (!source) throw new Error('Choose an audio source.');
    if (source.kind === 'aggregate') {
      const catalogs = providers.filter(item => ['archive','json'].includes(item.kind));
      const matches = await Promise.allSettled(catalogs.map(item => handleDub({...message, id:item.id})));
      const tracks=[]; const providerErrors=[]; let searchedItems=0, failedItems=0;
      for (let i=0;i<matches.length;i++) {
        const result=matches[i];
        if (result.status==='fulfilled') { tracks.push(...result.value.tracks); searchedItems+=result.value.searchedItems; failedItems+=result.value.failedItems; }
        else providerErrors.push({source:catalogs[i].name,error:result.reason.message});
      }
      const seen=new Set();
      return {tracks:tracks.filter(track => !seen.has(track.url) && seen.add(track.url)).slice(0,80), searchedItems, failedItems, sourceCount:catalogs.length, providerErrors};
    }
    if (source.kind === 'website') return {website: DubSources.template(source.urlTemplate, query), tracks: []};
    if (source.kind === 'leads') {
      const payload = await (await fetch(chrome.runtime.getURL('audio-leads.json'))).json();
      return {tracks: DubSources.leadsTracks(payload, query), searchedItems: 0, failedItems: 0};
    }
    const cacheKey = JSON.stringify([source.id, query]);
    const cached = dubSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.created < 120000) return cached.result;
    let result;
    if (source.kind === 'archive') {
      const search = await jsonSource(DubSources.archiveSearch(query));
      const documents = (search.response?.docs || []).slice(0, 12);
      let failedItems = 0; const tracks = [];
      // Two metadata requests at a time; partial reads retrieve file lists only.
      for (let i = 0; i < documents.length; i += 2) {
        const items = await Promise.allSettled(documents.slice(i, i + 2).map(async item => {
          if (!/^[a-zA-Z0-9_.-]+$/.test(item.identifier)) return [];
          const metadata = await jsonSource(`https://archive.org/metadata/${encodeURIComponent(item.identifier)}/files?count=500`);
          if (!Array.isArray(metadata.result)) return [];
          if (query.year && item.year && String(item.year) !== query.year) return [];
          return DubSources.archiveFiles(item, metadata.result);
        }));
        for (const item of items) { if (item.status === 'fulfilled') tracks.push(...item.value); else failedItems++; }
      }
      result = {tracks: tracks.slice(0, 80), searchedItems: documents.length, failedItems, totalItems: search.response?.numFound || 0};
    } else {
      const stored = await chrome.storage.session.get(`dubToken:${source.id}`);
      const token = stored[`dubToken:${source.id}`];
      const payload = await jsonSource(DubSources.template(source.urlTemplate, query), token ? {Authorization: `Bearer ${token}`} : {});
      result = {tracks: DubSources.catalogTracks(payload, query, source), searchedItems: 0, failedItems: 0};
    }
    if (dubSearchCache.size > 20) dubSearchCache.clear();
    dubSearchCache.set(cacheKey, {created: Date.now(), result}); return result;
  }
  if (message.type === 'DUB_DOWNLOAD') {
    const url = DubSources.safeUrl(message.url);
    if (!DubSources.audioFormat(url.pathname)) throw new Error('Choose a direct audio-file URL. Web pages and videos are not audio files.');
    if (!await chrome.permissions.contains({permissions: ['downloads']})) throw new Error('Enable file downloads first.');
    const downloadId = await chrome.downloads.download({url: url.href, saveAs: true});
    return {downloadId};
  }
  throw new Error('Unknown audio-source request.');
}
async function websiteContext(tabId) {
  const stored=await chrome.storage.session.get('websiteTab:'+tabId);if(stored['websiteTab:'+tabId])return stored['websiteTab:'+tabId];
  const tab=await chrome.tabs.get(tabId);const window=await chrome.storage.session.get('websiteWindow:'+tab.windowId);return window['websiteWindow:'+tab.windowId];
}
async function injectWebsiteBridge(tabId) {
  if(!await websiteContext(tabId))return;
  await chrome.scripting.executeScript({target:{tabId},files:['website-bridge.js']});
}
async function websiteProgress(context,progress){
  const key='websiteWindow:'+context.windowId,stored=await chrome.storage.session.get(key);
  if(!stored[key])return;
  if((progress.downloading || progress.loading) && stored[key].progress?.ok)return;
  await chrome.storage.session.set({[key]:{...stored[key],progress}});
  const window=await chrome.windows.get(context.windowId,{populate:true}).catch(()=>null);
  for(const tab of window?.tabs || [])await chrome.tabs.sendMessage(tab.id,{type:'WEBSITE_DOWNLOAD_STATUS',progress}).catch(()=>{});
}
async function clearWebsiteWatch(windowId, close=false, found){
  const stored=await chrome.storage.session.get(null),keys=[];
  for(const [key,value] of Object.entries(stored)){
    const sameWindow=value?.windowId===windowId || value?.context?.windowId===windowId;
    if(sameWindow && (key.startsWith('websiteIntent:') || close && /^(?:websiteTab:|websiteDownload:|websiteTicket:)/.test(key)))keys.push(key);
  }
  if(close)keys.push('websiteWindow:'+windowId);
  if(keys.length)await chrome.storage.session.remove(keys);
  if(found){const window=await chrome.windows.get(windowId,{populate:true}).catch(()=>null);for(const tab of window?.tabs || [])await chrome.tabs.sendMessage(tab.id,{type:'WEBSITE_FILE_FOUND',...found}).catch(()=>{});}
}
async function updateWebsiteWatch(tabId,url){
  try{SubtitleDownload.safeUrl(url);}catch{return;}
  const context=await websiteContext(tabId);if(!context)return;
  const stored=await chrome.storage.session.get(null);
  for(const [key,intent] of Object.entries(stored))if(key.startsWith('websiteIntent:') && intent.context.windowId===context.windowId){
    intent.pages=[...new Set([...(intent.pages || [intent.referrer]),url])].slice(-30);await chrome.storage.session.set({[key]:intent});
  }
}
chrome.tabs.onUpdated.addListener((tabId,change)=>{if(change.url)updateWebsiteWatch(tabId,change.url).catch(()=>{});if(change.status==='complete')injectWebsiteBridge(tabId).catch(()=>{});});
chrome.windows.onRemoved.addListener(windowId=>{clearWebsiteWatch(windowId,true).catch(()=>{});});
chrome.tabs.onRemoved.addListener(tabId=>{chrome.storage.session.remove(['websiteTab:'+tabId,'overlayResults:'+tabId]).catch(()=>{});});
async function downloadContext(item){
  try{SubtitleDownload.safeUrl(item.finalUrl || item.url);}catch{return null;}
  const stored=await chrome.storage.session.get(null);const matches=[];
  for(const [key,intent] of Object.entries(stored))if(key.startsWith('websiteIntent:')){
    let window;try{window=await chrome.windows.get(intent.context.windowId,{populate:true});}catch{await chrome.storage.session.remove(key);continue;}
    const samePage=item.referrer && [...(intent.pages || [intent.referrer]),...(intent.urls || [])].includes(item.referrer);
    const sameLink=intent.urls?.some(url=>url===item.url || url===item.finalUrl);
    // Vivaldi can reduce Referrer to the provider origin and start the file
    // directly on dl.opensubtitles.org. Classic routes share a subtitle ID.
    const downloadedIds=[item.url,item.finalUrl].map(SubtitleDownload.subtitleId).filter(Boolean);
    const selectedIds=[...(intent.urls || []),...(intent.pages || [intent.referrer])].map(SubtitleDownload.subtitleId).filter(Boolean);
    const sameSubtitle=downloadedIds.some(id=>selectedIds.includes(id));
    // A landing redirect can start a download before onUpdated records its page.
    let providerReferrer=false;try{SubtitleDownload.safeUrl(item.referrer);providerReferrer=true;}catch{}
    const livePage=providerReferrer && window.tabs?.some(tab=>tab.url===item.referrer);
    if(samePage || sameLink || livePage || sameSubtitle)matches.push({...intent.context,intentKey:key});
  }
  const windows=new Set(matches.map(match=>match.windowId));return windows.size===1 ? matches[0] : null;
}
let websiteQueue=Promise.resolve();const completedWebsiteDownloads=new Set();
function subtitleDownloadItem(item){
  return /\.(?:srt|vtt|sub|ass|ssa|zip|gz)$/i.test(item.filename || '') ||
    [item.url,item.finalUrl].some(url=>url && /\.(?:srt|vtt|sub|ass|ssa|zip|gz)(?:$|\?)/i.test(url)) ||
    /^(?:application\/(?:zip|x-zip-compressed|gzip|x-gzip|x-subrip|x-ass|x-ssa)|text\/(?:vtt|x-ass|x-ssa))$/i.test(item.mime || '');
}
async function websiteDownloadCreated(item){
  if(item.byExtensionId===chrome.runtime.id || !subtitleDownloadItem(item))return;
  const context=await downloadContext(item);if(!context)return;
  if(completedWebsiteDownloads.has(item.id))return;
  await chrome.storage.session.set({['websiteDownload:'+item.id]:context});
  await websiteProgress(context,{downloading:true});
  if(item.state==='complete')await websiteDownloadChanged({id:item.id,state:{current:'complete'}});
}
chrome.downloads.onCreated.addListener(item=>{websiteDownloadCreated(item).catch(()=>{});});
async function importWebsiteFile(context,url,name,alreadySaved=false,fps=context.fps) {
  url=SubtitleDownload.safeUrl(url);
  if(!await chrome.windows.get(context.windowId).catch(()=>null))throw new Error('The search window closed. Start a new subtitle search.');
  const permissions=await chrome.permissions.contains({permissions:['downloads'],origins:['https://*.opensubtitles.org/*','https://*.opensubtitles.com/*']});
  if(!permissions)throw new Error('Enable website downloads in the extension Settings.');
  const status=await chrome.tabs.sendMessage(context.tabId,{type:'GET_STATUS'});
  if(!status?.ok || status.href!==context.pageUrl)throw new Error('The film page changed. Start a new subtitle search.');
  if(context.filmIdentity && status.filmIdentity!==context.filmIdentity)throw new Error('The film changed. Start a new subtitle search.');
  const response=await fetch(url,{credentials:'include',signal:AbortSignal.timeout(20000)});
  SubtitleDownload.safeUrl(response.url || url);
  if(/text\/html/i.test(response.headers.get('Content-Type') || '')){const error=new Error('Continue on the download page.');error.code='WEBSITE_STEP_REQUIRED';error.nextPage=response.url || url;throw error;}
  const disposition=response.headers.get('Content-Disposition') || '';
  const filename=name || disposition.match(/filename="?([^";]+)/i)?.[1] || new URL(url).pathname.split('/').pop() || 'subtitles.srt';
  const files=await SubtitleDownload.extract(await SubtitleDownload.bytes(response),filename);
  let valid;
  try{valid=files.map(file=>{
    const text=SubtitleCore.decode(file.bytes,context.query.language.startsWith('ar') ? 'windows-1256' : 'windows-1252');
    const result=SubtitleCore.prepare(text,fps);
    return {...file,sourceName:file.name,name:result.converted ? file.name.replace(/\.[^.]*$/,'')+'.srt' : file.name,text:result.text,bytes:result.converted ? new TextEncoder().encode(result.text) : file.bytes,converted:result.converted,plainAss:['ASS','SSA'].includes(result.format)};
  });}catch(error){if(error.code==='WEBSITE_STEP_REQUIRED')error.nextPage=response.url || url;throw error;}
  const current=await chrome.tabs.sendMessage(context.tabId,{type:'GET_STATUS'});
  if(!current?.ok || current.href!==context.pageUrl)throw new Error('The film page changed. Start a new subtitle search.');
  if(context.filmIdentity && current.filmIdentity!==context.filmIdentity)throw new Error('The film changed. Start a new subtitle search.');
  if(!await chrome.windows.get(context.windowId).catch(()=>null))throw new Error('The search window closed. Start a new subtitle search.');
  const {rejectedSubtitles=[]}=await chrome.storage.local.get('rejectedSubtitles');
  const identity=file=>{let hash=0;for(const char of url+'|'+(file.sourceName || file.name))hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;return 2000000000+hash;};
  for(const file of valid)if(rejectedSubtitles.includes(identity(file)))throw new Error('This subtitle was marked as not working. Choose another file.');
  // Save all valid files. If a ZIP has multiple tracks, list them in the overlay for selection.
  if(!alreadySaved || !/\.(srt|vtt)$/i.test(name || '') || valid.some(file=>file.converted))for(const file of valid)await SubtitleFolder.write(file.name,file.bytes);
  const entries=[];
  for(const file of valid)entries.push(await saveSubtitle(identity(file),file.text,file.name,{title:context.query.title,year:context.query.year},context.query.language));
  if(valid.length===1){await handle({type:'LIBRARY_LOAD',id:entries[0].id,tabId:context.tabId,expectedHref:context.pageUrl,expectedFilm:context.filmIdentity},{});}
  else await chrome.tabs.sendMessage(context.tabId,{type:'WEBSITE_FILES_READY',count:valid.length});
  const result={count:valid.length,converted:valid.some(file=>file.converted),plainAss:valid.some(file=>file.plainAss)};
  await clearWebsiteWatch(context.windowId,false,result);
  await websiteProgress(context,{ok:true,...result});
  return result;
}
chrome.downloads.onDeterminingFilename.addListener((item,suggest)=>{
  if(item.byExtensionId===chrome.runtime.id)return;
  (async()=>{
    let suggestion;
    try{
      const context=await downloadContext(item);
      if(context && subtitleDownloadItem(item) && !completedWebsiteDownloads.has(item.id)){
        await chrome.storage.session.set({['websiteDownload:'+item.id]:context});
        await websiteProgress(context,{downloading:true}).catch(()=>{});
        suggestion={filename:'Subtitle Overlay/'+SubtitleFolder.filename(item.filename || 'subtitles.zip'),conflictAction:'uniquify'};
      }
    }catch{/* Keep the browser's filename if the association cannot be recovered. */}
    suggest(suggestion);
  })();return true;
});
function websiteDownloadChanged(delta){
  if(!['complete','interrupted'].includes(delta.state?.current))return;
  return chrome.storage.session.get('websiteDownload:'+delta.id).then(async stored=>{
    const [item]=await chrome.downloads.search({id:delta.id});if(!item || item.byExtensionId===chrome.runtime.id)return;
    const context=stored['websiteDownload:'+delta.id] || (subtitleDownloadItem(item) && await downloadContext(item));if(!context)return;
    if(delta.state.current==='complete'){
      if(completedWebsiteDownloads.has(delta.id))return;
      completedWebsiteDownloads.add(delta.id);if(completedWebsiteDownloads.size>1000)completedWebsiteDownloads.delete(completedWebsiteDownloads.values().next().value);
    }
    await chrome.storage.session.remove('websiteDownload:'+delta.id);
    if(delta.state.current==='interrupted'){await websiteProgress(context,{error:'Download stopped. Retry the file or return to the subtitle page.',url:item.url});return;}
    await websiteProgress(context,{loading:true});
    const action=()=>importWebsiteFile(context,item.finalUrl || item.url,item.filename,true),pending=websiteQueue.then(action);websiteQueue=pending.catch(()=>{});
    try{await pending;}catch(error){const text='Automatic loading failed. Load the downloaded file manually. '+error.message;await websiteProgress(context,{error:text,url:item.url});await chrome.tabs.sendMessage(context.tabId,{type:'WEBSITE_DOWNLOAD_FAILED',error:text}).catch(()=>{});}
  }).catch(error=>console.warn('Website subtitle import:',error.message));
}
chrome.downloads.onChanged.addListener(websiteDownloadChanged);
const websiteRechecks=new Map();
function recheckWebsiteDownloads(windowId){
  if(websiteRechecks.has(windowId))return websiteRechecks.get(windowId);
  const pending=(async()=>{
    if(!await chrome.windows.get(windowId).catch(()=>null))return;
    const stored=await chrome.storage.session.get(null);
    const intents=Object.entries(stored).filter(([key,value])=>key.startsWith('websiteIntent:') && value.context.windowId===windowId).map(([,value])=>value);
    const ids=[...new Set(intents.flatMap(intent=>[...(intent.urls || []),...(intent.pages || [intent.referrer])]).map(SubtitleDownload.subtitleId).filter(Boolean))].slice(-50);
    if(!ids.length)return;
    const since=Math.min(...intents.map(intent=>intent.created));if(!Number.isFinite(since))return;
    // Search only selected classic subtitle IDs since this window was armed.
    // No disk scanning or broad download-history query is needed.
    const urlRegex='^https://(?:[a-z0-9-]+\\.)*opensubtitles\\.org/(?:[^/?#]+/)*(?:download/sub|subtitleserve/sub)/(?:'+ids.join('|')+')(?:[/?#]|$)';
    const items=await chrome.downloads.search({urlRegex,startedAfter:new Date(since-2000).toISOString(),orderBy:['-startTime'],limit:30});
    for(const item of items){
      if(item.byExtensionId===chrome.runtime.id || !subtitleDownloadItem(item) || completedWebsiteDownloads.has(item.id))continue;
      const context=await downloadContext(item);if(context?.windowId!==windowId)continue;
      if(item.state==='complete' || item.state==='interrupted'){
        await websiteDownloadChanged({id:item.id,state:{current:item.state}});break;
      }
      await websiteDownloadCreated(item);
    }
  })().finally(()=>websiteRechecks.delete(windowId));
  websiteRechecks.set(windowId,pending);return pending;
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if(message?.type==='WEBSITE_CHECK_DOWNLOAD' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)){
    storageReady.then(async()=>{SubtitleDownload.safeUrl(sender.url);const context=await websiteContext(sender.tab.id);if(!context)throw new Error('Open the search window first.');await recheckWebsiteDownloads(context.windowId);return {checked:true};}).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;
  }
  if(message?.type==='WEBSITE_WATCH_STATUS' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)){
    storageReady.then(async()=>{
      SubtitleDownload.safeUrl(sender.url);const context=await websiteContext(sender.tab.id);if(!context)return {watching:false};
      recheckWebsiteDownloads(context.windowId).catch(()=>{});
      await updateWebsiteWatch(sender.tab.id,sender.url);const stored=await chrome.storage.session.get(null);
      const intents=Object.entries(stored).filter(([key,intent])=>key.startsWith('websiteIntent:') && intent.context.windowId===context.windowId).map(([,intent])=>intent).sort((a,b)=>b.created-a.created);
      const intent=intents[0],pages=intent?.pages || [];
      const subtitlePage=[...pages].reverse().find(url=>url!==sender.url && !/\/(?:download|subtitleserve)\/(?:sub|file|vrf|step)(?:\/|$)|\.(?:srt|vtt|sub|ass|ssa|zip|gz)(?:$|\?)/i.test(new URL(url).pathname));
      return {watching:Boolean(intent),downloadUrl:intent?.urls?.at(-1),subtitlePage,progress:stored['websiteWindow:'+context.windowId]?.progress};
    }).then(data=>reply({ok:true,...data})).catch(()=>reply({ok:false}));return true;
  }
  if(message?.type==='WEBSITE_DOWNLOAD_INTENT' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)){
    storageReady.then(async()=>{const context=await websiteContext(sender.tab.id);if(!context)throw new Error('No search window.');SubtitleDownload.safeUrl(sender.url);const fps=Number(message.fps),key='websiteIntent:'+sender.tab.id,previous=(await chrome.storage.session.get(key))[key];let url;try{url=SubtitleDownload.safeUrl(message.url);}catch{/* Script buttons can rely on the current page referrer. */}await chrome.storage.session.set({[key]:{context:{...context,fps:fps>=1 && fps<=120 ? fps : previous?.context?.fps},referrer:sender.url,pages:[...new Set([...(previous?.pages || []),sender.url])].slice(-30),urls:[...new Set([...(previous?.urls || []),...(url ? [url] : [])])].slice(-30),created:Date.now()}});const windowKey='websiteWindow:'+context.windowId,windowStored=await chrome.storage.session.get(windowKey);if(windowStored[windowKey])await chrome.storage.session.set({[windowKey]:{...windowStored[windowKey],progress:null}});return {};}).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;
  }
  if(message?.type==='WEBSITE_CAPTURE' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)){
    const action=async()=>{const context=await websiteContext(sender.tab.id);if(!context)throw new Error('Open the website from the extension search window first.');SubtitleDownload.safeUrl(sender.url);const stored=await chrome.storage.session.get(null),intent=stored['websiteIntent:'+sender.tab.id] || Object.entries(stored).find(([key,value])=>key.startsWith('websiteIntent:') && value.context.windowId===context.windowId)?.[1];return importWebsiteFile({...context,fps:intent?.context.fps},message.url,undefined,false,message.fps);};
    const pending=websiteQueue.then(action);websiteQueue=pending.catch(()=>{});pending.then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message,code:error.code,nextPage:error.nextPage}));return true;
  }
  // Overlay actions never return credentials or raw saved files. Targets come from the sender.
  const overlayActions = ['OVERLAY_SETTINGS','OVERLAY_PREFERENCES','OVERLAY_WEBSITE','OVERLAY_LIBRARY','OVERLAY_LOAD','OVERLAY_SEARCH','OVERLAY_DOWNLOAD','OVERLAY_RATE','OVERLAY_SAVE','OVERLAY_IMPORT','OVERLAY_EXPORT_REPORT'];
  if (overlayActions.includes(message?.type) && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id) && sender.frameId===0) {
    storageReady.then(async()=>{
      const tabId=sender.tab.id;
      if(message.type==='OVERLAY_EXPORT_REPORT')return handle({type:'EXPORT_PLAYER_REPORT',tabId},sender);
      if(message.type==='OVERLAY_IMPORT')return importLocalSubtitle({...message,expectedHref:sender.url},tabId);
      if(message.type==='OVERLAY_SAVE')return saveActiveSubtitle(tabId,message.libraryId);
      if(message.type==='OVERLAY_SETTINGS') return handle({type:'SUBTITLE_SEARCH_SETTINGS'},sender);
      if(message.type==='OVERLAY_PREFERENCES') return handle({...message,type:'SAVE_SUBTITLE_SEARCH'},sender);
      if(message.type==='OVERLAY_WEBSITE') return handle({...message,type:'OPEN_SUBTITLE_WEBSITE',tabId},sender);
      if(message.type==='OVERLAY_LIBRARY') return {entries:await subtitleLibrary()};
      if(message.type==='OVERLAY_LOAD') {
        const loaded=await handle({type:'LIBRARY_LOAD',id:message.id,tabId},sender);
        return {name:loaded.name,count:loaded.count};
      }
      if(message.type==='OVERLAY_RATE') return rateSubtitle(message.id,message.verdict,tabId);
      if(message.type==='OVERLAY_SEARCH') {
        // Bind download IDs and film metadata to actual search results in this tab.
        const current=SubtitleSearch.query(message);
        await chrome.storage.session.remove(`overlayResults:${tabId}`);
        const found=await handle({...message,type:'SEARCH'},sender);
        await chrome.storage.session.set({[`overlayResults:${tabId}`]:{results:found.results,query:current,url:sender.url}});
        return found;
      }
      const {['overlayResults:'+tabId]:cached}=await chrome.storage.session.get('overlayResults:'+tabId);
      const selected=cached?.results.find(item=>item.fileId===message.fileId);
      if(!selected || cached.url!==sender.url) throw new Error('Search for this subtitle in the overlay first.');
      const loaded=await handle({type:'DOWNLOAD',fileId:selected.fileId,tabId,film:{title:selected.title || cached.query.title,year:selected.year || cached.query.year},language:selected.language},sender);
      return {name:loaded.name,count:loaded.count,saved:loaded.saved,saveError:loaded.saveError};
    }).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;
  }
  if(message?.type==='INSTALL_PLAYER_CLOCK' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)){
    chrome.scripting.executeScript({target:{tabId:sender.tab.id,frameIds:[sender.frameId || 0]},world:'MAIN',files:['player-clock-bridge.js']}).then(()=>reply({ok:true})).catch(error=>reply({ok:false,error:error.message}));return true;
  }
  if (['TOGGLE_FULLSCREEN','FULLSCREEN_STATUS'].includes(message?.type) && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.windowId)) {
    storageReady.then(async()=>{
      const window=await chrome.windows.get(sender.tab.windowId);
      if(message.type==='FULLSCREEN_STATUS') return {fullscreen:window.state==='fullscreen'};
      const fullscreen=window.state!=='fullscreen';const key=`fullscreenWindow:${window.id}`;
      let target='fullscreen';
      if(fullscreen) await chrome.storage.session.set({[key]:window.state==='maximized' ? 'maximized' : 'normal'});
      else {const stored=await chrome.storage.session.get(key);target=stored[key] || 'maximized';await chrome.storage.session.remove(key);}
      await chrome.windows.update(window.id,{state:target,focused:true});return {fullscreen};
    }).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message}));return true;
  }
  // Content scripts can rate only the saved track bound to their own tab.
  if (message?.type==='RATE_SUBTITLE' && sender.id===chrome.runtime.id && Number.isSafeInteger(sender.tab?.id)) {
    storageReady.then(async()=>{
      const key=`activeSubtitle:${sender.tab.id}`; const stored=await chrome.storage.session.get(key);
      if (!stored[key] || message.libraryId!==stored[key]) throw new Error('Download or load a saved subtitle first.');
      return rateSubtitle(stored[key],message.verdict,sender.tab.id);
    }).then(data=>reply({ok:true,...data})).catch(error=>reply({ok:false,error:error.message})); return true;
  }
  // Privileged provider operations only accept our extension pages, never page scripts.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) return;
  handle(message, sender).then(data => reply({ok: true, ...data}))
    .catch(error => reply({ok: false, error: error.name === 'TimeoutError' ? 'Provider timed out; try again.' : error.message}));
  return true;
});
