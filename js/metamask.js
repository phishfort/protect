'use strict';

console.log("Running metamask pass-through");
const browser = window.chrome || window.msBrowser || window.browser;

window.addEventListener("message", function (event) {
    if (event.source == window &&
        event.data &&
        event.data.direction == "from-page-script") {
            
        var data = JSON.parse(event.data.message);
        var passThroughPayload = data;

        // this.console.log("Content script received message: ", data);
        // this.console.log("Sending chrome runtime message to extensionId: " + data.extensionId + " with payload: ", passThroughPayload);
        chrome.runtime.sendMessage(data.extensionId, passThroughPayload , function (response) {
            // console.log("Metamask pass-through got response: ", response);
            // now send back to webpage:
            window.postMessage({
                direction: "from-protect",
                message: JSON.stringify({ func: data.func, response: response })
            }, "*");
        });
    }
});