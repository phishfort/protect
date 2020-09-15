'use strict';

const browser = window.msBrowser || window.browser || window.chrome;

let bypassButton = document.getElementById("bypassButton");

bypassButton.addEventListener("click", function (event) {
  browser.runtime.sendMessage({ func: "bypassDomain", url: window.location.href });
});