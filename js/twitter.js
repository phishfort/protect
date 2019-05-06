var whitelist = [];

function getWhitelist() {
  chrome.runtime.sendMessage({ func: "twitterLists" }, function (res) {
    whitelist = res.whitelist;
  });
}

function addBadges() {
  let links = document.links;

  for (var i = 0; i < links.length; i++) {
    let link = links[i];
    let username = link.getAttribute("href").replace("/", "").toLowerCase();
    if (whitelist.some(item => item.toLowerCase() === username) && !link.getAttribute("phishfort-tagged")) {
      if (link.innerHTML.indexOf("@") > -1) {
        if (!link.parentElement.innerHTML.includes("Replying to")) {
          var icon = document.createElement("img");
          icon.src = chrome.runtime.getURL('/img/twitter-whitelisted.png');
          icon.style = "padding-left:3px;display:inline;vertical-align:top;float:none;height:15px;width:15px;left:15px;";
          icon.title = `@${username} is a PhishFort verified user`;
          link.appendChild(icon);
          link.setAttribute("phishfort-tagged", 1);
          // link.setAttribute("style", "color: #17Bf63 !important");
        }
      }
    }
  }
}

function setupObserver() {
  let MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
    eventListenerSupported = window.addEventListener;

  if (MutationObserver) {
    let target = document.getElementsByTagName('body')[0];

    let config = {
      childList: true,
      subtree: true
    };
    let observer = new MutationObserver(function (mutations) {
      if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
        addBadges();
      }
    });
    observer.observe(target, config);
  }
  else if (eventListenerSupported) {
    let obj = document.getElementsByTagName('body')[0];
    obj.addEventListener('DOMNodeInserted', addBadges, false);
    obj.addEventListener('DOMNodeRemoved', addBadges, false);
  }
}

chrome.runtime.sendMessage({ func: "twitterEnabled" }, function (res) {
  if (res) {
    getWhitelist();
    addBadges();
    setupObserver();
  }
});