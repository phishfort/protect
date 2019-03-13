const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({popup: true});

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

// privacy policy has not been accepted yet
if (!hasAccepted()) {
  window.location.href="/html/privacy.html";
}