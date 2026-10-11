// The popup and video controller use the same saved-film and episode browser.
var SubtitleLibraryView = (() => {
  const nameKey=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function episodeInfo(entry){
    const match=String(entry.title || '').match(/^(.*?)\s+S(\d{1,3})\s*[: ._-]*E(\d{1,3})\b\s*(?:[-–—]\s*)?(.*)$/i);
    const valid=(show,season,episode)=>typeof show==='string' && show.trim() && Number.isInteger(season) && season>=0 && season<=999 && Number.isInteger(episode) && episode>0 && episode<=999;
    if(valid(entry.showTitle,entry.season,entry.episode))return {showTitle:entry.showTitle.trim(),season:entry.season,episode:entry.episode,episodeTitle:entry.episodeTitle || match?.[4] || ''};
    return match && valid(match[1],Number(match[2]),Number(match[3])) ? {showTitle:match[1].trim(),season:Number(match[2]),episode:Number(match[3]),episodeTitle:match[4]} : null;
  }
  function group(entries){
    const films=new Map(),shows=new Map();
    for(const entry of entries){
      const info=episodeInfo(entry);
      if(!info){if(!films.has(entry.filmKey))films.set(entry.filmKey,[]);films.get(entry.filmKey).push(entry);continue;}
      const key=nameKey(info.showTitle);
      if(!shows.has(key))shows.set(key,{title:info.showTitle,seasons:new Map()});
      const seasons=shows.get(key).seasons;
      if(!seasons.has(info.season))seasons.set(info.season,new Map());
      const episodes=seasons.get(info.season);
      if(!episodes.has(info.episode))episodes.set(info.episode,{title:info.episodeTitle,entries:[]});
      const episode=episodes.get(info.episode);if(!episode.title && info.episodeTitle)episode.title=info.episodeTitle;episode.entries.push(entry);
    }
    return {films,shows};
  }
  function create(root,prefix,onChange){
    const $=suffix=>root.querySelector('#'+prefix+suffix);
    let entries=[],groups=group([]),kind='films',initialized=false;
    function options(select,items,wanted){
      select.replaceChildren();
      for(const [value,label] of items){const option=select.ownerDocument.createElement('option');option.value=String(value);option.textContent=label;select.append(option);}
      if(items.some(([value])=>String(value)===String(wanted)))select.value=String(wanted);
      select.disabled=!items.length;
    }
    function seasons(wantedSeason=$('Season').value,wantedEpisode=$('Episode').value){
      const show=groups.shows.get($('Show').value);
      options($('Season'),[...(show?.seasons.keys() || [])].sort((a,b)=>a-b).map(n=>[n,n===0 ? 'Specials' : 'Season '+n]),wantedSeason);
      episodes(wantedEpisode);
    }
    function episodes(wanted=$('Episode').value){
      const season=groups.shows.get($('Show').value)?.seasons.get(Number($('Season').value));
      options($('Episode'),[...(season || [])].sort(([a],[b])=>a-b).map(([n,item])=>[n,'Episode '+n+(item.title ? ' — '+item.title : '')]),wanted);
    }
    function selected(){return kind==='films' ? groups.films.get($('Film').value) || [] : groups.shows.get($('Show').value)?.seasons.get(Number($('Season').value))?.get(Number($('Episode').value))?.entries || [];}
    function display(){
      $('Films').textContent='Films ('+groups.films.size+')';$('Shows').textContent='Shows ('+groups.shows.size+')';
      $('Films').setAttribute('aria-pressed',String(kind==='films'));$('Shows').setAttribute('aria-pressed',String(kind==='shows'));
      $('FilmField').hidden=kind!=='films';$('ShowFields').hidden=kind!=='shows';
    }
    for(const current of ['films','shows'])$(current==='films' ? 'Films' : 'Shows').onclick=()=>{initialized=true;kind=current;display();onChange();};
    $('Film').onchange=onChange;
    $('Show').onchange=()=>{seasons('','');onChange();};
    $('Season').onchange=()=>{episodes('');onChange();};
    $('Episode').onchange=onChange;
    function update(next,preferred,title){
      const film=$('Film').value,show=$('Show').value,season=$('Season').value,episode=$('Episode').value;
      entries=next;groups=group(entries);
      let target=entries.find(entry=>entry.filmKey===preferred);
      if(!initialized){
        target ||= entries.find(entry=>nameKey(entry.title)===nameKey(title));
        if(!target){const info=episodeInfo({title});if(info)target=entries.find(entry=>{const other=episodeInfo(entry);return other && nameKey(other.showTitle)===nameKey(info.showTitle) && other.season===info.season && other.episode===info.episode;});}
        kind=target ? (episodeInfo(target) ? 'shows' : 'films') : groups.films.size ? 'films' : groups.shows.size ? 'shows' : kind;
        initialized=entries.length>0;
      }
      if(target)kind=episodeInfo(target) ? 'shows' : 'films';
      const info=target && episodeInfo(target);
      options($('Film'),[...groups.films].sort(([,a],[,b])=>a[0].title.localeCompare(b[0].title)).map(([key,items])=>[key,items[0].title+(items[0].year ? ' ('+items[0].year+')' : '')]),target && !info ? target.filmKey : film);
      options($('Show'),[...groups.shows].sort(([,a],[,b])=>a.title.localeCompare(b.title)).map(([key,item])=>[key,item.title]),info ? nameKey(info.showTitle) : show);
      seasons(info ? info.season : season,info ? info.episode : episode);display();
    }
    display();
    return {update,selected,key:()=>selected()[0]?.filmKey,hint:()=>selected().length ? 'Load a file. Save keeps its settings. Delete removes it.' : kind==='shows' ? 'No saved shows. Import subtitles for a show.' : 'No saved films. Import subtitles for a film.'};
  }
  return {episodeInfo,group,create};
})();
if(typeof module!=='undefined')module.exports=SubtitleLibraryView;
