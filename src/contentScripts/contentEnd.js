console.log("content_end.js запущен");

function getFullPageText(pageText) {
  let text = pageText;
  return text.replace(/\s+/g, ' ').trim(); // Убираем лишние пробелы
}

document.body.style.visibility = 'visible';
let pageText = getFullPageText(document.body.innerText);
document.body.style.visibility = 'hidden';

console.log(pageText);

//Отправка текста в background.js
chrome.runtime.sendMessage(
  { message: "sendPageText", pageText: pageText },
  async (response) => {
    if (response.error) {
      const errorMessage = result?.error ?? 'Произошла неизвестная ошибка';
      console.error(errorMessage);
      document.body.style.opacity = 1;
      document.body.style.visibility = 'visible';
      console.log('Содержимое страницы показано');
    } else {
      console.log("Page text sent successfully");

      document.body.style.opacity = 1;
      document.body.style.visibility = 'visible';
      console.log('Содержимое страницы показано');
    }
  }
);