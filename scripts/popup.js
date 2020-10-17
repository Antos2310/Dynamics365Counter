'use strict';

document.getElementById('crmCounterLinks').addEventListener('click',function(e){
  chrome.runtime.sendMessage({
      type:e.target.id
  }, function(){
    window.close();
  });
}, false);

document.getElementById('crmMetadataBrowser').addEventListener('click',function(e){
  chrome.runtime.sendMessage({
      type:e.target.id
  }, function(){
    window.close();
  });
}, false);

document.getElementById('crmAdvancedFindTools').addEventListener('click',function(e){
  chrome.runtime.sendMessage({
      type:e.target.id
  }, function(){
    window.close();
  });
}, false);



window.onload = function()
{
  document.getElementById("CounterTabs").click();
}

document.getElementById('CounterTabs').addEventListener('click',function(e){
  displayDiv(e, 'crmCounterLinks');
}, false);

document.getElementById('MetadataTabs').addEventListener('click',function(e){
  displayDiv(e, 'crmMetadataBrowser');
}, false);

document.getElementById('AdvancedFindTools').addEventListener('click',function(e){
  displayDiv(e, 'crmAdvancedFindTools');
}, false);

function displayDiv(evt, divId) {

  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(divId).style.display = "block";
  evt.currentTarget.className += " active";
}
