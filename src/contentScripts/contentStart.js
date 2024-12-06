// content_start.js
console.log("content_start запущен, выполняется сокрытие страницы")
const observer = new MutationObserver(mutations => {
    if (document.body) {
        document.body.style.opacity = 0;
        document.body.style.visibility = 'hidden';
        //document.body.classList.add('page-hidden');
        observer.disconnect(); // Останавливаем наблюдение после добавления класса
    }
});
observer.observe(document.documentElement, { childList: true });
