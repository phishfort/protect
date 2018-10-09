'use strict';

const background = chrome.extension.getBackgroundPage();

let reportCurrent = document.getElementById("reportCurrent");
let maliciousSite = document.getElementById("maliciousSite");
let list = document.getElementById("targets");

reportCurrent.onclick = function (element) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    maliciousSite.value = tabs[0].url;
  });
};

background.whitelist.forEach(function (item) {
  var option = document.createElement('option');
  option.value = item;
  list.appendChild(option);
});

function recaptchaCallback(data) {
  var url = document.getElementById("maliciousSite").value;
  var domain = getDomainFromURL(url);

  document.getElementById("reportButton").classList.add("disabled");

  $.post("https://us-central1-plugin-recaptcha.cloudfunctions.net/validate-captcha", { url: url, malicious: domain, target: getDomainFromURL(document.getElementById("target").value), comment: document.getElementById("comment").value, captcha: data },
    function (returnedData) {
      window.location.replace("success.html");
    })
    .fail(function (xhr, status, error) {
      recaptchaError();
    });
}

function recaptchaError() {
  window.location.replace("error.html");
};

function getDomainFromURL(url) {
  if (url.startsWith("http://")) {
    url = url.replace("http://", "");
  } else if (url.startsWith("https://")) {
    url = url.replace("https://", "");
  }

  if(url.indexOf("/") > -1) {
    url = url.split("/")[0];
  }

  let domain = url,
    splitArr = domain.split('.'),
    arrLen = splitArr.length;

  if (arrLen > 2) {
    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    // Check for Country Code Top Level Domain (ccTLD) (e.g. ".co.uk")
    if (((splitArr[arrLen - 2].length == 2) || (splitArr[arrLen - 2].length == 3)) && splitArr[arrLen - 1].length == 2) {
      domain = splitArr[arrLen - 3] + '.' + domain;
    }
  }

  return domain;
}