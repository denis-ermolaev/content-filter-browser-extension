//Получение текста страницы
console.log("content_end.js запущен");

// Функция для получения текста всей страницы
function getFullPageText(element) {
  let text = element.innerText || "";
  return text.replace(/\s+/g, ' ').trim(); // Убираем лишние пробелы
}

console.log('DOM полностью загружен и разобран');

// Копируем body
let bodyClone = document.body.cloneNode(true);

// Убираем скрытие на копии
//bodyClone.style.visibility = 'visible';
bodyClone.style.display = 'block';
// bodyClone.classList.remove('page-hidden');

// Добавляем копию к документу, чтобы можно было извлечь текст
document.documentElement.appendChild(bodyClone);

// Получение полного текста страницы из копии
let pageText = getFullPageText(bodyClone);
console.log('Полный текст страницы получен:', pageText);

// Удаляем копию после извлечения текста
document.documentElement.removeChild(bodyClone);

// Отправка текста в background.js
chrome.runtime.sendMessage(
  { message: "sendPageText", pageText: pageText },
  async (response) => {
    if (response.error) {
      console.error("Error sending page text:", response.error);
    } else {
      console.log("Page text sent successfully");

      // После завершения обработки показываем содержимое страницы
      //document.body.style.visibility = 'visible';
      document.body.style.display = 'block';

      // document.body.classList.remove('page-hidden');
      console.log('Содержимое страницы показано');
    }
  }
);
