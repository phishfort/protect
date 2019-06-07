'use strict';

var blacklist = [];
var dangerousAddresses = [];

console.log("Running address blacklisting")

async function getAddressWhitelist() {
	chrome.runtime.sendMessage({ func: "addressLists" }, async function (res) {
		blacklist = res.blacklist;
		setTimeout(await checkPage(), 3 * 1000);
	});
}

async function checkPage() {
	for (var address in blacklist) {
		if (blacklist.hasOwnProperty(address)) {
			if ((
				document.documentElement.innerText || document.documentElement.textContent.toLowerCase().toLowerCase()
			).indexOf(address.toLowerCase()) > -1) {
				// Bad address
				if (!modalOpen) {
					await openModal();
					modalOpen = true;
				}
				if (dangerousAddresses.indexOf(address) === -1) {
					dangerousAddresses.push(address);
					insertItem(address);
				}
			}
		}
	}
}

async function checkContent(content) {
	for (var address in blacklist) {
		if (blacklist.hasOwnProperty(address)) {
			if (content.toLowerCase().indexOf(address.toLowerCase()) > -1) {
				// Bad address
				if (!modalOpen) {
					await openModal();
					modalOpen = true;
				}
				if (dangerousAddresses.indexOf(address) === -1) {
					dangerousAddresses.push(address);
					insertItem(address);
				}
			}
		}
	}
}

var modalOpen, modalFetched = false;

chrome.runtime.sendMessage({ func: "addressBlacklistEnabled" }, function (res) {
  if (res) {
    window.addEventListener("load", start, false);
  }
});

function start(evt) {
	getAddressWhitelist();
}

function openModal() {
	if (!modalFetched) {
		return fetch(chrome.extension.getURL('/html/modal.html'))
			.then(response => response.text())
			.then(data => {
				document.body.innerHTML += data;
				var modal = document.getElementById("phishfort-protect-modal");
				var ignoreBtn = document.getElementById("ignore-btn");
				modalFetched = true;
				ignoreBtn.onclick = function () {
					modal.style.display = "none";
					modalOpen = false;
					dangerousAddresses = [];
					let root = document.getElementById("phishfort-protect-dangerous-addresses");
					while (root.firstChild) {
						root.removeChild(root.firstChild);
					}
				}
			}).catch(err => {
				// handle error
			});
	} else {
		var modal = document.getElementById("phishfort-protect-modal");
		modal.style.display = "block";
		var ignoreBtn = document.getElementById("ignore-btn");
		ignoreBtn.onclick = function () {
			modal.style.display = "none";
			modalOpen = false;
			dangerousAddresses = [];
			let root = document.getElementById("phishfort-protect-dangerous-addresses");
			while (root.firstChild) {
				root.removeChild(root.firstChild);
			}
		}
	}
}

function insertItem(address) {
	var node = document.createElement("li");
	var textnode = document.createTextNode(address);
	node.appendChild(textnode);
	document.getElementById("phishfort-protect-dangerous-addresses").appendChild(node);
}

document.addEventListener('copy', function (e) {
	// This approach detects an empty string for Firefox inputs, so will not trigger
	checkContent(window.getSelection().toString());
});

document.addEventListener('paste', function (e) {
	checkContent(e.clipboardData.getData('text'));
});

// function extractEthereum(str) {
// 	return str.match(/0x[a-fA-F0-9]{40}/g);
// };

// function extractBitcoin(str) {
// 	return (str.match(/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g) || []).concat((str.match(/bc(0([ac-hj-np-z02-9]{39}|[ac-hj-np-z02-9]{59})|1[ac-hj-np-z02-9]{8,87})/g))|| []);
// };

// function extractMonero() {
//   return; //4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}
// }

// let res = extractBitcoin('asfd 0xC47b6812694d35F6d03B1556c0240dd206a1B874 an83characterlonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1tt5tgs 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
// console.log(res)