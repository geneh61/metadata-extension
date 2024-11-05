let lastMetadata = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "viewImageMetadata",
    title: "View Image Metadata",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "viewImageMetadata") {
    chrome.tabs.sendMessage(tab.id, { action: "getMetadata", imageUrl: info.srcUrl }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message to content script: ", chrome.runtime.lastError.message);
      } else {
        console.log("Message sent successfully to content script");
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showMetadata") {
    lastMetadata = request.metadata;
    chrome.windows.create({
      url: 'popup/popup.html',
      type: 'popup',
      width: 500,
      height: 700
    });
  } else if (request.action === "getMetadataForPopup") {
    if (lastMetadata) {
      sendResponse({ metadata: lastMetadata});
    } else {
      sendResponse({ metadata: null });
    }
  }
  return true;
});