const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "popup" });

function getVersion() {
  var details = browser.runtime.getManifest();
  return details.version;
}

function hasAccepted() {
  let currVersion = getVersion();
  let prevVersion = localStorage['protect-privacy-version']

  // first run
  if (currVersion != prevVersion) {
    localStorage["twitter-enabled"] = true;
    return false;
  }
  return true;
}

// privacy policy has not been accepted yet
if (!hasAccepted()) {
  window.location.href = "/html/privacy.html";
}

let list = document.getElementById("value-list");
const background = browser.extension.getBackgroundPage();

let whitelist = background.whitelist.sort();
whitelist.forEach(function (item) {
  var li = document.createElement('li');
  li.style.background = `url(../img/favicons/${item}-favicon.png) no-repeat 22px 24px`;
  li.style.paddingLeft = "50px";
  li.value = item;
  li.innerHTML = item;
  list.appendChild(li);
});

let options = document.getElementsByTagName("li")

for (let i = 0; i < options.length; i++) {
  options[i].addEventListener("input", function (event) {
    var isInputEvent = (Object.prototype.toString.call(event).indexOf("InputEvent") > -1);
    if (!isInputEvent || whitelist.includes(options[i].value)) {
      browser.tabs.update({ url: `https://${options[i].value}` });
      window.close();
    }
  });
}

const inputField = document.querySelector('.chosen-value');
const dropdown = document.querySelector('.value-list');
const dropdownArray = [...document.querySelectorAll('li')];

let valueArray = [];
dropdownArray.forEach(item => {
  valueArray.push(item.textContent);
});

const closeDropdown = () => {
  dropdown.classList.remove('open');
}

inputField.addEventListener('input', () => {
  dropdown.classList.add('open');
  let inputValue = inputField.value.toLowerCase();
  let results = 0;
  if (inputValue.length > 0) {
    for (let j = 0; j < valueArray.length; j++) {
      if (!(inputValue.substring(0, inputValue.length) === valueArray[j].substring(0, inputValue.length).toLowerCase())) {
        dropdownArray[j].classList.add('closed');
      } else {
        dropdownArray[j].classList.remove('closed');
        results++
      }
      if(results == 0) {

      } 
    }
  } else {
    for (let i = 0; i < dropdownArray.length; i++) {
      dropdownArray[i].classList.remove('closed');
    }
  }
});

dropdownArray.forEach(item => {
  item.addEventListener('click', (evt) => {
    inputField.value = item.textContent;
    dropdownArray.forEach(dropdown => {
      dropdown.classList.add('closed');
      browser.tabs.update({ url: `https://${item.textContent}` });
      window.close();
    });
  });
})

inputField.addEventListener('focus', () => {
  dropdown.classList.add('open');
  dropdownArray.forEach(dropdown => {
    dropdown.classList.remove('closed');
  });
});

inputField.addEventListener('blur', () => {
  dropdown.classList.remove('open');
});

document.addEventListener('click', (evt) => {
  const isDropdown = dropdown.contains(evt.target);
  const isInput = inputField.contains(evt.target);
  if (!isDropdown && !isInput) {
    dropdown.classList.remove('open');
  }
});