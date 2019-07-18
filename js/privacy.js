const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "popup" });

function getVersion() {
  var details = browser.runtime.getManifest();
  return details.version;
}

function hasAccepted() {
  // let currVersion = getVersion();
  let prevVersion = localStorage['protect-privacy-version']
  let acceptedTerms = localStorage['accepted-terms'];

  if (acceptedTerms || prevVersion === "0.9.2.1" || prevVersion === "0.9.0") {
    return true;
  }

  // first run
  localStorage["twitter-enabled"] = true;
  localStorage["address-blacklist-enabled"] = true;
  return false;
}

$(document).ready(function () {
  // privacy policy has not been accepted yet
  if (hasAccepted()) {
    document.getElementById("acceptButton").style.display = "none";
  } else {
    document.getElementById("backButton").style.display = "none";
  }
});

let acceptButton = document.getElementById("acceptButton");

acceptButton.onclick = function (element) {
  localStorage['accepted-terms'] = true;
  window.location.href = "/html/index.html";
};

// if (typeof localStorage["sessionID"] !== 'undefined') {
//   // authenticated
//   document.getElementById("loginButton").remove()
// } else {
//   document.getElementById("profileButton").remove()
// };

if (typeof localStorage["address"] !== 'undefined') {
  document.getElementById("profileButton").innerText = shortenAddress(localStorage["address"]);
}

function shortenAddress(address) {
  return address.substring(0,4) + "..." + address.substring(address.length-2,address.length);
}