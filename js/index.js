'use strict';

const background = chrome.extension.getBackgroundPage();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-124583884-3']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var status = JSON.stringify(request);
  document.getElementById("statusPhrase").textContent = JSON.parse(status).safety;
  document.getElementById("statusPhrase").style.color = JSON.parse(status).color;
  document.getElementById("statusIndicator").style.color = JSON.parse(status).color;
}); 

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
  background.checkSafety(tabs[0].id);
}); 