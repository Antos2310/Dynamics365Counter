
(function () {

  document.addEventListener('createlink', (data) => {
    if (data.detail && (data.detail.content === 'WebPage' || data.detail.content === 'PluginSteps' || data.detail.content === 'GetAllCount')) {
      chrome.runtime.sendMessage(data.detail);
    }
  });



  var installScript = function (file, type) {
    var scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', type);
    scriptElement.setAttribute('src', file);
    document.body.appendChild(scriptElement);
  };

  var installCss = function (file, type) {
    var scriptElement = document.createElement('link');
    scriptElement.setAttribute('type', type);
    scriptElement.setAttribute('href', file);
    scriptElement.setAttribute('id', file);
    scriptElement.setAttribute('rel', "stylesheet");
    document.body.appendChild(scriptElement);
  }

  installScript(chrome.extension.getURL('mainmethods.js'), 'text/javascript');
  installCss(chrome.extension.getURL('counterdialog.css'), 'text/css');
})();