var whitelist = [];

console.log("Running Twitter monitoring")

function addBadges() {
  let usernames = contains('span', '@');

  for (user of usernames) {
    let username = user.textContent.toLowerCase().substring(1);
    if (whitelist.some(item => item.toLowerCase() === username)) {
      if (!user.getAttribute("phishfort-tagged") && !user.parentElement.getAttribute("phishfort-tagged")) {
        var icon = document.createElement("img");
        icon.src = chrome.runtime.getURL('/img/twitter-whitelisted.png');
        icon.style = "padding-left:3px;display:inline;vertical-align:text-bottom;float:none;height:15px;width:15px;left:15px;";
        icon.title = `@${username} is a PhishFort verified user`;
        icon.setAttribute('phishfort-badge', true);
        user.appendChild(icon);
        user.setAttribute("phishfort-tagged", true);
      }
    }
  }
  removeReplyToBadges();
}


function removeReplyToBadges() {
  let links = document.links;

  for (link of links) {
    if (link.parentElement.innerText.includes("Replying to")) {
      try {
        let img = link.childNodes[0].childNodes[0].childNodes[0].childNodes[1];
        let img2 = link.childNodes[0].childNodes[0].childNodes[1];

        if (img.getAttribute('phishfort-badge')) {
          img.setAttribute("style", "display:none");
        }
        if (img2.getAttribute('phishfort-badge')) {
          img2.setAttribute("style", "display:none");
        }
      } catch (error) {
        // Failed to parse new Twitter 'reply to' structure
        // Try old Twitter structure
        try {
          let img = link.childNodes[0].childNodes[2];
          let img2 = link.childNodes[0].childNodes[3];

          if (img.getAttribute('phishfort-badge')) {
            img.setAttribute("style", "display:none");
          }
          if (img2.getAttribute('phishfort-badge')) {
            img2.setAttribute("style", "display:none");
          }
        } catch (error) {
          // Unable to parse structure
        }
      }
    }
  }
}

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return [].filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
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
    getTwitterWhitelist();
    addBadges();
    setupObserver();
  }
});

function getTwitterWhitelist() {
  chrome.runtime.sendMessage({ func: "twitterLists" }, function (res) {
    whitelist = res.whitelist;
  });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.func) {
    case "clearTagged":
      let tags = document.querySelectorAll('[phishfort-tagged]');
      for (tag of tags) {
        tag.removeAttribute("phishfort-tagged");
      }
      let existingBadges = document.querySelectorAll('[phishfort-badge]');
      for (badge of existingBadges) {
        badge.setAttribute("style", "display:none");
      }
      sendResponse({ success: true });
      break;
  }
  return true;
});