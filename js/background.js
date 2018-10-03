'use strict';

var blacklist, whitelist;


$.getJSON("../blacklist.json", function (data) {
  blacklist = data;
});

$.getJSON("../whitelist.json", function (data) {
  whitelist = data;
});

chrome.browserAction.setBadgeText({ text: ' ' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#969696' });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  checkSafety(tabId);
});

chrome.tabs.onCreated.addListener(function (tab) {
  checkSafety(tab.id);
});

function checkSafety(tabId) {
  if (typeof tabId === 'undefined') {
    return;
  }

  var result = {};
  chrome.tabs.get(tabId, function (tab) {
    if (checkMatch(blacklist, tab.url)) {
      // Blacklisted
      chrome.tabs.update(tabId, { url: "../warning.html" });
      chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#ff0400' });
      result = { safety: "Dangerous", color: '#ff0400' }
    } else if (checkMatch(whitelist, tab.url)) {
      // Whitelisted
      chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#0071bc' });
      result = { safety: "Safe", color: '#0071bc' }
    } else {
      // Unknown
      chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#969696' });
      result = { safety: "Unknown", color: '#969696' }
    }
    chrome.runtime.sendMessage(result, function(response) {});
  })
}

function checkMatch(array, domain) {
  domain = domain.split('/')[2];
  let match = false;
  array.forEach(element => {
    if (domain.endsWith(element)) {
      match = true;
      return;
    }
  });
  return match;
}


