'use strict';

window.onload = function (e) {
  let bypassButton = document.getElementById("bypassButton");

  bypassButton.addEventListener("click", function (event) {
    chrome.runtime.sendMessage({ bypassDomain: true }, function (response) { });
  });
};
