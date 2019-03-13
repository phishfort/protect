'use strict';

const browser = window.chrome || window.msBrowser || window.browser;

const SAFE_COLOR = "#0071bc";
const SAFE_LABEL = "Safe";

const UNKNOWN_COLOR = "#969696";
const UNKNOWN_LABEL = "Unknown";

const DANGEROUS_COLOR = "#ff0400";
const DANGEROUS_LABEL = "Dangerous";

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
browser.browserAction.setBadgeBackgroundColor({ color: UNKNOWN_COLOR });

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
      let isWarningPage = request.url.startsWith(browser.extension.getURL("html/warning.html"));
      let domain = getDomainFromURL(request.url);
      if (domainInArray(domain, whitelist)) {
        tabs[request.tabId] = { state: SAFE_LABEL };
      } else if (domainInArray(domain, blacklist) ||
        bypassDomains.includes(domain) ||
        isWarningPage) {
        tabs[request.tabId] = { state: DANGEROUS_LABEL }
        if (!bypassDomains.includes(domain) && !isWarningPage) {
          return {
            redirectUrl: browser.extension.getURL("../html/warning.html") + "?url=" + request.url
          }
        }
      } else {
        tabs[request.tabId] = { state: UNKNOWN_LABEL };
      }
    }
  }, {
    urls: ['<all_urls>'], types: ['main_frame']
  }, ['blocking', 'requestBody']);

browser.runtime.onMessage.addListener((request) => {
  if (request.bypassDomain) {
    browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      let url = tabs[0].url.split("?url=", 2)[1];
      let domain = getDomainFromURL(url);

      bypassDomains.push(domain);
      browser.tabs.update(tabs[0].id, { url: url });
    });
  }
  if (request.popup) {
    browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      updateIcon(tabs[0].id);
    });
  }
});

function updateIcon(tabId) {
  if (tabs[tabId] == null || tabs[tabId].state === UNKNOWN_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: UNKNOWN_COLOR });
    updatePopup(UNKNOWN_LABEL, UNKNOWN_COLOR);
  } else if (tabs[tabId].state === SAFE_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: SAFE_COLOR });
    updatePopup(SAFE_LABEL, SAFE_COLOR);
  } else if (tabs[tabId].state === DANGEROUS_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: DANGEROUS_COLOR });
    updatePopup(DANGEROUS_LABEL, DANGEROUS_COLOR);
  }
}

function updatePopup(text, color) {
  var views = browser.extension.getViews({ type: "popup" });
  if (views.length > 0) {
    views[0].document.getElementById("statusPhrase").textContent = text;
    views[0].document.getElementById("statusPhrase").style.color = color;
    views[0].document.getElementById("statusIndicator").style.color = color;
  }
}

function getDomainFromURL(url) {
  return (new URL(url)).hostname.replace(/^www\./, '');
}

function domainInArray(currentDomain, arr) {
  return arr.some(function (domain) {
    return currentDomain === domain || currentDomain.endsWith('.' + domain);
  });
}

browser.tabs.onCreated.addListener(function (tab) {
  updateIcon(tab.id);
});

browser.tabs.onActivated.addListener(function (tab) {
  updateIcon(tab.id);
});

browser.tabs.onUpdated.addListener(function (tabId) {
  updateIcon(tabId);
});



