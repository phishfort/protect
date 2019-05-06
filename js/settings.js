const browser = window.chrome || window.msBrowser || window.browser;

var twitterToggle = document.getElementById("twitterToggle");

browser.runtime.sendMessage({ func: "popup" });

twitterToggle.addEventListener('change', function () {
  if (this.checked) {
    browser.runtime.sendMessage({ func: "enableTwitter", value: true });
  } else {
    browser.runtime.sendMessage({ func: "enableTwitter", value: false });
  }
});

browser.runtime.sendMessage({ func: "twitterEnabled" }, function (res) {
  twitterToggle.checked = res;
});

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