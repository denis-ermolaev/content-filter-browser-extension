import { Settings, CacheSite, MessageHandler, logger, check_in_list } from './settings';


// Включение - выключение логгирования
// * Синтаксис logger.log(module_name, то что нужно распечатать)
// ! Выключать перед коммитом
//logger.logging['general_logging'] = true // background.js
//logger.logging['sendPageText_processing'] = true // Обработка сообщения sendPageText_processing с content_end.js
//logger.logging['checkWhitelistStatus_processing'] = true // checkWhitelistStatus_processing с contentVideo.js
//logger.logging['settings'] = true // Отладка класса настроек
//logger.logging['caches'] = true // Отладка кэша
logger.logging['time_count'] = true
//logger.logging['Data_science'] = true // Оставлять включенным, используется для сбора тектов


const settings = new Settings();
logger.log('general_logging',settings) // Пустные настройки
const cache = new CacheSite();


// Прослушивание событие отправки сообщений на бэграунд. Получает запросы с других скриптов
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { // calback должен быть обязательно синхронным
  const asyncHandler = async () => { //Поэтому внутри него создаём асинхронную ф-ю
    try {
      await settings.load();
      logger.log('general_logging', "Асинхронная ф-я прослушивания сообщений", request, settings);
      // Здесь потом ещё нужно будет ожидать загрузку кэша, когда он будет сохранять свои данные в хранилище
      const message_handler = new MessageHandler(request, sender, sendResponse, settings, cache);
      await message_handler.request_processing(); // Обработка сообщений и отправка ответа
    } catch(error) {
      console.error(error);
      sendResponse({ error });
    }
  };
  asyncHandler();
  return true;
});
// Прослушивание событие изменения хранилища. Если через option.html меняются настройки, то мы их здесь обновляем
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    await settings.load();
    logger.log('general_logging',"Обновление в хранилище, настроки обновлены:", settings);
  }
});

//Похоже можно удалить, ни разу не видел, чтобы оно отрабатывало
chrome.alarms.get("Red_button_timer", (alarm) => {
  (async() => {
    await settings.load();
    console.log(!alarm, settings.red_button);
    if (!alarm && settings.red_button) {
      console.log("Создание таймера Red_button_timer", alarm);
      chrome.alarms.create("Red_button_timer", {
        delayInMinutes: 1, // 1 / 60 - 1 секунда
        periodInMinutes: 1,
      });
    } else {
      console.log("Таймер с именем 'Red_button_timer' не будет создан.");
    }
  })();
});
// Обработчик срабатывания таймера
chrome.alarms.onAlarm.addListener((alarm) => {
  (async() => {
    await settings.load();
    if (alarm.name === "Red_button_timer") {
      if (settings.red_button) {
        if (settings.red_button_timer > 0) {
          settings.red_button_timer--;
          await settings.save();
          console.log("settings.red_button_timer", settings.red_button_timer);
        } else {
          settings.red_button = false;
          await settings.save();
        }
      } else {
        chrome.alarms.clear("Red_button_timer");
      }
    }
  })();
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  (async () => {
    await settings.load();
    console.log(tab.url, check_in_list(tab.url, settings.whitelist));
    if (changeInfo.audible && !check_in_list(tab.url, settings.whitelist)) {
      // Если звук включен на вкладке, блокируем его
      chrome.tabs.update(tabId, { muted: true });
    }
  })();
});

const blockedMimeTypes = ['audio/mpeg', 'video/mp4', 'image/jpeg', 'image/png'];
const blockedExtensions = ['.mp3', '.mp4', '.jpeg', '.png'];

// Храним список ID загрузок, которые уже были обработаны
const processedDownloads = new Set();

chrome.downloads.onCreated.addListener(function (downloadItem) {
  console.log("Download created:", downloadItem);

  // Проверяем уже известные данные на момент создания
  const mimeType = downloadItem.mime || "unknown";
  const filename = downloadItem.filename ? downloadItem.filename.toLowerCase() : "";

  if (shouldBlockDownload(mimeType, filename)) {
    cancelDownload(downloadItem.id);
  }
});

chrome.downloads.onChanged.addListener(function (delta) {
  // Проверяем, обновился ли MIME-тип или имя файла
  if (delta.mime || delta.filename) {
    chrome.downloads.search({ id: delta.id }, function (results) {
      if (results && results.length > 0) {
        const item = results[0];
        const mimeType = item.mime || "unknown";
        const filename = item.filename ? item.filename.toLowerCase() : "";

        if (!processedDownloads.has(item.id) && shouldBlockDownload(mimeType, filename)) {
          cancelDownload(item.id);
        }
      }
    });
  }
});

// Функция проверки, нужно ли блокировать загрузку
function shouldBlockDownload(mimeType, filename) {
  const isBlockedMime = blockedMimeTypes.includes(mimeType);
  const isBlockedExtension = blockedExtensions.some((ext) => filename.endsWith(ext));
  return isBlockedMime || isBlockedExtension;
}

// Функция отмены загрузки
function cancelDownload(downloadId) {
  chrome.downloads.cancel(downloadId, function () {
    if (chrome.runtime.lastError) {
      console.error(`Error cancelling download ${downloadId}: ${chrome.runtime.lastError.message}`);
    } else {
      console.log(`Download with ID ${downloadId} has been cancelled.`);
      processedDownloads.add(downloadId); // Помечаем как обработанную
    }
  });
}



