// content_start.js
// Сокрытие страницы до сканирования
console.log("content_start запущен")
const observer = new MutationObserver(mutations => {
    if (document.body) {
        document.body.style.display = "none";
        observer.disconnect(); // Останавливаем наблюдение после добавления класса
    }
});

observer.observe(document.documentElement, { childList: true });
