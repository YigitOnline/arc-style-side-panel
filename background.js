// Yan panele tıklanınca açılması için gerekli komut
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});