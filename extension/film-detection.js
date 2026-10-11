(() => {
  function clean(value, source) {
    const player=source==='Player metadata' || source==='Page metadata';
    return String(value || '').replace(/\s+/g, ' ').trim()
      .replace(player ? /^(?:watch|play)\s+(?:the\s+)?(?:movie|film)\s*[:：]?\s+/i : /^(?:watch|play)(?:\s+(?:the\s+)?(?:movie|film))?\s*[:：]?\s+/i, '')
      .replace(player ? /^(?:مشاهدة|شاهد|شغل)\s+(?:فيلم|الفيلم|مسلسل|المسلسل)\s*[:：]?\s+/ : /^(?:مشاهدة|شاهد|شغل)(?:\s+(?:فيلم|الفيلم|مسلسل|المسلسل))?\s*[:：]?\s+/, '')
      .replace(/\s*[|–—-]\s*(?:Disney\+|Movy|Disney Plus|Netflix|Prime Video|Cinejoy).*$/i, '')
      .replace(/\s+on\s+(?:Disney\+|Movy|Disney Plus|Netflix|Prime Video|Cinejoy).*$/i, '')
      .trim().slice(0, 200);
  }
  const validYear = value => /^(18|19|20|21)\d{2}$/.test(String(value)) ? String(value) : '';
  const titleKey = title => title.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const number=value=>value!==null && value!==undefined && value!=='' && Number.isSafeInteger(Number(value)) && Number(value)>=0 && Number(value)<=999 ? Number(value) : null;
  function episode(value) {
    const text=String(value || '').trim(),match=text.match(/^(.*?)\s*(?:[|\u00b7:\-]\s*)?(?:S(?:eason)?\s*(\d{1,3})\s*[: ._-]*E(?:pisode)?\s*(\d{1,3})|(\d{1,2})x(\d{1,3}))\b[ .:\u00b7_\u2013\u2014-]*(.*)$/i);
    if(!match || !match[1].trim())return null;
    return {showTitle:match[1].trim().replace(/\s+(?:19|20)\d{2}$/, ''),season:Number(match[2] ?? match[4]),episode:Number(match[3] ?? match[5]),episodeTitle:match[6].trim().slice(0,100)};
  }
  function format(item) {return item.showTitle+' S'+String(item.season).padStart(2,'0')+'E'+String(item.episode).padStart(2,'0')+(item.episodeTitle ? ' - '+item.episodeTitle : '');}
  function detect() {
    const candidates=[],episodes=[];
    const add=(value,year,source,details)=>{
      let title=clean(value,source);
      const dated=title.match(/\s*[([]((?:18|19|20|21)\d{2})[)\]]$/);
      if(dated){year=validYear(year)||dated[1];title=title.slice(0,dated.index).trim();}
      if(!title || /^(?:Disney\+|Movy|Disney Plus|Netflix|Prime Video|Home|Watch|Browse|Play|Player|Video|Video player|Background trailer|Trailer|Preview|Hover preview|(?:watch|play) video|Movie|Film|مشغل الفيديو|فيديو|تشغيل|فيلم|Disney\+.*streaming)$/i.test(title))return;
      const series=details || episode(title),candidate={title,year:validYear(year),source};
      if(series && series.showTitle && number(series.season)!==null && number(series.episode)!==null){Object.assign(candidate,series,{title:format(series),type:'episode'});episodes.push(candidate);}
      candidates.push(candidate);return candidate;
    };
    // Playback metadata describes the current film even when the page title is stale.
    try{const metadata=navigator.mediaSession?.metadata;add(metadata?.title,'','Player metadata');const series=episode((metadata?.album || '')+' '+(metadata?.artist || ''));if(series)add(metadata.title,'','Player metadata',{...series,episodeTitle:metadata.title===series.showTitle ? '' : clean(metadata.title,'Player metadata')});}
    catch{/* Some players do not expose media metadata. */}
    const visible=element=>element.getClientRects().length && getComputedStyle(element).visibility!=='hidden';
    const videos=[...document.querySelectorAll('video')].filter(visible)
      .sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height);
    const video=videos[0];
    const player=video?.closest('[data-testid*="player" i], [data-role="player"], .video-player, .video-js, .jwplayer, .plyr, [role="application"]');
    const playerTitles='[data-testid="player-title"], [data-testid="video-title"], [data-role="video-title"], .vjs-title-bar-title, .jw-title-primary';
    for(const element of (player||document).querySelectorAll(player ? playerTitles : '[data-testid="player-title"]'))
      if(visible(element))add(element.textContent,'','Player metadata');
    if(player){
      const show=player.querySelector('[data-testid=series-title],[data-role=series-title],[data-show-title]'),season=player.querySelector('[data-season]'),part=player.querySelector('[data-episode]'),name=player.querySelector('[data-testid=episode-title],[data-role=episode-title]');
      if(show && season && part && number(season.getAttribute('data-season'))!==null && number(part.getAttribute('data-episode'))!==null)add(show.getAttribute('data-show-title') || show.textContent,'','Player metadata',{showTitle:clean(show.getAttribute('data-show-title') || show.textContent,'Player metadata'),season:Number(season.getAttribute('data-season')),episode:Number(part.getAttribute('data-episode')),episodeTitle:clean(name?.textContent,'Player metadata')});
    }
    if(video){
      const show=video.getAttribute('data-show-title'),season=video.getAttribute('data-season'),part=video.getAttribute('data-episode');
      if(show && number(season)!==null && number(part)!==null)add(show,video.getAttribute('data-year'),'Player metadata',{showTitle:clean(show,'Player metadata'),season:Number(season),episode:Number(part),episodeTitle:clean(video.getAttribute('data-episode-title'),'Player metadata')});
      add(video.getAttribute('data-title'),video.getAttribute('data-year'),'Player metadata');
      add(video.getAttribute('title'),'','Player metadata');
      add(video.getAttribute('aria-label'),'','Player metadata');
    }
    // Read declared film metadata only; never scan application scripts or account state.
    for(const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      if(script.textContent.length>100000)continue;
      try{
        const data=JSON.parse(script.textContent),references=new Map();let budget=100;const index=(item,depth=0)=>{if(!item || typeof item!=='object' || depth>6 || budget--<=0)return;if(Array.isArray(item)){item.forEach(value=>index(value,depth+1));return;}if(typeof item['@id']==='string' && (!references.has(item['@id']) || Object.keys(item).length>Object.keys(references.get(item['@id'])).length))references.set(item['@id'],item);for(const value of Object.values(item))if(value && typeof value==='object')index(value,depth+1);};index(data);const resolve=value=>value?.['@id'] && references.get(value['@id']) || value;let remaining=100;
        const visit=(item,depth=0)=>{if(!item || typeof item!=='object'||depth>6||remaining--<=0)return;if(Array.isArray(item)){item.forEach(value=>visit(value,depth+1));return;}const types=[item['@type']].flat();if(types.includes('TVEpisode')){const parentSeason=resolve(item.partOfSeason),show=resolve(item.partOfSeries)?.name || resolve(parentSeason?.partOfSeries)?.name,season=parentSeason?.seasonNumber ?? item.seasonNumber,part=item.episodeNumber;if(show && number(season)!==null && number(part)!==null)add(show,String(item.datePublished||'').slice(0,4),'Page metadata',{showTitle:clean(show,'Page metadata'),season:Number(season),episode:Number(part),episodeTitle:clean(item.name,'Page metadata')});else add(item.name,String(item.datePublished||'').slice(0,4),'Page metadata');}else if(types.some(type=>['Movie','TVSeries','VideoObject'].includes(type)))add(item.name,String(item.datePublished||'').slice(0,4),'Page metadata');for(const value of Object.values(item))if(value&&typeof value==='object')visit(value,depth+1);};visit(data);
      }catch{/* Ignore malformed page metadata. */}
    }
    for(const element of document.querySelectorAll('h1,[data-testid="title"]'))if(visible(element))add(element.textContent,'','Visible title');
    add(document.querySelector('meta[property="og:title"]')?.content,'','Page title');
    add(document.title,'','Tab title');
    let selected=candidates[0];
    if(!selected)return null;
    // Fill an episode name only from a caption label matching show and numbers.
    for(const info of episodes.slice(0,10))if(!info.episodeTitle && video){
      for(const track of Array.from(video.textTracks || []).slice(0,100)){
        const parsed=episode(String(track.label || '').replace(/[._]/g,' '));
        if(parsed && titleKey(parsed.showTitle)===titleKey(info.showTitle) && parsed.season===info.season && parsed.episode===info.episode){
          const name=parsed.episodeTitle.split(/\s+(?:\d{3,4}p|DSNP|WEB|BluRay|HDTV|H264|H265|DDP|x264|x265)\b/i)[0].trim();
          if(name && !/^(?:\d|eng|ara|en\b|ar\b)/i.test(name)){info.episodeTitle=name.slice(0,100);info.title=format(info);break;}
        }
      }
    }
    const bare=selected.title.match(/^(?:S(?:eason)?\s*(\d{1,3})\s*[: ._-]*E(?:pisode)?\s*(\d{1,3}))\b(.*)$/i);
    const related=bare ? episodes.find(item=>item.season===Number(bare[1]) && item.episode===Number(bare[2])) : episodes.find(item=>titleKey(item.showTitle)===titleKey(selected.showTitle || selected.title) || item.episodeTitle && titleKey(item.episodeTitle)===titleKey(selected.title));
    if(bare && related)selected={...related,episodeTitle:bare[3].replace(/^[\s.\u00b7:_\-\u2013\u2014]+/,'').trim() || related.episodeTitle,source:selected.source,year:selected.year || related.year};
    if(!selected.showTitle && related)selected={...related,source:selected.source,year:selected.year || related.year};
    if(!selected.showTitle){
      const route=location.pathname.match(/\/(?:watch\/)?tv\/\d+\/(\d{1,3})\/(\d{1,3})(?:\/|$)/i);
      if(route && !bare)selected={...selected,showTitle:selected.title,season:Number(route[1]),episode:Number(route[2]),episodeTitle:'',type:'episode'};
    }
    if(selected.showTitle){
      if(!selected.episodeTitle)selected.episodeTitle=episodes.find(item=>titleKey(item.showTitle)===titleKey(selected.showTitle) && item.season===selected.season && item.episode===selected.episode && item.episodeTitle)?.episodeTitle || '';
      selected.title=format(selected);
    }
    // Copy a page year only when its film name matches the player title.
    if(!selected.year)selected.year=candidates.find(item=>item.year && titleKey(item.showTitle || item.title)===titleKey(selected.showTitle || selected.title) && (!selected.showTitle || item.showTitle && item.season===selected.season && item.episode===selected.episode))?.year || '';
    return selected;
  }
  globalThis.SubtitleFilm={detect,episode,format};
})();
