const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ popup: true });

function getVersion() {
  var details = browser.app.getDetails();
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
  window.location.href="/html/index.html";
};