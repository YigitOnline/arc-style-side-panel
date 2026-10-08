/**
 * Arc Style Side Panel - Chrome Extension
 * Copyright (C) 2026 Yiğit Halil Koca
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Icons provided by Flaticon (https://www.flaticon.com/).
 */
// Yan panele tıklanınca açılması için gerekli komut
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
