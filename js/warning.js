"use strict";

const browser = window.msBrowser || window.browser || window.chrome;

let bypassButton = document.getElementById("bypassButton");
let bypassUrlDisplay = document.getElementById("bypassUrlDisplay");
let bypassUrl = window.location.search.substr(window.location.search.indexOf("=") + 1);
if (!!bypassUrl) {
    bypassUrlDisplay.textContent = bypassUrl;
}

bypassButton.addEventListener("click", function (event) {
    browser.runtime.sendMessage({ func: "bypassDomain", url: window.location.href });
});
