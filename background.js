"use strict";

var BYPASS_KEY = "markdownReaderBypassTabs";

function getSessionStorageArea() {
  return chrome.storage.session || chrome.storage.local;
}

function readBypassMap() {
  var area = getSessionStorageArea();
  return area.get(BYPASS_KEY).then(function (result) {
    return result[BYPASS_KEY] || {};
  });
}

function writeBypassMap(map) {
  var area = getSessionStorageArea();
  var payload = {};
  payload[BYPASS_KEY] = map;
  return area.set(payload);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  var tabId = sender && sender.tab && sender.tab.id;
  if (!message || !message.type || typeof tabId !== "number") {
    return;
  }

  if (message.type === "markdown-reader-set-bypass") {
    readBypassMap()
      .then(function (map) {
        map[String(tabId)] = true;
        return writeBypassMap(map);
      })
      .then(function () {
        sendResponse({ ok: true });
      })
      .catch(function () {
        sendResponse({ ok: false });
      });
    return true;
  }

  if (message.type === "markdown-reader-consume-bypass") {
    readBypassMap()
      .then(function (map) {
        var key = String(tabId);
        var hadBypass = !!map[key];
        if (hadBypass) {
          delete map[key];
          return writeBypassMap(map).then(function () {
            return hadBypass;
          });
        }
        return hadBypass;
      })
      .then(function (hadBypass) {
        sendResponse({ bypass: hadBypass });
      })
      .catch(function () {
        sendResponse({ bypass: false });
      });
    return true;
  }
});
