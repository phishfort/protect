'use strict';

const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "popup" });

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