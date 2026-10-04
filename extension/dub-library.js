const $ = id => document.getElementById(id);
let providers = [];
function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
async function send(message) {
  const reply = await chrome.runtime.sendMessage(message);
  if (!reply?.ok) throw new Error(reply?.error || 'Extension unavailable. Reload it.'); return reply;
}
async function task(button, action) {
  button.disabled = true;
  try { await action(); } catch (error) { status(error.message, true); } finally { button.disabled = false; }
}
function query() { return {title: $('title').value.trim(), language: $('language').value.trim().toLowerCase(), year: $('year').value, includeUnknown: $('includeUnknown').checked}; }
async function configuration(selected) {
  const settings = await send({type: 'DUB_SETTINGS'}); providers = settings.providers;
  const previous = selected || $('source').value; $('source').replaceChildren(); $('providers').replaceChildren();
  for (const source of providers) {
    const option = document.createElement('option'); option.value = source.id; option.textContent = source.name; $('source').append(option);
    const row = document.createElement('div'); row.className = 'provider';
    const name = document.createElement('span'); name.textContent = `${source.name}${source.kind === 'website' ? ' · website' : ''}`; row.append(name);
    if (!['all', 'archive', 'leads', 'soundcloud-search'].includes(source.id)) {
      const remove = document.createElement('button'); remove.textContent = 'Remove';
      remove.onclick = () => task(remove, async () => { await send({type: 'DUB_REMOVE_SOURCE', id: source.id}); await configuration(); status('Source removed.'); });
      row.append(remove);
    }
    $('providers').append(row);
  }
  if (providers.some(source => source.id === previous)) $('source').value = previous;
  updateSource();
  return settings;
}
function updateSource() {
  const kind = providers.find(source => source.id === $('source').value)?.kind;
  $('searchButton').textContent = kind === 'website' ? 'Open source search' : kind === 'leads' ? 'Find source leads' : 'Find audio files';
  $('includeUnknown').disabled = !['json','aggregate'].includes(kind);
}
$('source').onchange = updateSource;
async function download(url) {
  DubSources.safeUrl(url);
  if (!DubSources.audioFormat(new URL(url).pathname)) throw new Error('Use a direct audio-file URL ending in MP3, M4A, AAC, WAV, FLAC, OGG, OPUS, AC3, EAC3 or MKA.');
  const enabled = await chrome.permissions.request({permissions: ['downloads']});
  if (!enabled) throw new Error('Download access was not granted. You can open the source page.');
  await send({type: 'DUB_DOWNLOAD', url}); status('Download requested. Select a folder. Check progress in browser downloads.');
}
function render(tracks) {
  $('results').replaceChildren();
  if (!tracks.length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = 'No audio files found. Try another title, language, or source.';
    $('results').append(empty); return;
  }
  for (const track of tracks) {
    const card = document.createElement('article'); card.className = 'track';
    const title = document.createElement('h3'); title.textContent = track.title;
    const tags = document.createElement('div');
    for (const value of [track.format, track.language || 'No language label', track.duration ? `${Math.round(track.duration / 60)} min` : 'No duration label']) {
      const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = value; tags.append(badge);
    }
    const name = document.createElement('p'); name.className = 'name'; name.textContent = track.name;
    const source = document.createElement('p'); source.className = 'hint';
    source.textContent = `${track.source}${track.size ? ` · ${(track.size / 1000000).toFixed(1)} MB` : ''} · ${track.note || 'Check the language, duration, and film version.'}`;
    const actions = document.createElement('div'); actions.className = 'row';
    const review = document.createElement('button'); review.textContent = 'Review source'; review.onclick = () => chrome.tabs.create({url: DubSources.safeUrl(track.sourceUrl).href});
    actions.append(review);
    if (track.url) {
      const save = document.createElement('button'); save.className = 'primary'; save.textContent = 'Download audio'; save.onclick = () => task(save, () => download(track.url)); actions.append(save);
    } else if (track.previewUrl) {
      const preview = document.createElement('button'); preview.className = 'primary'; preview.textContent = 'Preview audio';
      preview.onclick = () => {
        try {
          const frame = document.createElement('iframe'); frame.className = 'audio-preview'; frame.title = `SoundCloud preview: ${track.title}`; frame.allow = 'autoplay'; frame.src = DubSources.soundcloudPreview(track.previewUrl);
          card.append(frame); preview.disabled = true; preview.textContent = 'Player loaded';
          status('Press Play to check the audio. This file cannot be downloaded. The preview does not sync with Disney+.');
        } catch (error) { status(error.message, true); }
      };
      actions.append(preview);
    }
    card.append(title, tags, name, source, actions); $('results').append(card);
  }
}
$('searchForm').onsubmit = event => {
  event.preventDefault();
  // Request source access directly from the user's gesture.
  const source = providers.find(item => item.id === $('source').value);
  const current = query();
  let hostGrant;
  try {
    const catalogs=source?.kind==='aggregate' ? providers.filter(item=>['archive','json'].includes(item.kind)) : source ? [source] : [];
    const origins=[...new Set(catalogs.flatMap(item=>item.kind==='archive' ? ['https://archive.org/*'] : item.kind==='json' ? [`${new URL(DubSources.template(item.urlTemplate,current)).origin}/*`] : []))];
    hostGrant = origins.length ? chrome.permissions.request({origins}) : Promise.resolve(true);
  } catch (error) { status(error.message, true); return; }
  task(event.submitter, async () => {
    if (!await hostGrant) throw new Error('Source access not enabled. Web search still works.');
    status('Search in progress…'); $('results').replaceChildren();
    await send({type: 'DUB_PREFERENCES', ...current});
    const result = await send({type: 'DUB_SEARCH', id: source?.id, ...current});
    if (result.website) { await chrome.tabs.create({url: result.website}); status('Search opened. Check for a complete audio file for your film.'); return; }
    render(result.tracks);
    const errors=(result.providerErrors || []).map(item=>`${item.source}: ${item.error}`).join(' ');
    status(`${result.tracks.length} candidate ${source.kind === 'leads' ? 'sources' : 'audio files'}.${result.sourceCount ? ` Searched ${result.sourceCount} catalogs.` : ''}${result.searchedItems ? ` Checked ${result.searchedItems} matching uploads.` : ''}${result.failedItems ? ` ${result.failedItems} uploads couldn’t be checked.` : ''} Check the language, duration, and film version.${errors ? ` Source errors: ${errors}` : ''}`);
  });
};
$('webSearch').onclick = () => {
  const current = query(); if (!current.title || !current.language) { status('Enter film title and language first.', true); return; }
  chrome.tabs.create({url: DubSources.webSearch(current)}); status('Search opened. Check each source before you use a file.');
};
$('sourceKind').onchange = () => { $('tokenLabel').hidden = $('sourceKind').value !== 'json'; };
$('sourceForm').onsubmit = event => {
  event.preventDefault();
  const source = {name: $('sourceName').value, kind: $('sourceKind').value, urlTemplate: $('sourceUrl').value.trim()};
  let grant;
  try {
    const endpoint = new URL(DubSources.template(source.urlTemplate, {title: 'test', language: 'en', year: '2000'}));
    grant = source.kind === 'json' ? chrome.permissions.request({origins: [`${endpoint.origin}/*`]}) : Promise.resolve(true);
  } catch (error) { status(error.message, true); return; }
  task(event.submitter, async () => {
    if (!await grant) throw new Error('Source host access was not enabled.');
    const token = $('sourceToken').value; $('sourceToken').value = '';
    const result = await send({type: 'DUB_SAVE_SOURCE', source, token});
    await configuration(result.id); $('sourceForm').reset(); $('tokenLabel').hidden = false;
    status('Source saved. You can search it now.');
  });
};
$('directForm').onsubmit = event => { event.preventDefault(); task(event.submitter, () => download($('directUrl').value.trim())); };
(async () => {
  const settings = await configuration(); const params = new URLSearchParams(location.search);
  $('title').value = params.get('title') || settings.preferences.title || ''; $('year').value = params.get('year') || settings.preferences.year || '';
  $('language').value = params.get('language') || settings.preferences.language || 'en';
})().catch(error => status(error.message, true));
