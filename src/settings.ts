import eld from 'languageDetector';

//
// ! Объявление классов
//

/**
 * Класс для логирования
 * Можно отключить/включить логгирование для разных модулей
 */
class Logger {
  logging: Record<string, boolean>;
  constructor() {
    this.logging = {
      Data_science: false,
      general_logging: false,
      sendPageText_processing: false,
      checkWhitelistStatus_processing: false,
      settings: false,
      caches: false,
      time_count:false
    }
  }
  /**
   * Вывести args в консоль, для
   * модуля modul_name
   * @param module_name 
   * @param args 
   */
  log(module_name: string, ...args: any[]): void {
    if (this.logging[module_name]) {
      console.log(...args);
    }
  }
  /**
   * Ф-я декоратор для замера скорости выполнения других ф-й
   */
  async decoratorTimeCount(func:Function,name_func:string,...args:any[any]):Promise<any>{ 
    let starttime = performance.now();
    let result : any = await func(...args);
    let resultTime = performance.now() - starttime;
    this.log('time_count',`Время работы функции - ${name_func}: ${resultTime.toFixed(2)} миллисекунд`)
    return result
  }
 
}

/**
 * Глобальные настройки
 */
class Settings {
  blockpage: string;
  whitelist: string;
  limit: number;
  blockvals: Record<number,string>;
  ready: boolean;
  red_button: boolean;
  red_button_timer: number;
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
    this.red_button = false
    this.red_button_timer = 0
  }
  /**
   * Получение из хранилища
   * Позволяет использовать await
   * Т.к chrome.storage.local.get - ф-я колбэк
   * @returns Promise<Record<string, any>>
   */
  getFromStorage(): Promise<Record<string, any>> { // не async т.к возвращает промис явно (в чём отличие ?)
    return new Promise ((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError); //resolve - успех, reject - неудача
        } else {
          resolve(items);
        }
      });
    });
  }
  
  /**
   * Загрузка настроек
   * Из присета (если нету сохранение в хранилище)
   * Из хранилища браузера
   */
  async load() {
    logger.log("settings", "Метод load из класса Settings запущен")
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
              whitelist: items_from_storage['whitelist'],
              red_button: items_from_storage['red_button'],
              red_button_timer: items_from_storage['red_button_timer']
          };
          Object.assign(this, data_for_setting_load);
          this.ready = true;
          return true;
      }
    }
  }

  /**
   * Загрузка настроект из присета preset.json
   * Первоначальная инициализация
   */
  loadFromPreset(): Promise<void> {
    logger.log("settings", "Метод loadFromPreset из класса Settings запущен")
    return new Promise(async (resolve, reject) => { // Этот async дожидаться не надо, достаточно дождаться в общем промис
      try {
        const response = await fetch(chrome.runtime.getURL('utils/preset.json'));
        const preset = await response.json();

        const blockvals = {};
        preset.blockvals.forEach((item: {name:number | string, value:any}) => {
          blockvals[item.name] = item.value;
        });

        this.blockpage = preset.blockpage;
        this.limit = preset.limit;
        this.whitelist = preset.whitelist;
        this.blockvals = blockvals;
        this.red_button = false;
        this.red_button_timer = 0;

        // Сохраняем начальные настройки в chrome.storage.local
        await this.save();
        resolve();
      } catch (error) {
        console.error('Error fetching or parsing preset.json:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Сохранение настроек в хранилище
   * Может использоваться при первоначально инициализации, а также на странице настроек (?)
   */
  async save(): Promise<void> {
    logger.log("settings", "Метод save из класса Settings запущен")
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({
        blockpage: this.blockpage,
        blockvals: this.blockvals,
        limit: this.limit,
        whitelist: this.whitelist,
        red_button: this.red_button,
        red_button_timer: this.red_button_timer
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

/**
 * Кэш должен сохранять результаты, чтобы каждый раз не сканировать страницы
 */
class CacheSite { // TODO: Нужно чтобы кэш сохранял результаты после перезапусков браузера и бэграунда, пока они обнуляются
  cache: Object;
  constructor() {
    this.cache = {};
  }

  /**
   * Получение результата из кэша
   */
  get(url:string) {
    return this.cache[url];
  }

  /**
   * Сохранение результата в кэш
   */
  set(url:string, result:Object) {
    this.cache[url] = result;
    console.log(`Cached result for ${url}:`, result);
  }

  /**
   * Проверка наличия результата в кэше
   */
  has(url:string) {
    const hasResult = this.cache.hasOwnProperty(url);
    console.log(`Cache has result for ${url}:`, hasResult);
    return hasResult;
  }
}


/**
 * Обработчик сообщений в бэграунде
 * Экземпляр создаётся для каждого полученного сообщения
 * Обрабатывает их и даёт ответ
 */
class MessageHandler {
  request:{ [key: string]: any };
  sender:any; //chrome.runtime.MessageSender; - нужно поменять и исправить появляющиеся ошибки
  sendResponse: any; //(response: any) => void; - нужно поменять и исправить появляющиеся ошибки
  settings:Settings;
  cache:CacheSite;
  constructor(request:any, sender: any, sendResponse: Function,settings: Settings, cache: CacheSite) {
    this.request = request; // {message: 'message', ...} - принятое сообщение
    this.sender = sender // Информация о вкладки, её id(sender.tab.id), статус, активность url(sender.tab.url)
    this.sendResponse = sendResponse // Ф-я для отправки сообщения обратно. Синтаксис sendResponse(массив_или_объект)
    this.settings = settings
    this.cache = cache
  }
  /**
   * Определение типа сообщения и отправка соответсвующей ф-и на обработку
   */
  async request_processing() {
    try {
      if (this.request.message === "sendPageText" && typeof this.request.pageText === 'string') { // message === "sendPageText"
        if (this.checkWhiteBlackList() === "InWhiteList") {
          this.sendResponse({ status: "success" });
        } else if (this.checkWhiteBlackList() === "InBlackList") {
          await this.update_on_blocking_page("Block page by Black List")
        } else {
          await this.sendPageText_processing()
        }
      } else if (this.request.message === "checkWhitelistStatus") { // message === "checkWhitelistStatus"
        this.checkWhitelistStatus_processing()
      } else if (this.request.message === "sendCheckStatusRedButton") {
        this.sendResponse({ status: this.settings.red_button , duration:this.settings.red_button_timer});
      } else if (this.request.message === "sendRedButton") {
          this.sendRedButton_processing()
      } else {
        this.sendResponse({ error: "Unknown message type or missing pageText" });
      }
    } catch (error:any) {
      console.error("Error processing message:", error);
      this.sendResponse({ error: error.message });
    }
  }
  sendRedButton_processing() {
    console.log(this.request.num_minut);
    this.settings.red_button = true;
    this.settings.red_button_timer = this.request.num_minut;
    
    chrome.alarms.create("Red_button_timer", {
      delayInMinutes: 1, // 1 / 60 - 1 секунда
      periodInMinutes: 1,
    });
    this.settings.save()
    // Перезагружаем все вкладки
    chrome.tabs.query({}, (tabs) => {
      if (!tabs) {
        console.error('Не удалось получить вкладки.');
        return;
      }
    
      tabs.forEach((tab) => {
        if (tab.id !== undefined) {
          chrome.tabs.reload(tab.id, undefined); // Указание undefined для колбэка
        }
      });
    });
    this.sendResponse({ status: "success", duration:this.settings.red_button_timer });
  }
  /**
   * Обрабатывает сообщение с contentEnd
   * message === "sendPageText"
   */
  async sendPageText_processing() {
    logger.log('Data_science', this.request.pageText) // Не печатать, если сайт в белом списки ??
    const start = performance.now();
    let scan_promise = logger.decoratorTimeCount(scanPageText,"scanPageText",this.request.pageText, this.settings.limit, this.settings.blockvals); // [score, foundWords]
    //let score: number = result_scan[0];
    //let foundWords: Object = result_scan[1];
    let text_for_language_detect:string = processText(this.request.pageText);
    let language_promise = logger.decoratorTimeCount(wrappedSyncFunction,"eld.detect",eld.detect,text_for_language_detect);
    //const result_promise = await logger.decoratorTimeCount(Promise.all,"Promise.all",[scan_promise,language_promise])
    const result_promise = await logger.decoratorTimeCount(wrappedPromiseAll,"Promise.all(ожидание)",[language_promise, scan_promise])
    const end = performance.now();
    logger.log('time_count', `Время работы Promise.all(общее): ${end - start} миллисекунд`);
    logger.log('sendPageText_processing', "result_promise",result_promise)
    
    let language = result_promise[0].language;
    let score: number = result_promise[1][0];
    let foundWords: Object = result_promise[1][1];
    if (text_for_language_detect.split(' ').length < 20){
      language = 'unknown';
    }
    language = 'unknown';
    logger.log('sendPageText_processing', "Scan complete. Score:", score);
    logger.log('sendPageText_processing', "Scan complete. foundWords:", foundWords);
    logger.log('sendPageText_processing', "Detect language complete. language:", language);
    logger.log('sendPageText_processing',"Длинна текста: ", this.request.pageText.split(' ').length);
    if (!( ['ru', 'en', 'unknown'].includes(language) )) {
      await this.update_on_blocking_page("Block page by language detect", score, foundWords, language)
    } else if (score > this.settings.limit) {
      await this.update_on_blocking_page("Block page by scan", score, foundWords, language)
    } else {
      this.sendResponse({ status: "success", score });
    }
  }
  /**
   * Обработка сообщения о блокировки видео из contentVideo.js
   * message === "checkWhitelistStatus"
   */
  checkWhitelistStatus_processing() {
    logger.log('checkWhitelistStatus_processing', "Запрос на блокировку видео получен, проверяется белый список");
    logger.log('checkWhitelistStatus_processing', this.settings.whitelist);
    if (this.checkWhiteBlackList() === "InWhiteList") {
      logger.log('checkWhitelistStatus_processing', "Блокировка видео не возможна inWhiteList");
      this.sendResponse({ status: "inWhiteList" });
    } else {
      this.sendResponse({ status: "blockingVideo" });
    }
  }
  /**
   * Проверка в белом или чёрном списке или нет
   */
  checkWhiteBlackList() {
    if (this.settings.red_button) {
      if (check_in_list(this.sender.tab.url, this.settings.whitelist)) {
        return "InWhiteList"
      } else {
        return "InBlackList"
      }
    } else {
      if (check_in_list(this.sender.tab.url, this.settings.whitelist)) {
        return "InWhiteList"
      } else if  (check_in_list(this.sender.tab.url, this.settings.blockpage)) {
        return "InBlackList"
      } else {
        return "false"
      }
    }
  }
  /**
   * Перенаправляет текущую вкладку браузера на страницу блокировки
   * pages/BlockPage/index.html
   */
  update_on_blocking_page(status='',score=0,foundWords={}, language = 'unknown'):Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(this.sender.tab.id, { url: 'pages/BlockPage/index.html' }, () => {
        chrome.storage.local.set({ status: status, score, foundWords, language }, () => {
          this.sendResponse({ status: status, score });
          resolve();
        });
      });
    });
  }
}


//
// ! Обслуживающие функции
//

/**
 * Получение домена www.google.com из url
 */
function check_in_list(url: string, settings_whitelist: string): boolean {
  const regex = new RegExp(settings_whitelist);
  let match = url.match(regex);
  return match !== null;
}

/**
 * Сканирование текста странице на основе слов-весов
 */
async function scanPageText(text:string, limit_score: number, settings_blockvals: Settings["blockvals"]) {
  const limit = limit_score; // При превышении сканирование заканчивается 
  let score = 0;
  let foundWords = {};
  for (const [key, value] of Object.entries(settings_blockvals)) {
    if (value) {
      const regex = new RegExp(value, 'gi');
      let match: any[] | null;
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

/**
 * Обёртка(декоратор) делающая из синхронной ф-и -> асинхронную
 */
function wrappedSyncFunction(syncFunction:Function, ...args:any) {
    return Promise.resolve(syncFunction(...args));
}

/**
 * Обёртка(декоратор) позволяющие сделать замер скорости над Promise.all
 * Измерить именно ожидание
 */
async function wrappedPromiseAll(array_promise:Array<Promise<any>>) {
  return await Promise.all(array_promise)
}

/**
 * Подготовка текста к анализу языка
 */
function processText(text: string): string {
  // Удаление знаков препинания
  const cleanedText = text.replace(/[.,?!;:'"(){}]/g, '');
  // Разделение слов, идущих с большой буквы
  const result = cleanedText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Разделение слов с заглавной буквы
      .replace(/[_-]+/g, ' '); // Замена подчеркиваний и дефисов на пробелы
  return result.trim(); // Удаление лишних пробелов в начале и в конце
}
//
// ! Объявление переменных
//
const logger = new Logger();


export { Settings, CacheSite, MessageHandler, logger, check_in_list };