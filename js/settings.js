const browser = window.chrome || window.msBrowser || window.browser;

browser.runtime.sendMessage({ func: "popup" });

// Twitter
var twitterToggle = document.getElementById("twitterToggle");

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

// Blacklist
var addressBlacklistToggle = document.getElementById("addressBlacklistToggle");

addressBlacklistToggle.addEventListener('change', function () {
  if (this.checked) {
    browser.runtime.sendMessage({ func: "enableAddressBlacklist", value: true });
  } else {
    browser.runtime.sendMessage({ func: "enableAddressBlacklist", value: false });
  }
});

browser.runtime.sendMessage({ func: "addressBlacklistEnabled" }, function (res) {
  addressBlacklistToggle.checked = res;
});


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