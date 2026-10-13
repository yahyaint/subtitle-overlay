const BACKGROUND_SCRIPTS=['private-storage.js','subtitle-search.js','subtitles.js','subtitle-settings.js','download-folder.js','subtitle-download.js','background.js'];
function browserManifest(base,target){
  const manifest=structuredClone(base);
  if(target==='chromium')return manifest;
  if(!['firefox','safari'].includes(target))throw new Error('Unknown browser target: '+target);
  manifest.background={scripts:BACKGROUND_SCRIPTS};
  for(const resource of manifest.web_accessible_resources || [])delete resource.use_dynamic_url;
  delete manifest.minimum_chrome_version;
  if(target==='firefox')manifest.browser_specific_settings={gecko:{
    id:'subtitle-overlay@yahyanabil.com',strict_min_version:'140.0',
    data_collection_permissions:{required:['searchTerms','websiteContent','authenticationInfo']}
  }};
  // Safari source preparation: browser download APIs are unavailable.
  // Manual file import and provider API import remain available.
  if(target==='safari')manifest.permissions=manifest.permissions.filter(name=>name!=='downloads');
  return manifest;
}
module.exports={browserManifest,BACKGROUND_SCRIPTS};
