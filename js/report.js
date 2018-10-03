'use strict';


let reportCurrent = document.getElementById("reportCurrent");
let maliciousSite = document.getElementById("maliciousSite");

reportCurrent.onclick = function (element) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    maliciousSite.value = tabs[0].url;
  }); 
};

function recaptcha_callback(data) {
  $.post("https://us-central1-plugin-recaptcha.cloudfunctions.net/validate-captcha", { malicious: document.getElementById("maliciousSite").value, target: document.getElementById("target").value, comment: document.getElementById("comment").value, captcha: data },
    function (returnedData) {
      window.location.replace("success.html");
    }).fail(function (xhr, status, error) {
      console.log(xhr, xhr.status, status, error)
      recaptcha_error();
    });
}

function recaptcha_error() {
  window.location.replace("error.html");
};

