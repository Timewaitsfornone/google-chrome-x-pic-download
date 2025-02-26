document.addEventListener('DOMContentLoaded', () => {
  const extractButton = document.getElementById('extractButton');

  extractButton.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const sourceTabId = tabs[0].id;
      chrome.tabs.create({url: 'images.html'}, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.sendMessage(tabId, {type: 'init', sourceTabId: sourceTabId});
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });
    });
  });
});
