'use strict';

const browser = window.msBrowser || window.browser || window.chrome;
const background = browser.extension.getBackgroundPage();

let reportCurrent = document.getElementById("reportCurrent");
let maliciousSite = document.getElementById("maliciousSite");
let list = document.getElementById("targets");

browser.runtime.sendMessage({ func: "popup" });

reportCurrent.addEventListener('click', function () {
  browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    maliciousSite.value = tabs[0].url;
  });
}, false);

background.whitelist.forEach(function (item) {
  var option = document.createElement('option');
  option.value = item;
  list.appendChild(option);
});

document.getElementById("reportButton").addEventListener("click", function () {
  recaptchaCallback()
});

function recaptchaCallback() {
  var url = document.getElementById("maliciousSite").value;
  var domain = getDNSNameFromURL(url);

  document.getElementById("reportButton").classList.add("disabled");
  let dropdown = document.getElementById("typeDropdown");

  $.post("https://us-central1-plugin-recaptcha.cloudfunctions.net/userReport",
    {
      incidentType: dropdown.options[dropdown.selectedIndex].value,
      url: url, malicious: domain,
      target: getDNSNameFromURL(document.getElementById("target").value),
      comment: document.getElementById("comment").value
    })
    .done(function () {
      window.location.replace("success.html");
    })
    .fail(function (xhr, status, error) {
      window.location.replace("error.html");
    });
};

// function recaptchaError() {
//   window.location.replace("error.html");
// };

function getDNSNameFromURL(url) {
  if (url.startsWith("http://")) {
    url = url.replace("http://", "");
  } else if (url.startsWith("https://")) {
    url = url.replace("https://", "");
  }

  if (url.indexOf("/") > -1) {
    url = url.split("/")[0];
  }

  let domain = url;

  return domain;
}