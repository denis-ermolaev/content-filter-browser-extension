// blockpage.js
chrome.storage.local.get(['status', 'score', 'language', 'foundWords'], (data) => {
  const status = data.status || 'Unknown'; // Установите значение по умолчанию
  const score = data.score || 0;           // Установите значение по умолчанию
  const language = data.language || 'Unknown'; // Установите значение по умолчанию
  const foundWords = data.foundWords || {}; // Установите значение по умолчанию

  // Используем полученные данные для отображения на странице
  document.getElementById('status').textContent = status;
  document.getElementById('score').textContent = score; // Обновляем score
  document.getElementById('language').textContent = language;

  // Отображаем найденные слова в соответствующем элементе
  const foundWordsContainer = document.getElementById('foundWordsContainer');

  // Очищаем предыдущие данные
  foundWordsContainer.innerHTML = '';

  // Проверяем, является ли foundWords объектом
  if (typeof foundWords === 'object') {
    // Итерируем по объекту
    for (const key in foundWords) {
      if (foundWords.hasOwnProperty(key)) {
        const phrases = foundWords[key]; // Получаем массив фраз

        // Создаем элемент для заголовка группы найденных слов
        const groupHeader = document.createElement('h4');
        groupHeader.textContent = `Weight ${key}:`;
        foundWordsContainer.appendChild(groupHeader);

        // Создаем список для отображения фраз
        const list = document.createElement('ul');

        phrases.forEach(phrase => {
          const listItem = document.createElement('li');
          listItem.textContent = phrase; // Добавляем фразу
          list.appendChild(listItem);
        });

        foundWordsContainer.appendChild(list); // Добавляем список в контейнер
      }
    }
  } else {
    foundWordsContainer.textContent = 'No found words available.'; // Если нет найденных слов
  }

  console.log(status, score, language, foundWords); // Логирование для отладки
});