// content_start.js
console.log("content_start запущен")
const observer = new MutationObserver(mutations => {
    if (document.body) {
        document.body.style.display = "none";
        observer.disconnect(); // Останавливаем наблюдение после добавления класса
    }
});

observer.observe(document.documentElement, { childList: true });
