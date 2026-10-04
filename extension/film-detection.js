(() => {
  function clean(value, source) {
    const player=source==='Player metadata' || source==='Page metadata';
    return String(value || '').replace(/\s+/g, ' ').trim()
      .replace(player ? /^(?:watch|play)\s+(?:the\s+)?(?:movie|film)\s*[:：]?\s+/i : /^(?:watch|play)(?:\s+(?:the\s+)?(?:movie|film))?\s*[:：]?\s+/i, '')
      .replace(player ? /^(?:مشاهدة|شاهد|شغل)\s+(?:فيلم|الفيلم|مسلسل|المسلسل)\s*[:：]?\s+/ : /^(?:مشاهدة|شاهد|شغل)(?:\s+(?:فيلم|الفيلم|مسلسل|المسلسل))?\s*[:：]?\s+/, '')
      .replace(/\s*[|–—-]\s*(?:Disney\+|Disney Plus|Netflix|Prime Video).*$/i, '')
      .replace(/\s+on\s+(?:Disney\+|Disney Plus|Netflix|Prime Video).*$/i, '')
      .trim().slice(0, 200);
  }
  const validYear = value => /^(18|19|20|21)\d{2}$/.test(String(value)) ? String(value) : '';
  const titleKey = title => title.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  function detect() {
    const candidates=[];
    const add=(value,year,source)=>{
      let title=clean(value,source);
      const dated=title.match(/\s*[([]((?:18|19|20|21)\d{2})[)\]]$/);
      if(dated){year=validYear(year)||dated[1];title=title.slice(0,dated.index).trim();}
      if(!title || /^(?:Disney\+|Disney Plus|Netflix|Prime Video|Home|Watch|Browse|Play|Player|Video|Video player|(?:watch|play) video|Movie|Film|مشغل الفيديو|فيديو|تشغيل|فيلم|Disney\+.*streaming)$/i.test(title))return;
      candidates.push({title,year:validYear(year),source});
    };
    // Playback metadata describes the current film even when the page title is stale.
    try{add(navigator.mediaSession?.metadata?.title,'','Player metadata');}
    catch{/* Some players do not expose media metadata. */}
    const visible=element=>element.getClientRects().length && getComputedStyle(element).visibility!=='hidden';
    const videos=[...document.querySelectorAll('video')].filter(visible)
      .sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height);
    const video=videos[0];
    const player=video?.closest('[data-testid*="player" i], [data-role="player"], .video-player, .video-js, .jwplayer, .plyr, [role="application"]');
    const playerTitles='[data-testid="player-title"], [data-testid="video-title"], [data-role="video-title"], .vjs-title-bar-title, .jw-title-primary';
    for(const element of (player||document).querySelectorAll(player ? playerTitles : '[data-testid="player-title"]'))
      if(visible(element))add(element.textContent,'','Player metadata');
    if(video){
      add(video.getAttribute('data-title'),video.getAttribute('data-year'),'Player metadata');
      add(video.getAttribute('title'),'','Player metadata');
      add(video.getAttribute('aria-label'),'','Player metadata');
    }
    // Read declared film metadata only; never scan application scripts or account state.
    for(const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      if(script.textContent.length>100000)continue;
      try{
        const data=JSON.parse(script.textContent);let remaining=100;
        const visit=(item,depth=0)=>{if(!item || typeof item!=='object'||depth>6||remaining--<=0)return;if(Array.isArray(item)){item.forEach(value=>visit(value,depth+1));return;}const types=[item['@type']].flat();if(types.some(type=>['Movie','TVEpisode','TVSeries','VideoObject'].includes(type)))add(item.name,String(item.datePublished||'').slice(0,4),'Page metadata');for(const value of Object.values(item))if(value&&typeof value==='object')visit(value,depth+1);};visit(data);
      }catch{/* Ignore malformed page metadata. */}
    }
    for(const element of document.querySelectorAll('h1,[data-testid="title"]'))if(visible(element))add(element.textContent,'','Visible title');
    add(document.querySelector('meta[property="og:title"]')?.content,'','Page title');
    add(document.title,'','Tab title');
    const selected=candidates[0];
    if(!selected)return null;
    // Copy a page year only when its film name matches the player title.
    if(!selected.year)selected.year=candidates.find(item=>item.year && titleKey(item.title)===titleKey(selected.title))?.year || '';
    return selected;
  }
  globalThis.SubtitleFilm={detect};
})();
