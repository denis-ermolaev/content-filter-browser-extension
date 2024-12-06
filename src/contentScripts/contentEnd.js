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
      console.error("Error sending page text:", response.error);
    } else {
      console.log("Page text sent successfully");

      document.body.style.opacity = 1;
      document.body.style.visibility = 'visible';
      //document.body.classList.remove('page-hidden');
      //document.body.classList.remove('page-hidden');
      console.log('Содержимое страницы показано');
    }
  }
);