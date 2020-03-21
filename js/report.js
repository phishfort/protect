'use strict';

const browser = window.msBrowser || window.browser || window.chrome;
const background = browser.extension.getBackgroundPage();

let reportCurrent = document.getElementById("reportCurrent");
let maliciousSite = document.getElementById("maliciousSite");
let list = document.getElementById("targets");

browser.runtime.sendMessage({
  func: "popup"
});

reportCurrent.addEventListener('click', function () {
  browser.tabs.query({
    currentWindow: true,
    active: true
  }, function (tabs) {
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

  document.getElementById("reportButton").classList.add("disabled");
  let dropdown = document.getElementById("typeDropdown");
  let incident = {
    incidentType: dropdown.options[dropdown.selectedIndex].value,
    url: url,
    target: getDNSNameFromURL(document.getElementById("target").value),
    reportedBy: localStorage["address"] ? localStorage["address"] : "anonymous"
  }
  
  let comment = document.getElementById("comment").value

  if (comment.length) {
    incident.comment = comment
  }

  $.post("https://us-central1-counter-phishing.cloudfunctions.net/userReport",
      incident)
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
  return address.substring(0, 4) + "..." + address.substring(address.length - 2, address.length);
}