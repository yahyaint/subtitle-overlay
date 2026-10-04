/* Provider-independent audio discovery. Results are candidates, not verified dubs. */
(() => {
  const extensions = new Set(['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'opus', 'ac3', 'eac3', 'mka']);
  const aliases = {en: ['English', 'eng'], ar: ['Arabic', 'ara'], de: ['German', 'deu', 'ger'], fr: ['French', 'fra', 'fre'], es: ['Spanish', 'spa'], it: ['Italian', 'ita'], pt: ['Portuguese', 'por'], ru: ['Russian', 'rus'], uk: ['Ukrainian', 'ukr'], hi: ['Hindi', 'hin'], ta: ['Tamil', 'tam'], te: ['Telugu', 'tel'], ja: ['Japanese', 'jpn'], ko: ['Korean', 'kor'], zh: ['Chinese', 'zho', 'chi']};
  function safeUrl(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS URL without embedded credentials.');
    return url;
  }
  function template(value, query) {
    if (typeof value !== 'string' || value.length > 2000) throw new Error('Source URL is too long.');
    return safeUrl(value.replace(/\{(title|language|languageName|year)\}/g, (_, key) => encodeURIComponent(key === 'languageName' ? languageName(query.language) : query[key] || ''))).href;
  }
  function normalize(value) { return String(value || '').replace(/½/g, ' 1/2').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function languageName(value) {
    if (String(value).toLowerCase() === 'ar-eg') return 'Egyptian Arabic';
    try { return new Intl.DisplayNames(['en'], {type: 'language'}).of(value); }
    catch { return String(value); }
  }
  function languageValues(value) {
    const code = String(value || '').trim().toLowerCase();
    const entries = [code, languageName(code), ...(aliases[code] || [])];
    return [...new Set(entries.filter(Boolean).map(x => String(x).toLowerCase()))];
  }
  function archiveQuery(query) {
    const quote = value => '"' + String(value).replace(/["\\]/g, ' ').trim() + '"';
    const languages = languageValues(query.language).map(value => `language:${quote(value)}`).join(' OR ');
    return `title:${quote(query.title)} AND (mediatype:audio OR mediatype:movies) AND (${languages}) AND (dub OR dubbed OR dubbing OR "audio track")`;
  }
  function archiveSearch(query) {
    const url = new URL('https://archive.org/advancedsearch.php');
    url.searchParams.set('q', archiveQuery(query));
    for (const field of ['identifier', 'title', 'language', 'year']) url.searchParams.append('fl[]', field);
    url.searchParams.set('rows', '12'); url.searchParams.set('page', '1'); url.searchParams.set('output', 'json');
    return url.href;
  }
  function audioFormat(name) {
    const extension = String(name || '').split('.').pop().toLowerCase();
    return extensions.has(extension) ? extension.toUpperCase() : '';
  }
  function duration(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':').map(Number);
      if (parts.some(x => !Number.isFinite(x) || x < 0)) return null;
      return parts.reduce((total, part) => total * 60 + part, 0);
    }
    const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null;
  }
  function archiveFiles(item, files) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(item.identifier || '')) return [];
    return files.filter(file => typeof file?.name === 'string' && ![true, 'true', 1, '1'].includes(file.private) && !file.name.split('/').some(part => part === '..' || part === '.') && audioFormat(file.name)).slice(0, 40).map(file => ({
      id: `${item.identifier}/${file.name}`, title: String(item.title || item.identifier).slice(0, 300),
      language: Array.isArray(item.language) ? item.language.join(', ') : String(item.language || ''),
      year: item.year || '', name: String(file.name).slice(0, 300), format: audioFormat(file.name),
      duration: duration(file.length), size: Number(file.size) || null,
      url: `https://archive.org/download/${encodeURIComponent(item.identifier)}/${file.name.split('/').map(encodeURIComponent).join('/')}`,
      sourceUrl: `https://archive.org/details/${encodeURIComponent(item.identifier)}`,
      source: 'Internet Archive', languageVerified: false
    }));
  }
  function catalogTracks(payload, query, source) {
    const rows = Array.isArray(payload) ? payload : payload?.tracks;
    if (!Array.isArray(rows)) throw new Error('Source response must contain a tracks array. See the example catalog.');
    const words = normalize(query.title).split(' ').filter(Boolean);
    const language = String(query.language || '').toLowerCase();
    return rows.slice(0, 1000).flatMap((track, index) => {
      if (!track || typeof track !== 'object') return [];
      const titleWords = new Set(normalize(track.title).split(' '));
      if (!words.every(word => titleWords.has(word))) return [];
      const declared = String(track.language || '').toLowerCase();
      if (declared && declared !== language && !(declared.startsWith(`${language}-`))) return [];
      if (!declared && !query.includeUnknown) return [];
      if (query.year && track.year && String(track.year) !== String(query.year)) return [];
      let url; try { url = safeUrl(track.url).href; } catch { return []; }
      const name = String(track.name || new URL(url).pathname.split('/').pop() || 'audio').slice(0, 300);
      const format = audioFormat(new URL(url).pathname);
      if (!format) return [];
      let sourceUrl; try { sourceUrl = safeUrl(track.sourceUrl || source.urlTemplate.replace(/\{[^}]+\}/g, '')).href; } catch { sourceUrl = url; }
      return [{id: `${source.id}/${index}`, title: String(track.title).slice(0, 300), language: declared,
        year: track.year || '', name, format, duration: duration(track.duration), size: Number(track.size) || null,
        url, sourceUrl, source: source.name, languageVerified: false}];
    }).slice(0, 80);
  }
  function webSearch(query) {
    const url = new URL('https://www.google.com/search');
    url.searchParams.set('q', `${query.title} ${query.year || ''} ${languageName(query.language)} dubbed audio track`.replace(/\s+/g, ' ').trim());
    return url.href;
  }
  function leadsTracks(payload, query) {
    const wanted = normalize(query.title).replace(/^the /, '');
    return (payload.tracks || []).filter(track => track.aliases.some(alias => normalize(alias).replace(/^the /, '') === wanted) && track.requestedLanguages.includes(query.language) && (!query.year || String(track.year) === query.year));
  }
  function soundcloudPreview(value) {
    const track = safeUrl(value);
    if (track.hostname !== 'soundcloud.com' || track.pathname.split('/').filter(Boolean).length !== 2) throw new Error('Use a public SoundCloud track page.');
    const url = new URL('https://w.soundcloud.com/player/');
    for (const [key, value] of Object.entries({url:track.href, auto_play:'false', show_artwork:'false', visual:'false'})) url.searchParams.set(key, value);
    return url.href;
  }
  globalThis.DubSources = {safeUrl, template, normalize, languageName, archiveQuery, archiveSearch, archiveFiles, catalogTracks, duration, audioFormat, webSearch, leadsTracks, soundcloudPreview};
  if (typeof module !== 'undefined') module.exports = globalThis.DubSources;
})();
