class Settings {
  constructor() {
    this.blockpage = "";
    this.blockvals = {
      2: "", 3: "", 5: "", 10: "", 20: "", 25: "", 30: "",
      40: "", 50: "", 60: "", 70: "", 80: "", 90: "",
      100: "", 120: "", 130: "", 150: ""
    };
    this.limit = 0;
    this.whitelist = "";
  }
  // Загрузка из хранилища браузера chrome.storage.local
  async load() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading from chrome.storage.local:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          if (Object.keys(items).length === 0) {
            // Если хранилище пусто, загружаем начальные настройки из preset.json
            this.loadFromPreset().then(resolve).catch(error => {
              console.error('Error loading from preset:', error);
              reject(error);
            });
          } else {
            let data_for_setting_load = {blockpage: items['blockpage'], blockvals: items['blockvals'],limit: items['limit'],whitelist: items['whitelist'],}
            Object.assign(this, data_for_setting_load);
            //console.log(resolve, items );
            resolve(data_for_setting_load);
          }
        }
      });
    });
  }
  
  //Загрузка настроек из пресета
  async loadFromPreset() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(chrome.runtime.getURL('utils/preset.json'));
        const preset = await response.json();

        // Преобразуем blockvals в объект
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
class Cache {
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

// Экспортируем классы, чтобы они были доступны в importScripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Settings, Cache };
}