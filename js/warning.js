'use strict';

const browser = window.msBrowser || window.browser || window.chrome;

window.onload = function (e) {
  let bypassButton = document.getElementById("bypassButton");

  bypassButton.addEventListener("click", function (event) {
    browser.runtime.sendMessage({ bypassDomain: true, url: window.location.href });
  });
};
console.log(browser, "browser")