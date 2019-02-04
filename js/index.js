const browser = window.msBrowser || window.browser || window.chrome;
let reportBtn = document.getElementById("reportButton");

reportBtn.onclick = function (element) {
  browser.tabs.create({ url: browser.extension.getURL("../html/report.html") });
};

browser.runtime.sendMessage({popup: true});
