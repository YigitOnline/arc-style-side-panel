/**
 * Arc Style Side Panel - Chrome Extension
 * Copyright (C) 2026 Yiğit Halil Koca 
 * https://www.yigitonline.com
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Icons provided by Flaticon (https://www.flaticon.com/).
 */


const DEFAULT_PINS = [
  "https://gemini.google.com",
  "https://www.youtube.com",
  "https://open.spotify.com",
  "https://mail.google.com"
];

const MAX_FAVORITES = 8;

let customFolderIcons = {};
let selectedFolderId = null;
let draggedPinIndex = null;
let currentLang = "tr";

// DİL SÖZLÜĞÜ (TRANSLATION DICTIONARY)
const TRANSLATIONS = {
  tr: {
    goBack: "Geri",
    goForward: "İleri",
    reload: "Yenile",
    searchPlaceholder: "Arayın veya URL girin...",
    favoritesHeader: "FAVORİLER",
    addFavorite: "Yeni Sabit Site Ekle",
    openTabsHeader: "AÇIK SEKMELER",
    tidyBtn: "✦ Kategorize Et",
    tidyTooltip: "Sekmeleri benzer sitelere göre sırala",
    clearAllBtn: "Tümünü Kapat",
    clearAllTooltip: "Tüm sekmeleri kapat",
    newTab: "Yeni Sekme",
    bookmarksHeader: "YER İMLERİ",
    settings: "Ayarlar",
    settingsTitle: "Panel Ayarları",
    languageLabel: "Dil / Language:",
    color1Label: "Renk 1 (Başlangıç):",
    color2Label: "Renk 2 (Degrade):",
    noiseToggleLabel: "Gren Aç/Kapa:",
    noiseOpacityLabel: "Gren Dozajı:",
    exportBtn: "Kişiselleştirmeyi Dışa Aktar",
    importBtn: "Kişiselleştirmeyi İçe Aktar",
    changeIconMenu: "İkonu Emoji ile Değiştir",
    promptAddFavorite: "Sabitlemek istediğiniz sitenin URL'sini girin:",
    promptChangeIcon: "Yeni bir emoji (Düzen -> Emoji ve Semboller) girin:",
    confirmClearTabs: "Diğer tüm sekmeleri kapatmak istediğinizden emin misiniz?",
    maxFavoritesAlert: "Favoriler alanına en fazla 8 site ekleyebilirsiniz.",
    importSuccess: "Ayarlarınız başarıyla yüklendi!",
    importError: "Geçersiz bir ayar dosyası yüklendi."
  },
  en: {
    goBack: "Back",
    goForward: "Forward",
    reload: "Reload",
    searchPlaceholder: "Search or enter URL...",
    favoritesHeader: "FAVORITES",
    addFavorite: "Add New Pinned Site",
    openTabsHeader: "OPEN TABS",
    tidyBtn: "✦ Sort",
    tidyTooltip: "Sort tabs by website domain",
    clearAllBtn: "Clear All",
    clearAllTooltip: "Close all other tabs",
    newTab: "New Tab",
    bookmarksHeader: "BOOKMARKS",
    settings: "Settings",
    settingsTitle: "Panel Settings",
    languageLabel: "Language / Dil:",
    color1Label: "Color 1 (Start):",
    color2Label: "Color 2 (Gradient):",
    noiseToggleLabel: "Toggle Noise:",
    noiseOpacityLabel: "Noise Opacity:",
    exportBtn: "Export",
    importBtn: "Import",
    changeIconMenu: "Change Icon",
    promptAddFavorite: "Enter the URL of the website to pin:",
    promptChangeIcon: "Enter a new emoji:",
    confirmClearTabs: "Are you sure you want to close all other tabs?",
    maxFavoritesAlert: "You can pin a maximum of 8 sites to favorites.",
    importSuccess: "Settings imported successfully!",
    importError: "Invalid settings file selected."
  }
};

// Flaticon (456793) Stilinde Kapalı ve Açık Klasör SVG Vektörleri
const FOLDER_CLOSED_SVG = `<svg class="folder-svg-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464,128H272L208,64H48A32,32,0,0,0,16,96V416a32,32,0,0,0,32,32H464a32,32,0,0,0,32-32V160A32,32,0,0,0,464,128Z"/></svg>`;
const FOLDER_OPEN_SVG = `<svg class="folder-svg-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464,128H272L208,64H48A32,32,0,0,0,16,96V416a32,32,0,0,0,32,32H464a32,32,0,0,0,32-32V160A32,32,0,0,0,464,128ZM48,96H195.15l64,64H464v32H48ZM464,416H48V224H464Z"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
  loadCustomTheme();
  loadFavorites();
  loadTabs();
  loadFolderIconsAndBookmarks();
  setupGlobalDragAndDrop();

  // Navigasyon Butonları
  document.getElementById("goBackBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.goBack(tabs[0].id);
    });
  });

  document.getElementById("goForwardBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.goForward(tabs[0].id);
    });
  });

  document.getElementById("reloadBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
  });

  document.getElementById("urlInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      let url = e.target.value.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://www.google.com/search?q=" + encodeURIComponent(url);
      }
      chrome.tabs.create({ url });
      e.target.value = "";
    }
  });

  document.getElementById("tidyTabsBtn").addEventListener("click", tidyTabs);
  document.getElementById("clearAllTabsBtn").addEventListener("click", () => {
    if (confirm(TRANSLATIONS[currentLang].confirmClearTabs)) {
      clearAllTabs();
    }
  });

  const settingsBtn = document.getElementById("settingsToggleBtn");
  const settingsPopup = document.getElementById("settingsPopup");

  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsPopup.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!settingsPopup.contains(e.target) && e.target !== settingsBtn) {
      settingsPopup.classList.remove("open");
    }
    document.getElementById("customContextMenu").style.display = "none";
  });

  const picker1 = document.getElementById("colorPicker1");
  const picker2 = document.getElementById("colorPicker2");
  const noiseToggle = document.getElementById("noiseToggle");
  const noiseSlider = document.getElementById("noiseOpacitySlider");
  const langSelect = document.getElementById("langSelect");

  picker1.addEventListener("input", updateThemeFromInputs);
  picker2.addEventListener("input", updateThemeFromInputs);
  noiseToggle.addEventListener("change", updateThemeFromInputs);
  noiseSlider.addEventListener("input", updateThemeFromInputs);

  langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    chrome.storage.local.set({ language: currentLang }, () => {
      applyLanguage(currentLang);
    });
  });

  // EXPORT / IMPORT EVENT LISTENERS
  document.getElementById("exportSettingsBtn").addEventListener("click", exportSettings);
  document.getElementById("importSettingsBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document.getElementById("importFileInput").addEventListener("change", importSettings);

  document.getElementById("addPinBtn").addEventListener("click", () => {
    const url = prompt(TRANSLATIONS[currentLang].promptAddFavorite, "https://");
    if (url && url !== "https://") {
      addFavoritePinAt(url);
    }
  });

  document.getElementById("changeFolderIconOption").addEventListener("click", () => {
    if (selectedFolderId) {
      const currentVal = customFolderIcons[selectedFolderId] || "";
      const newIcon = prompt(TRANSLATIONS[currentLang].promptChangeIcon, currentVal);

      if (newIcon !== null) {
        const trimmedVal = newIcon.trim();

        if (trimmedVal === "") {
          delete customFolderIcons[selectedFolderId];
        } else {
          customFolderIcons[selectedFolderId] = trimmedVal;
        }

        chrome.storage.local.set({ folderIcons: customFolderIcons }, () => loadBookmarks());
      }
    }
  });
});

/* EXPORT / IMPORT FONKSİYONLARI */
function exportSettings() {
  chrome.storage.local.get(null, (data) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `arc-sidepanel-backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
}

function importSettings(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (typeof importedData === "object" && importedData !== null) {
        chrome.storage.local.clear(() => {
          chrome.storage.local.set(importedData, () => {
            alert(TRANSLATIONS[currentLang].importSuccess);
            loadCustomTheme();
            loadFavorites();
            loadFolderIconsAndBookmarks();
          });
        });
      } else {
        alert(TRANSLATIONS[currentLang].importError);
      }
    } catch (err) {
      alert(TRANSLATIONS[currentLang].importError);
    }
  };
  reader.readAsText(file);
}

function applyLanguage(lang) {
  currentLang = lang || "tr";
  const dict = TRANSLATIONS[currentLang];

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) el.title = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });

  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.value = currentLang;
}

function setupGlobalDragAndDrop() {
  const grid = document.getElementById("favoritesGrid");

  grid.addEventListener("dragover", (e) => {
    e.preventDefault();
    const isInternal = (draggedPinIndex !== null);
    const pinsCount = document.querySelectorAll("#favoritesGrid .fav-icon:not(.dragging)").length;

    if (!document.querySelector(".fav-placeholder")) {
      if (isInternal || pinsCount < MAX_FAVORITES) {
        showPlaceholderAt(grid, pinsCount);
      }
    }
  });

  grid.addEventListener("drop", (e) => {
    e.preventDefault();
    
    const placeholder = document.querySelector(".fav-placeholder");
    if (!placeholder) return;

    const targetIndex = parseInt(placeholder.dataset.targetIndex, 10);
    const rawData = e.dataTransfer.getData("text/plain");

    removePlaceholder();

    if (rawData) {
      chrome.storage.local.get(["pinnedSites"], (result) => {
        let pins = (result.pinnedSites || DEFAULT_PINS).slice(0, MAX_FAVORITES);

        try {
          const data = JSON.parse(rawData);

          if (data.type === "favorite" && data.index !== undefined) {
            const originIndex = data.index;
            const [movedItem] = pins.splice(originIndex, 1);
            pins.splice(targetIndex, 0, movedItem);

            chrome.storage.local.set({ pinnedSites: pins }, () => renderFavorites(pins));
          } else if (data.type === "tab" && data.url) {
            addFavoritePinAt(data.url, targetIndex);
          }
        } catch (err) {
          if (rawData.startsWith("http")) addFavoritePinAt(rawData, targetIndex);
        }
      });
    }
  });

  grid.addEventListener("dragleave", (e) => {
    if (!grid.contains(e.relatedTarget)) {
      removePlaceholder();
    }
  });
}

function showPlaceholderAt(grid, targetIndex) {
  let placeholder = document.querySelector(".fav-placeholder");

  if (!placeholder) {
    placeholder = document.createElement("div");
    placeholder.className = "fav-placeholder";
  }

  placeholder.dataset.targetIndex = targetIndex;

  const items = Array.from(grid.querySelectorAll(".fav-icon:not(.dragging)"));

  if (targetIndex >= items.length) {
    grid.appendChild(placeholder);
  } else {
    grid.insertBefore(placeholder, items[targetIndex]);
  }
}

function removePlaceholder() {
  const placeholder = document.querySelector(".fav-placeholder");
  if (placeholder) placeholder.remove();
}

function updateThemeFromInputs() {
  const c1 = document.getElementById("colorPicker1").value;
  const c2 = document.getElementById("colorPicker2").value;
  const noise = document.getElementById("noiseToggle").checked;
  const opacity = document.getElementById("noiseOpacitySlider").value;

  document.getElementById("noiseValDisplay").innerText = opacity;
  applyTheme(c1, c2, noise, opacity);

  chrome.storage.local.set({
    themeColor1: c1,
    themeColor2: c2,
    themeNoise: noise,
    noiseOpacity: opacity
  });
}

function applyTheme(c1, c2, noise, opacity) {
  document.body.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  document.body.style.backgroundAttachment = "fixed";

  const noiseOverlay = document.getElementById("noiseOverlay");
  noiseOverlay.style.display = noise ? "block" : "none";
  document.documentElement.style.setProperty('--noise-opacity', opacity);

  const r = parseInt(c1.substr(1, 2), 16);
  const g = parseInt(c1.substr(3, 2), 16);
  const b = parseInt(c1.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  if (yiq >= 128) {
    document.documentElement.style.setProperty('--text-main', '#1c1c1e');
    document.documentElement.style.setProperty('--text-sub', '#6c6c70');
    document.documentElement.style.setProperty('--bg-card', 'rgba(0, 0, 0, 0.06)');
    document.documentElement.style.setProperty('--bg-card-hover', 'rgba(0, 0, 0, 0.12)');
    document.documentElement.style.setProperty('--bg-active', 'rgba(0, 0, 0, 0.18)');
    document.documentElement.style.setProperty('--input-bg', 'rgba(0, 0, 0, 0.08)');
  } else {
    document.documentElement.style.setProperty('--text-main', '#e5e5ea');
    document.documentElement.style.setProperty('--text-sub', '#8e8e93');
    document.documentElement.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.08)');
    document.documentElement.style.setProperty('--bg-card-hover', 'rgba(255, 255, 255, 0.14)');
    document.documentElement.style.setProperty('--bg-active', 'rgba(255, 255, 255, 0.22)');
    document.documentElement.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.1)');
  }
}

function loadCustomTheme() {
  chrome.storage.local.get(["themeColor1", "themeColor2", "themeNoise", "noiseOpacity", "language"], (res) => {
    const c1 = res.themeColor1 || "#1c1c1e";
    const c2 = res.themeColor2 || "#2c2c2e";
    const noise = res.themeNoise !== undefined ? res.themeNoise : true;
    const opacity = res.noiseOpacity || "0.08";
    const lang = res.language || "tr";

    document.getElementById("colorPicker1").value = c1;
    document.getElementById("colorPicker2").value = c2;
    document.getElementById("noiseToggle").checked = noise;
    document.getElementById("noiseOpacitySlider").value = opacity;
    document.getElementById("noiseValDisplay").innerText = opacity;

    applyTheme(c1, c2, noise, opacity);
    applyLanguage(lang);
  });
}

function getFaviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
}

function tidyTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.sort((a, b) => {
      try {
        const hostA = new URL(a.url).hostname;
        const hostB = new URL(b.url).hostname;
        return hostA.localeCompare(hostB);
      } catch (e) { return 0; }
    });
    tabs.forEach((tab, index) => chrome.tabs.move(tab.id, { index }));
    loadTabs();
  });
}

function clearAllTabs() {
  chrome.tabs.query({ currentWindow: true, active: false }, (tabs) => {
    const tabIds = tabs.map(tab => tab.id);
    if (tabIds.length > 0) chrome.tabs.remove(tabIds, () => loadTabs());
  });
}

function loadFavorites() {
  chrome.storage.local.get(["pinnedSites"], (result) => {
    const pins = result.pinnedSites || DEFAULT_PINS;
    renderFavorites(pins);
  });
}

function renderFavorites(pins) {
  const grid = document.getElementById("favoritesGrid");
  grid.innerHTML = "";

  const limitedPins = pins.slice(0, MAX_FAVORITES);

  limitedPins.forEach((siteUrl, index) => {
    const div = document.createElement("div");
    div.className = "fav-icon";
    div.title = siteUrl;
    div.setAttribute("draggable", "true");
    div.dataset.index = index;

    const iconUrl = getFaviconUrl(siteUrl);

    div.innerHTML = `
      <img src="${iconUrl}" onerror="this.src='icon.png'">
      <span class="delete-pin-btn">✕</span>
    `;

    div.addEventListener("dragstart", (e) => {
      draggedPinIndex = index;
      div.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "favorite", index: index, url: siteUrl }));
    });

    div.addEventListener("dragend", () => {
      draggedPinIndex = null;
      removePlaceholder();
      renderFavorites(limitedPins);
    });

    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentPinCount = limitedPins.length;
      const isInternal = (draggedPinIndex !== null);

      if (!isInternal && currentPinCount >= MAX_FAVORITES) {
        return;
      }

      showPlaceholderAt(grid, index);
    });

    div.addEventListener("click", (e) => {
      if (!e.target.classList.contains("delete-pin-btn")) {
        chrome.tabs.create({ url: siteUrl });
      }
    });

    div.querySelector(".delete-pin-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavoritePin(siteUrl);
    });

    grid.appendChild(div);
  });
}

function addFavoritePinAt(siteUrl, insertIndex = null) {
  chrome.storage.local.get(["pinnedSites"], (result) => {
    let pins = result.pinnedSites || DEFAULT_PINS;
    const exists = pins.includes(siteUrl);

    if (!exists && pins.length >= MAX_FAVORITES) {
      alert(TRANSLATIONS[currentLang].maxFavoritesAlert);
      return;
    }

    pins = pins.filter(p => p !== siteUrl);

    if (insertIndex !== null && insertIndex >= 0 && insertIndex <= MAX_FAVORITES) {
      pins.splice(insertIndex, 0, siteUrl);
    } else {
      pins.push(siteUrl);
    }

    pins = pins.slice(0, MAX_FAVORITES);
    chrome.storage.local.set({ pinnedSites: pins }, () => renderFavorites(pins));
  });
}

function removeFavoritePin(siteUrl) {
  chrome.storage.local.get(["pinnedSites"], (result) => {
    let pins = result.pinnedSites || DEFAULT_PINS;
    pins = pins.filter(p => p !== siteUrl);
    chrome.storage.local.set({ pinnedSites: pins }, () => renderFavorites(pins));
  });
}

function loadTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const list = document.getElementById("tabsList");
    const existingItems = list.querySelectorAll(".tab-item:not(.new-tab-item)");
    existingItems.forEach(el => el.remove());

    const newTabBtn = document.getElementById("newTabRow");
    newTabBtn.onclick = () => chrome.tabs.create({});

    tabs.forEach(tab => {
      const div = document.createElement("div");
      div.className = `tab-item ${tab.active ? 'active' : ''}`;
      div.setAttribute("draggable", "true");

      const faviconSrc = tab.favIconUrl || getFaviconUrl(tab.url || "https://google.com");

      div.innerHTML = `
        <img class="tab-icon" src="${faviconSrc}" onerror="this.src='icon.png'">
        <span class="tab-title">${tab.title || TRANSLATIONS[currentLang].newTab}</span>
        <span class="close-btn" data-id="${tab.id}">✕</span>
      `;

      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "tab", url: tab.url, title: tab.title }));
      });

      div.addEventListener("click", (e) => {
        if (!e.target.classList.contains("close-btn")) {
          chrome.tabs.update(tab.id, { active: true });
        }
      });

      div.querySelector(".close-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.tabs.remove(tab.id, () => loadTabs());
      });

      list.appendChild(div);
    });
  });
}

function loadFolderIconsAndBookmarks() {
  chrome.storage.local.get(["folderIcons"], (result) => {
    customFolderIcons = result.folderIcons || {};
    loadBookmarks();
  });
}

function loadBookmarks() {
  chrome.bookmarks.getTree((nodes) => {
    const list = document.getElementById("bookmarksList");
    list.innerHTML = "";
    if (nodes[0] && nodes[0].children) {
      renderBookmarkTree(nodes[0].children, list);
    }
  });
}

function renderBookmarkTree(nodes, container) {
  nodes.forEach(node => {
    if (node.url) {
      const div = document.createElement("div");
      div.className = "bookmark-item";
      const iconUrl = getFaviconUrl(node.url);
      div.innerHTML = `
        <img class="bookmark-icon" src="${iconUrl}" onerror="this.style.display='none'">
        <span class="tab-title">${node.title}</span>
      `;
      div.addEventListener("click", () => chrome.tabs.create({ url: node.url }));
      container.appendChild(div);
    } else if (node.children && node.children.length > 0) {
      const folderDiv = document.createElement("div");
      folderDiv.className = "folder-container";

      const initialIcon = customFolderIcons[node.id] || FOLDER_CLOSED_SVG;

      const header = document.createElement("div");
      header.className = "folder-item";
      header.innerHTML = `
        <span class="folder-icon-display">${initialIcon}</span>
        <span class="tab-title">${node.title}</span>
      `;

      header.addEventListener("dragover", (e) => {
        e.preventDefault();
        header.classList.add("drag-over");
      });

      header.addEventListener("dragleave", () => {
        header.classList.remove("drag-over");
      });

      header.addEventListener("drop", (e) => {
        e.preventDefault();
        header.classList.remove("drag-over");
        const rawData = e.dataTransfer.getData("text/plain");
        if (rawData) {
          try {
            const data = JSON.parse(rawData);
            if (data.type === "tab" && data.url) {
              chrome.bookmarks.create({ parentId: node.id, title: data.title || data.url, url: data.url }, () => {
                loadBookmarks();
              });
            }
          } catch (err) {}
        }
      });

      const content = document.createElement("div");
      content.className = "folder-content";

      header.addEventListener("click", () => {
        folderDiv.classList.toggle("open");
        const iconDisplay = header.querySelector(".folder-icon-display");

        if (!customFolderIcons[node.id]) {
          if (folderDiv.classList.contains("open")) {
            iconDisplay.innerHTML = FOLDER_OPEN_SVG;
          } else {
            iconDisplay.innerHTML = FOLDER_CLOSED_SVG;
          }
        }
      });

      header.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectedFolderId = node.id;
        const contextMenu = document.getElementById("customContextMenu");
        contextMenu.style.display = "block";
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
      });

      folderDiv.appendChild(header);
      folderDiv.appendChild(content);
      container.appendChild(folderDiv);

      renderBookmarkTree(node.children, content);
    }
  });
}

chrome.tabs.onCreated.addListener(loadTabs);
chrome.tabs.onUpdated.addListener(loadTabs);
chrome.tabs.onRemoved.addListener(loadTabs);
chrome.tabs.onActivated.addListener(loadTabs);
