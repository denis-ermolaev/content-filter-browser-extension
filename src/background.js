import { Settings, CacheSite, MessageHandler, logger } from './settings';


// Включение - выключение логгирования
// * Синтаксис logger.log(module_name, то что нужно распечатать)
// ! Выключать перед коммитом
//logger.logging['general_logging'] = true // background.js
//logger.logging['sendPageText_processing'] = true // Обработка сообщения sendPageText_processing с content_end.js
//logger.logging['checkWhitelistStatus_processing'] = true // checkWhitelistStatus_processing с contentVideo.js
//logger.logging['settings'] = true // Отладка класса настроек
//logger.logging['caches'] = true // Отладка кэша
logger.logging['Data_science'] = true // Оставлять включенным, используется для сбора тектов


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
      const message_handler = new MessageHandler(request, sender, sendResponse, settings, cache, logger);
      await message_handler.request_processing(); // Обработка сообщений и отправка ответа
    } catch(error) {
      console.error(error);
      sendResponse({ error: error.message });
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