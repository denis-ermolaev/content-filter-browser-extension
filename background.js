importScripts('settings.js');

const settings = new Settings();
const cache = new Cache();

// Глобальный промис для загрузки настроек
const settingsLoaded = (async () => {
  await settings.load();
  console.log("Настройки загружены при запуске:", settings);
})();




async function scanPageText(text) {
  await settingsLoaded;

  if (typeof text !== 'string') {
    throw new Error("Provided text is not a string");
  }

  const limit = settings.limit || 160;
  let score = 0;
  let foundWords = {}; // Массив для сохранения найденных слов

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
          return [ score, foundWords ]; // Возвращаем объект с счетом и списком слов, если счет превышает лимит
        }
      }
    }
  }

  return [ score, foundWords ]; // Возвращаем объект с итоговым счетом и списком всех найденных слов
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
      await settingsLoaded;

      if (request.message === "sendPageText" && typeof request.pageText === 'string') {
        console.log("Настройки при получении сообщения:", settings);
        const url = sender.tab.url;
        console.log("Current URL:", url);
		console.log(request.pageText)
		if (settings.whitelist.split('|').includes(getDomain(sender.tab.url)) ){
			console.log("Сайт в белом списке, его домен", getDomain(sender.tab.url) )
			console.log(settings.whitelist)
			sendResponse({ status: "success" })
		} else if (cache.has(url)) {
          // Если URL уже есть в кэше, используем закэшированный результат
          const cachedResult = cache.get(url);
          console.log("Using cached result:", cachedResult);

          if (cachedResult.score > settings.limit || (cachedResult.language && !['en', 'ru'].includes(cachedResult.language))) {
            chrome.tabs.update(sender.tab.id, { url: 'blockpage.html' }, () => {
              sendResponse({ status: "blocked", score: cachedResult.score });
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
          if (wordCount > 10) {
            console.log("Detecting language...");
            languagePromise = new Promise((resolve, reject) => {
              chrome.i18n.detectLanguage(request.pageText, (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(result.languages[0].language);
                }
              });
            });
          }

          const [result_scan, language] = await Promise.all([scan_Promise, languagePromise]);
		  let scrore = result_scan[0]
		  let foundWords = result_scan[1]
          console.log("Scan complete. Score:", scrore);
		  console.log("Scan complete. foundWords:", foundWords);
          console.log("Language detected:", language);

          // Сохраняем результат в кэш
          console.log("Saving result to cache...");
          cache.set(url, { scrore, language });

          // Проверяем, превышает ли score лимит или язык не английский и не русский
          if (scrore > settings.limit || (language && !['en', 'ru'].includes(language))) {
            chrome.tabs.update(sender.tab.id, { url: 'blockpage.html' }, () => {
              sendResponse({ status: "blocked", scrore, language });
            });
          } else {
            sendResponse({ status: "success", scrore, language });
          }
        }
      }else if (request.message === "checkWhitelistStatus"){
		  // Запуск для проверки блокировки видео
		  console.log("Запрос на блокировку видео получен, проверяется белый список")
		  const url_domen = getDomain(sender.tab.url);
		  
		  console.log(settings.whitelist)
		  console.log("Внешний вид url", url_domen)
		  if (settings.whitelist.split('|').includes(url_domen)){
			console.log("Блокировка видео не возможна inWhiteList")
			sendResponse({ status: "inWhiteList"});
		  } else{
			  sendResponse({ status: "blockingVideo"});
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


// Событие изменения хранилища
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    await settings.load();
    console.log("Настройки обновлены:", settings);
  }
});
