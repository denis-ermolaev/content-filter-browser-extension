// content_start.js
console.log("content_start запущен")
const observer = new MutationObserver(mutations => {
    if (document.body) {
        document.body.classList.add('page-hidden');
        observer.disconnect(); // Останавливаем наблюдение после добавления класса
    }
});

observer.observe(document.documentElement, { childList: true });
