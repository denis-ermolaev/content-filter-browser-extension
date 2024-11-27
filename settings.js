class Settings {
  constructor() {
    this.blockpage = ""; // "домен_сайта|домен_другого_сайта"
    this.whitelist = "";
    this.limit = 0;
    this.blockvals = { // Веса:"Слова|другое слово"
      2: "", 3: "", 5: "", 10: "", 20: "", 25: "", 30: "",
      40: "", 50: "", 60: "", 70: "", 80: "", 90: "",
      100: "", 120: "", 130: "", 150: ""
    };
    this.ready = false; // Готовность, чтобы не загружать настройки несколько раз
  }
  
  getFromStorage() { // не async т.к возвращает промис явно (в чём отличие ?)
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError); //resolve - успех, reject - неудача
        } else {
          resolve(items);
        }
      });
    });
  }
  
  // Загрузка из хранилища браузера chrome.storage.local
  async load() {
    if (this.ready) {
      return true;
    } else {
      let items_from_storage = await this.getFromStorage()
      if (Object.keys(items_from_storage).length === 0) {
        // Если loadFromPreset асинхронный - используем await
        await this.loadFromPreset();
        this.ready = true
      } else {
          let data_for_setting_load = {
              blockpage: items_from_storage['blockpage'], 
              blockvals: items_from_storage['blockvals'],
              limit: items_from_storage['limit'],
              whitelist: items_from_storage['whitelist']
          };
          Object.assign(this, data_for_setting_load);
          this.ready = true;
          return true;
      }
    }
  }

  //Загрузка настроек из пресета
  loadFromPreset() {
    return new Promise(async (resolve, reject) => { // Этот async дожидаться не надо, достаточно дождаться в общем промис
      console.log("Запуск settings.loadFromPreset")
      try {
        const response = await fetch(chrome.runtime.getURL('utils/preset.json'));
        const preset = await response.json();

        const blockvals = {};
        preset.blockvals.forEach(item => {
          blockvals[item.name] = item.value;
        });

        this.blockpage = preset.blockpage;
        this.limit = preset.limit;
        this.whitelist = preset.whitelist;
        this.blockvals = blockvals;

        // Сохраняем начальные настройки в chrome.storage.local
        await this.save();
        resolve();
      } catch (error) {
        console.error('Error fetching or parsing preset.json:', error);
        reject(error);
      }
    });
  }
  
  async save() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({
        blockpage: this.blockpage,
        blockvals: this.blockvals,
        limit: this.limit,
        whitelist: this.whitelist
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving to chrome.storage.local:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

// Класс для кэширования результатов сканирования
class Cache { // Нужно чтобы кэш сохранял результаты после перезапусков браузера и бэграунда, пока они обнуляются
  constructor() {
    this.cache = {};
  }

  // Получение результата из кэша
  get(url) {
    return this.cache[url];
  }

  // Сохранение результата в кэш
  set(url, result) {
    this.cache[url] = result;
    console.log(`Cached result for ${url}:`, result);
  }

  // Проверка наличия результата в кэше
  has(url) {
    const hasResult = this.cache.hasOwnProperty(url);
    console.log(`Cache has result for ${url}:`, hasResult);
    return hasResult;
  }
}

class MessageHandler {
  constructor(request, sender, sendResponse,settings, cache) {
    this.request = request; // {message: 'message', ...} - принятое сообщение

    this.sender = sender // Информация о вкладки, её id(sender.tab.id), статус, активность url(sender.tab.url)
    this.sendResponse = sendResponse // Ф-я для отправки сообщения обратно. Синтаксис sendResponse(массив_или_объект)
    this.settings = settings
    this.cache = cache
  }
  // Обработка типа сообщения и вызов соответствующего метода
  async request_processing() {
    try {
      if (this.request.message === "sendPageText" && typeof this.request.pageText === 'string') {
        await this.sendPageText_processing()
      } else if (this.request.message === "checkWhitelistStatus") {
        this.checkWhitelistStatus_processing()
      } else {
        this.sendResponse({ error: "Unknown message type or missing pageText" });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      this.sendResponse({ error: error.message });
    }
  }
  async sendPageText_processing() {
    const result_scan = await this.scanPageText(this.request.pageText); // [score, foundWords]
    let score = result_scan[0];
    let foundWords = result_scan[1];
    console.log("Scan complete. Score:", score);
    console.log("Scan complete. foundWords:", foundWords);
    if (score > this.settings.limit) {
      await this.update_on_blocking_page("Block page by scan", score, foundWords)
    } else {
      this.sendResponse({ status: "success", score });
    }
  }
  // Обработка сообщения о блокировки видео из contentVideo.js
  checkWhitelistStatus_processing() {
    console.log("Запрос на блокировку видео получен, проверяется белый список")
    const url_domen = this.getDomain(this.sender.tab.url);    
    console.log(this.settings.whitelist)
    console.log("Внешний вид url", url_domen)
    if (this.settings.whitelist.split('|').includes(url_domen)) {
      console.log("Блокировка видео не возможна inWhiteList")
      this.sendResponse({ status: "inWhiteList" });
    } else {
      this.sendResponse({ status: "blockingVideo" });
    }
  }

  update_on_blocking_page(status='',score=0,foundWords={}) {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(this.sender.tab.id, { url: 'pages/BlockPage/index.html' }, () => {
        chrome.storage.local.set({ status: status, score, foundWords }, () => {
          this.sendResponse({ status: status, score });
          resolve();
        });
      });
    });
  }
  //Обслуживающие Ф-И
  //
  //
  // TODO: Нужно вынести такие проверки в класс настроек или куда-то ещё
  // Получение домена из url адресса
  getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.error("Ошибка разбора URL:", error);
      return null; // Или другое значение по умолчанию
    }
  }
  // Сканирование страницы
  async scanPageText(text) {
    if (typeof text !== 'string') {
      throw new Error("Provided text is not a string");
    }
  
    const limit = this.settings.limit || 160; // При превышении сканирование заканчивается 
    let score = 0;
    let foundWords = {}; // Словарь для сохранения найденных слов
  
    for (const [key, value] of Object.entries(this.settings.blockvals)) {
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
            return [score, foundWords];
          }
        }
      }
    }
  
    return [score, foundWords];
  }
}

// Экспортируем классы, чтобы они были доступны в importScripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Settings, Cache, MessageHandler };
}