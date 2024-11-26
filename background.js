importScripts('settings.js');

const settings = new Settings();
const cache = new Cache();
console.log(settings)

// Глобальный промис для загрузки настроек
const settingsLoaded = (async () => {
  await settings.load();
  console.log("Настройки загружены при запуске:", settings);
})();



// Сканирует сайт
async function scanPageText(text) {
  await settingsLoaded;

  if (typeof text !== 'string') {
    throw new Error("Provided text is not a string");
  }

  const limit = settings.limit || 160;
  let score = 0;
  let foundWords = {}; // Словарь для сохранения найденных слов

  for (const [key, value] of Object.entries(settings.blockvals)) {
    if (value) {
      const regex = new RegExp(value, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        score += parseInt(key);
        if (foundWords[parseInt(key)]) {
          if (Array.isArray(foundWords[parseInt(key)])) {
            foundWords[parseInt(key)].push(match[0]);
          } else {
            foundWords[parseInt(key)] = [foundWords[parseInt(key)], match[0]];
          }
        } else {
          foundWords[parseInt(key)] = match[0];
        }
        if (score > limit) {
          return [score, foundWords]; // Возвращаем объект с счетом и списком слов, если счет превышает лимит
        }
      }
    }
  }

  return [score, foundWords]; // Возвращаем объект с итоговым счетом и списком всех найденных слов
}

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("Ошибка разбора URL:", error);
    return null; // Или другое значение по умолчанию
  }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);

  (async () => {
    try {
      // Ожидание загрузки настроек перед обработкой сообщения
      await settingsLoaded; // Т.к бэграунд закрывается, нам перед всем остальным важно, чтобы настройки подгрузились заново
      //Сейчас существует два типа сообщение "sendPageText" с content_end.js
      // "checkWhitelistStatus" с content_start_blocking_video.js TODO: переименовать их, чтобы было понятно что это вообще
      // TODO: нужен какой-то класс взаимодействий, чтобы ввести в код порядок и не делать много if else
      // TODO: разнести повторяющие элементы в ф-и
      if (request.message === "sendPageText" && typeof request.pageText === 'string') {
        console.log("Настройки при получении сообщения:", settings);
        const url = sender.tab.url;
        console.log("Current URL:", url);
        console.log(request.pageText);
        if (settings.whitelist.split('|').includes(getDomain(sender.tab.url))) { // Есть ли сайт в белом списке
          console.log("Сайт в белом списке, его домен", getDomain(sender.tab.url));
          console.log(settings.whitelist);
          sendResponse({ status: "success" });
        } else if (settings.blockpage.split('|').includes(getDomain(sender.tab.url))) { // Есть ли сайт в чёрном списке
          console.log("In blocklist");
          chrome.tabs.update(sender.tab.id, { url: 'pages/BlockPage/index.html' }, () => {
            chrome.storage.local.set({ status: "blockList", score: 160, language: "unknown", foundWords: {} }, () => {
              sendResponse({ status: "blocked", score: 160 });
            });
          })
        } else if (cache.has(url)) {
          // Если URL уже есть в кэше, используем закэшированный результат
          const cachedResult = cache.get(url);
          console.log("Using cached result:", cachedResult);

          if (cachedResult.score > settings.limit || (cachedResult.language && !['en', 'ru', 'unknown'].includes(cachedResult.language))) {
            chrome.tabs.update(sender.tab.id, { url: 'pages/BlockPage/index.html' }, () => {
              chrome.storage.local.set({ status: "blocked_by_cache", score: cachedResult.score, language: cachedResult.language, foundWords: cachedResult.foundWords }, () => {
                sendResponse({ status: "blocked", score: cachedResult.score });
              });
            });
          } else {
            sendResponse({ status: "success", score: cachedResult.score });
          }
        } else {
          // Выполняем сканирование текста страницы и определение языка
          console.log("Scanning page text...");
          const scan_Promise = scanPageText(request.pageText);

          let languagePromise = Promise.resolve(null);
          const wordCount = request.pageText.split(/\s+/).length;
          if (wordCount > 10) { // Кол-во слов для определения языка, возможно стоит увеличить ?
            console.log("Detecting language...");
            languagePromise = new Promise((resolve, reject) => {
              chrome.i18n.detectLanguage(request.pageText, (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  //resolve(result.languages[0].language);
                  resolve(result);
                }
              });
            });
          } else {
            console.log("Too few words to detect language.");
            languagePromise = Promise.resolve({ languages: [{ language: "unknown", percentage: 100 }] }); // Устанавливаем язык "Unknown"
          }

          const [result_scan, result_detect_language] = await Promise.all([scan_Promise, languagePromise]);
          let score = result_scan[0];
          let foundWords = result_scan[1];
          let language = result_detect_language.languages[0].language;
          let language_detect_percentage = result_detect_language.languages[0].percentage;
          console.log("Scan complete. Score:", score);
          console.log("Scan complete. foundWords:", foundWords);
          console.log("Language detected:", language);
          console.log("Language detection accuracy percentage", language_detect_percentage);

          // Сохраняем результат в кэш
          console.log("Saving result to cache...");
          cache.set(url, { score, language, foundWords});

          // Проверяем, превышает ли score лимит или язык не английский и не русский
          if (score > settings.limit || (language && !['en', 'ru', 'unknown'].includes(language))) {
            chrome.tabs.update(sender.tab.id, { url: 'pages/BlockPage/index.html' }, () => {
              chrome.storage.local.set({ status: "blocked_by_scan", score, language, foundWords }, () => {
                sendResponse({ status: "blocked", score, language });
              });
            });
          } else {
            sendResponse({ status: "success", score, language });
          }
        }
      } else if (request.message === "checkWhitelistStatus") {
        // Запуск для проверки блокировки видео
        console.log("Запрос на блокировку видео получен, проверяется белый список")
        const url_domen = getDomain(sender.tab.url);

        console.log(settings.whitelist)
        console.log("Внешний вид url", url_domen)
        if (settings.whitelist.split('|').includes(url_domen)) {
          console.log("Блокировка видео не возможна inWhiteList")
          sendResponse({ status: "inWhiteList" });
        } else {
          sendResponse({ status: "blockingVideo" });
        }

      } else {
        sendResponse({ error: "Unknown message type or missing pageText" });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sendResponse({ error: error.message });
    }
  })();

  // Сообщаем Chrome, что ответ будет отправлен асинхронно
  return true;
});


// Событие изменения хранилища. Если через option.html меняются настройки, то мы их здесь обновляем
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    await settings.load();
    console.log("Настройки обновлены:", settings);
  }
});
