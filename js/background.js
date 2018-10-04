'use strict';

var blacklist, whitelist;

updateBlacklist();
updateWhitelist();

// Update blacklist every 5 minutes
setInterval(function () {
  updateBlacklist();
}, 5 * 60 * 1000);

// Update whitelist every 24 hours
setInterval(function () {
  updateWhitelist();
}, 24 * 60 * 60 * 1000);

chrome.browserAction.setBadgeText({ text: ' ' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#969696' });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  checkSafety(tabId);
});

chrome.tabs.onCreated.addListener(function (tab) {
  checkSafety(tab.id);
});

function updateBlacklist() {
  $.getJSON("https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json", function (data) {
    blacklist = data;
  });
}

function updateWhitelist() {
  $.getJSON("https://raw.githubusercontent.com/phishfort/phishfort-lists/master/whitelists/domains.json", function (data) {
    whitelist = data;
  });
}

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
    chrome.runtime.sendMessage(result, function (response) { });
  })
}

function checkMatch(array, url) {
  let domain = (new URL(url).hostname),
    splitArr = domain.split('.'),
    arrLen = splitArr.length;

  if (arrLen > 2) {
    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    // Check for Country Code Top Level Domain (ccTLD) (e.g. ".co.uk")
    if (((splitArr[arrLen - 2].length == 2) || (splitArr[arrLen - 2].length == 3)) && splitArr[arrLen - 1].length == 2) {
      domain = splitArr[arrLen - 3] + '.' + domain;
    }
  }

  let match = false;
  array.forEach(element => {
    if (domain.endsWith(element)) {
      match = true;
      return;
    }
  });
  return match;
}
