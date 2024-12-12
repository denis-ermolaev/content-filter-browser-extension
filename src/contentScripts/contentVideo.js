// Блокировка видео во всех фреймах(из манифеста - "all_frames": true,)
console.log("content_start_blocking_video.js и блокировка видео запущены");

var flaggedVideos = new Set();

function killVideo(video) {
	video.innerHTML = '';

	if (video.hasAttribute("src")) {
		video.removeAttribute("src");
		video.load();
	}
}

function nomovdo(element) {
	document.querySelectorAll("video").forEach(function (video) {
		if (flaggedVideos.has(video)) { return; }

		flaggedVideos.add(video);

		killVideo(video);

		video.addEventListener("loadstart", function () {
			killVideo(video);
		});
	});
	//console.log("nomovdo завершил свою работу")
}

function beginNomovdo() {
	var observer = new MutationObserver(nomovdo);
	observer.observe(document, { childList: true, subtree: true });

	document.addEventListener("DOMContentLoaded", nomovdo);

	nomovdo();
}
function blocking_images() {
  function replaceImageSources() {
    //console.log("replaceImageSources called");
    const images = document.querySelectorAll('img'); // Выбираем только нужные изображения
    //console.log("Found images:", images.length);

    images.forEach(image => {
      //console.log("Processing image:", image);
      // 1. Сохраняем оригинальный src (на всякий случай)
      //image.dataset.originalSrc = image.src;

      // 2. Удаляем изображение из DOM
      image.remove(); 
    });
  }

  replaceImageSources();
  // Опционально: Запускаем скрипт повторно при изменении DOM (например, при динамической подгрузке контента)
  const observer = new MutationObserver(replaceImageSources);
  observer.observe(document, { // Исправленная строка: наблюдаем за document
    childList: true,
    subtree: true
  });

}

chrome.runtime.sendMessage({ message: "checkWhitelistStatus" }, async (response) => {
	console.log(response)
	if (response.status === "blockingVideo") {
		console.log("Блокировка видео началась, сайт не в белом списке")
		beginNomovdo();
    blocking_images();
	} else {
		console.log("Сайт в белом списке, блокировки видео не будет")
	}
});

