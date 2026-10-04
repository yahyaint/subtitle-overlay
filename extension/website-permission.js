document.getElementById('enable').onclick=async()=>{
  const button=document.getElementById('enable'),status=document.getElementById('status');button.disabled=true;
  try{const granted=await chrome.permissions.request({permissions:['downloads'],origins:['https://*.opensubtitles.org/*','https://*.opensubtitles.com/*']});if(!granted)throw new Error('Access was not granted.');const reply=await chrome.runtime.sendMessage({type:'RESUME_WEBSITE',ticket:new URLSearchParams(location.search).get('ticket')});if(!reply?.ok)throw new Error(reply?.error || 'Start the search again.');}catch(error){status.textContent=error.message;button.disabled=false;}
};
