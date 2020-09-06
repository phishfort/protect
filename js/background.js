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

const LIST_BASE = "https://raw.githubusercontent.com/phishfort/phishfort-lists/master";
const DOMAIN_BLACKLIST_URL  = `${LIST_BASE}/blacklists/domains.json`;
const DOMAIN_WHITELIST_URL  = `${LIST_BASE}/whitelists/domains.json`;
const TWITTER_WHITELIST_URL = `${LIST_BASE}/whitelists/twitter.json`;

const tabs = {};
var blacklist, whitelist, twitterWhitelist, addressBlacklist;
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

chrome.browserAction.setIcon({ path: "/img/tab-icon-unknown.png" });

function updateBlacklists() {
  fetch(DOMAIN_BLACKLIST_URL).then(async data => {
    blacklist = await data.json();
    console.info(`Retrieved Domain Blacklist: ${blacklist.length} items.`);
  });
}

function updateWhitelists() {
  fetch(DOMAIN_WHITELIST_URL).then(async data => {
    whitelist = await data.json();
    console.info(`Retrieved Domain Whitelist: ${whitelist.length} items.`);
  });
  fetch(TWITTER_WHITELIST_URL).then(async data => {
    twitterWhitelist = await data.json();
    console.info(`Retrieved Twitter Whitelist: ${twitterWhitelist.length} items.`);
  });
}

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
    case "addressLists":
      sendResponse({ blacklist: addressBlacklist });
      break;
    case "enableTwitter":
      localStorage["twitter-enabled"] = request.value;
      break;
    case "twitterEnabled":
      sendResponse(JSON.parse(localStorage["twitter-enabled"]));
      break;
    case "enableAddressBlacklist":
      localStorage["address-blacklist-enabled"] = request.value;
      break;
    case "addressBlacklistEnabled":
      sendResponse(JSON.parse(localStorage["address-blacklist-enabled"]));
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
    browser.browserAction.setIcon({ path: "/img/tab-icon-unknown.png", tabId: tabId });
    updatePopup(UNKNOWN_LABEL, UNKNOWN_COLOR, UNKNOWN_TITLE);
  } else if (tabs[tabId].state === SAFE_LABEL) {
    browser.browserAction.setIcon({ path: "/img/tab-icon-safe.png", tabId: tabId });
    updatePopup(SAFE_LABEL, SAFE_COLOR, SAFE_TITLE);
  } else if (tabs[tabId].state === DANGEROUS_LABEL) {
    browser.browserAction.setIcon({ path: "/img/tab-icon-dangerous.png", tabId: tabId });
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
  try {
    return (new URL(url)).hostname.replace(/^www\./, '');
  } catch (e) {
    console.warn(`Attempt to construct URL from invalid input: ${url}`);
  }
}

function domainInArray(currentDomain, arr) {
  try {
    return arr.some(function (domain) {
      return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
  } catch (error) {
    // List not fetched yet
    return false;
  }
}

function checkTwitter(tabId, url) {
  // Check that url is truthy, rather than undefined.
  // This test will fail for empty strings.
  if (url) {
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

function getVersion() {
  var details = browser.runtime.getManifest();
  return details.version;
}

//////////////////////////////
//////////////////////////////
// Auto accept old user's PP to avoid double acceptance
let prevVersion = localStorage['protect-privacy-version']
// If this is a new install, localStorage will be empty and prevVersion will be undefined
let versions = prevVersion && prevVersion.split(".");
let acceptedTerms = localStorage['accepted-terms'];

if (!acceptedTerms && versions && versions[1] == 9) {
  if (versions[2] <= 3) {
    updateBlacklists();
    updateWhitelists();
    localStorage['accepted-terms'] = true
    localStorage["twitter-enabled"] = true;
    localStorage["address-blacklist-enabled"] = true;
  }
}
//////////////////////////////
//////////////////////////////

function loadTutorial() {
  //let currVersion = getVersion();
  let completedTutorial = localStorage['phishfort-tutorial']

  // first run
  if (!completedTutorial) {
    chrome.tabs.create({ url: "/html/start.html" });
    localStorage['phishfort-tutorial'] = true;
  }
}

loadTutorial()

