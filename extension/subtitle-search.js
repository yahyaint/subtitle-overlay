// Search URL construction is shared by the popup and the overlay through the worker.
const SubtitleSearch = (() => {
  const defaultUrl = 'https://www.opensubtitles.org/en/search2/sublanguageid-{language3}/moviename-{title}/movieyear-{year}';
  const languages = {en:'eng',ar:'ara',de:'ger',fr:'fre',es:'spa',it:'ita',pt:'por','pt-br':'pob',nl:'dut',pl:'pol',tr:'tur',ru:'rus',uk:'ukr',he:'heb',fa:'per',zh:'chi',ja:'jpn',ko:'kor',hi:'hin',sv:'swe',da:'dan',fi:'fin',no:'nor',el:'ell',ro:'rum',hu:'hun',cs:'cze',sk:'slo',id:'ind',th:'tha',vi:'vie',bg:'bul',hr:'hrv',sr:'scc',af:'afr',sq:'alb',eu:'baq',bn:'ben',bs:'bos',ca:'cat',et:'est',tl:'tgl',is:'ice',lv:'lav',lt:'lit',mk:'mac',ms:'may',ml:'mal',sl:'slv',sw:'swa',ta:'tam',te:'tel',ur:'urd'};
  function episode(title) {
    const match=String(title).match(/^(.*?)\s+S(\d{1,3})\s*[: ._-]*E(\d{1,3})\b\s*(?:-\s*)?(.*)$/i);
    return match && match[1].trim() ? {showTitle:match[1].trim(),season:Number(match[2]),episode:Number(match[3]),episodeTitle:match[4].trim().slice(0,100)} : null;
  }
  function query(input) {
    const title=String(input.query ?? input.title ?? '').trim();
    const language=String(input.language || 'en').trim().toLowerCase();
    const year=String(input.year || '').trim();
    if (!title || title.length>200) throw new Error('Enter a film title.');
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(language) || language.length>40) throw new Error('Enter a language code, such as en or ar.');
    if (year && !/^(18|19|20|21)\d{2}$/.test(year)) throw new Error('Enter a valid year.');
    return {title,language,year,...episode(title)};
  }
  function template(value) {
    if (typeof value!=='string' || value.length>2000 || !value.includes('{title}')) throw new Error('The search link must include {title}.');
    const url=new URL(value.replace(/\{(title|language|language3|year)\}/g,'test'));
    if (url.protocol!=='https:' || url.username || url.password || !['opensubtitles.org','opensubtitles.com'].some(host=>url.hostname===host || url.hostname.endsWith('.'+host))) throw new Error('Use an HTTPS OpenSubtitles search link.');
    if (/\{[^}]*\}/.test(value.replace(/\{(title|language|language3|year)\}/g,''))) throw new Error('Use {title}, {language}, {language3}, or {year}.');
    return value;
  }
  function website(value, input) {
    const current=query(input);
    const language3=languages[current.language] || languages[current.language.split('-')[0]] || (current.language.length===3 ? current.language : 'all');
    const fields={...current,language3,title:value===defaultUrl && current.showTitle ? current.showTitle : current.title};
    const url=template(value).replace(/\{(title|language|language3|year)\}/g,(_,key)=>encodeURIComponent(fields[key])).replace(/\/movieyear-(?=\/|$)/g,'');
    return url+(value===defaultUrl && current.showTitle ? '/season-'+current.season+'/episode-'+current.episode : '');
  }
  return {defaultUrl,query,template,website,episode};
})();
if (typeof module!=='undefined') module.exports=SubtitleSearch;
