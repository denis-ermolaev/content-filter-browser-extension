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
  function fun_remove() {
    function remove_for_tag(tag) {
      const elements = document.querySelectorAll(tag); // Выбираем только нужные изображения
      //console.log("Found images:", images.length);
      elements.forEach((el) => {
        el.remove();
      });
    }
    remove_for_tag('img');
    remove_for_tag('canvas');
  }

  fun_remove();
  // Опционально: Запускаем скрипт повторно при изменении DOM (например, при динамической подгрузке контента)
  const observer = new MutationObserver(fun_remove);
  observer.observe(document, { // Исправленная строка: наблюдаем за document
    childList: true,
    subtree: true
  });

}

function disableInputs() {
  function inner_fun() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.disabled = true;
    });
  }
  inner_fun();
  // Опционально: Запускаем скрипт повторно при изменении DOM (например, при динамической подгрузке контента)
  const observer = new MutationObserver(inner_fun);
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
    //disableInputs();
	} else {
		console.log("Сайт в белом списке, блокировки видео не будет")
	}
});

