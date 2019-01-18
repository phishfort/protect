'use strict';

const browser = window.chrome || window.msBrowser || window.browser;


const tabs = {};
var blacklist, whitelist;
let bypassWarning = false;
let bypassDomains = [];

updateBlacklist();
setInterval(function () {
  updateBlacklist();
}, 5 * 60 * 1000);

updateWhitelist();
setInterval(function () {
  updateWhitelist();
  bypassDomains = [];
}, 24 * 60 * 60 * 1000);

browser.browserAction.setBadgeText({ text: ' ' });
browser.browserAction.setBadgeBackgroundColor({ color: '#969696' });

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

var result = {};
browser.webRequest.onBeforeRequest.addListener(
  (request) => {
    if (request.tabId >= 0) {
      let isWarningPage = request.url.startsWith(browser.extension.getURL("../html/warning.html"));
      let domain = getDomainFromURL(request.url);

      if (domainInArray(domain, whitelist)) {
        tabs[request.tabId] = { state: "safe" };
      } else if (domainInArray(domain, blacklist) ||
        bypassDomains.includes(domain) ||
        isWarningPage) {
        tabs[request.tabId] = { state: "dangerous" }
        if (!bypassDomains.includes(domain) && !isWarningPage) {
          return {
            redirectUrl: browser.extension.getURL("../html/warning.html") + "?url=" + request.url
          }
        }
      } else {
        tabs[request.tabId] = { state: "unknown" };
      }
    }
  }, {
    urls: ['<all_urls>'], types: ['main_frame']
  }, ['blocking', 'requestBody']);

browser.runtime.onMessage.addListener((request) => {
  if (request.bypassDomain) {
    browser.tabs.query({ active: true }, function (tabs) {
      let tabIndex = tabs.findIndex(tab => tab.url.includes(request.url));
      let url = tabs[tabIndex].url.split("?url=", 2)[1];
      let domain = getDomainFromURL(url);

      bypassDomains.push(domain);
      browser.tabs.update(tabs[tabIndex].id, { url: url });
    });
  }
});

browser.tabs.onCreated.addListener(function (tab) {
  updateIcon(tab.id);
});

browser.tabs.onActivated.addListener(function (tab) {
  updateIcon(tab.id);
});

browser.tabs.onUpdated.addListener(function (tabId) {
  updateIcon(tabId);
});

function updateIcon(tabId) {
  if (tabs[tabId] == null || tabs[tabId].state === "unknown") {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#969696' });
  } else if (tabs[tabId].state === "safe") {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#0071bc' });
  } else if (tabs[tabId].state === "dangerous") {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: '#ff0400' });
  }
}

function getDomainFromURL(url) {
  return (new URL(url)).hostname.replace(/^www\./,'');
}

function domainInArray(currentDomain, arr) {
  return arr.some(function (domain) {
    return currentDomain === domain || currentDomain.endsWith('.' + domain);
  });
}