
var _globalXrm;
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

	if (message.content === 'WebPage') {
		_globalXrm = message.type;

		chrome.tabs.create({
			url: `AttributeMetadata.html`,
		});
	}
	else if (message.content === 'PluginSteps') {
		_globalXrm = message.type;

		chrome.tabs.create({
			url: `PluginSteps.html`,
		});
	}
	else if (message.type === 'GetXrm') {
		sendResponse(_globalXrm);
	}
	else if (message.type === 'RoleAlert') {
		window.postMessage({ type: message.type });
	}
	else {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			chrome.tabs.executeScript(tabs[0].id, {
				code: `window.postMessage({ type: "${message.type}", extensionId: "${chrome.runtime.id}" }, "*");`
			});
		});
	}
});