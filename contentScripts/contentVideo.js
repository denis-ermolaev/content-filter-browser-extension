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


chrome.runtime.sendMessage({ message: "checkWhitelistStatus" }, function (response) {
	console.log(response)
	if (response.status === "blockingVideo") {
		console.log("Блокировка видео началась, сайт не в белом списке")
		beginNomovdo();
	} else {
		console.log("Сайт в белом списке, блокировки видео не будет")
	}
});

