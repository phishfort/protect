const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "popup" });

function getVersion() {
  var details = browser.runtime.getManifest();
  return details.version;
}

function hasAccepted() {
  let currVersion = getVersion();
  let prevVersion = localStorage['protect-privacy-version']

  if (currVersion != prevVersion) {
    return false;
  }
  return true;
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
  localStorage['protect-privacy-version'] = getVersion();
  window.location.href = "/html/index.html";
};

if (typeof localStorage["sessionID"] !== 'undefined') {
  // authenticated
  document.getElementById("loginButton").remove()
} else {
  document.getElementById("profileButton").remove()
};

if (typeof localStorage["address"] !== 'undefined') {
  document.getElementById("profileButton").innerText = shortenAddress(localStorage["address"]);
}

function shortenAddress(address) {
  return address.substring(0,4) + "..." + address.substring(address.length-2,address.length);
}