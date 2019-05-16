'use strict';

const browser = window.chrome || window.msBrowser || window.browser;

const SAFE_COLOR = "#17Bf63";
const SAFE_LABEL = "Safe";
const SAFE_TITLE = "The site is verified";

const UNKNOWN_COLOR = "#969696";
const UNKNOWN_LABEL = "Unknown";
const UNKNOWN_TITLE = "The site is unknown";

const DANGEROUS_COLOR = "#ff0400";
const DANGEROUS_LABEL = "Dangerous";
const DANGEROUS_TITLE = "This site is dangerous";

const tabs = {};
var blacklist, whitelist, twitterWhitelist;
let bypassWarning = false;
let bypassDomains = [];

updateBlacklists();
setInterval(function () {
  updateBlacklists();
}, 5 * 60 * 1000);

updateWhitelists();
setInterval(function () {
  updateWhitelists();
  bypassDomains = [];
}, 1 * 60 * 60 * 1000);

browser.browserAction.setBadgeText({ text: ' ' });
browser.browserAction.setBadgeBackgroundColor({ color: UNKNOWN_COLOR });

function updateBlacklists() {
  $.getJSON("https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/domains.json", function (data) {
    blacklist = data;
  });
}

function updateWhitelists() {
  $.getJSON("https://raw.githubusercontent.com/phishfort/phishfort-lists/master/whitelists/twitter.json", function (data) {
    twitterWhitelist = data;
  });
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
      if (domain === "twitter.com") {
        return;
      }
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

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.func) {
    case "bypassDomain":
      browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let url = tabs[0].url.split("?url=", 2)[1];
        let domain = getDomainFromURL(url);

        bypassDomains.push(domain);
        browser.tabs.update(tabs[0].id, { url: url });
      });
      break;
    case "popup":
      browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        updateIcon(tabs[0].id);
      });
      break;
    case "twitterLists":
      sendResponse({ whitelist: twitterWhitelist });
      break;
    case "enableTwitter":
      localStorage["twitter-enabled"] = request.value;
      break;
    case "twitterEnabled":
      sendResponse(JSON.parse(localStorage["twitter-enabled"]));
      break;
  }
});

// chrome.runtime.onMessageExternal.addListener(
//   (request, sender, sendResponse) => {
//     if (sender.url === 'https://www.phishfort.com/login' || sender.url === 'https://www.phishfort.com/profile' || true) {
//       switch (request.func) {
//         case "login":
//           if (request.token && typeof request.token !== 'undefined') {
//             localStorage["sessionID"] = request.token;
//             localStorage["address"] = request.address;
//             sendResponse({ success: true });
//           } else {
//             sendResponse({ success: false });
//           }
//           break;
//         case "logout":
//           delete localStorage["sessionID"];
//           delete localStorage["address"];
//           sendResponse({ success: true });
//           break;
//         case "getSession":
//           sendResponse({ sessionID: localStorage["sessionID"], success: true });
//           break;
//       }
//     }
//   });

function updateIcon(tabId) {
  if (tabs[tabId] == null || tabs[tabId].state === UNKNOWN_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: UNKNOWN_COLOR });
    updatePopup(UNKNOWN_LABEL, UNKNOWN_COLOR, UNKNOWN_TITLE);
  } else if (tabs[tabId].state === SAFE_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: SAFE_COLOR });
    updatePopup(SAFE_LABEL, SAFE_COLOR, SAFE_TITLE);
  } else if (tabs[tabId].state === DANGEROUS_LABEL) {
    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: DANGEROUS_COLOR });
    updatePopup(DANGEROUS_LABEL, DANGEROUS_COLOR, DANGEROUS_TITLE);
  }
}

function updatePopup(text, color, title) {
  var views = browser.extension.getViews({ type: "popup" });
  if (views.length > 0) {
    if (views[0].document.getElementById("statusPhrase")) {
      views[0].document.getElementById("statusPhrase").textContent = text;
      views[0].document.getElementById("headerBar").style.backgroundColor = color;
      views[0].document.getElementById("headerBar").title = title;
    }
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

function checkTwitter(tabId, url) {
  if (typeof url !== 'undefined') {
    let domain = getDomainFromURL(url);

    if (domain === "twitter.com") {
      chrome.tabs.sendMessage(tabId, { func: "clearTagged" }, function (response) { });
      if (twitterSafeDomain(url)) {
        tabs[tabId] = { state: SAFE_LABEL };
      } else {
        tabs[tabId] = { state: UNKNOWN_LABEL };
      }
    }
  }
}

function twitterSafeDomain(url) {
  try {
    let handle = url.match(/^https?:\/\/(mobile.|www\.)?twitter\.com\/(#!\/)?([^/]+)(\/\w+)*$/)[3];

    return twitterWhitelist.some(function (safeHandle) {
      return handle.toLowerCase() === safeHandle.toLowerCase();
    });
  } catch (error) {
    console.log(error)
    return false;
  }
}

browser.tabs.onCreated.addListener(function (tab) {
  checkTwitter(tab.id, tab.url);
  updateIcon(tab.id);
});

browser.tabs.onActivated.addListener(function (tab) {
  checkTwitter(tab.id, tab.url);
  updateIcon(tab.id);
});

browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  checkTwitter(tabId, changeInfo.url);
  updateIcon(tabId);
});

