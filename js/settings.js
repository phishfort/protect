const browser = window.chrome || window.msBrowser || window.browser;

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