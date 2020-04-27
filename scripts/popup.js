'use strict';

document.getElementById('crmCounterLinks').addEventListener('click',function(e){
  chrome.runtime.sendMessage({
      type:e.target.id
  });
  window.close();
  
}, false);
