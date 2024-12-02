// content_start.js
// Сокрытие страницы до сканирования
console.log("content_start запущен")
const observer = new MutationObserver(mutations => {
    if (document.body) {
        document.body.style.opacity = 0;
        //document.body.classList.add('page-hidden');
        observer.disconnect(); // Останавливаем наблюдение после добавления класса
    }
});

observer.observe(document.documentElement, { childList: true });
