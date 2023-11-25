// ==UserScript==
// @name         Remove Adblock Thing
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Removes Adblock Thing
// @author       JoelMatic (refactored by TiagoRibeiro25)
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL    https://github.com/TiagoRibeiro25/RemoveAdblockThing/raw/main/Youtube-Ad-blocker-Reminder-Remover.user.js
// @downloadURL  https://github.com/TheRealJoelmatic/RemoveAdblockThing/raw/main/Youtube-Ad-blocker-Reminder-Remover.user.js
// @grant        none
// ==/UserScript==

(function () {
	const config = {
		adblocker: true,
		removePopup: true,
		debug: true,
		domainsToRemove: ["*.youtube-nocookie.com/*"],
		jsonPathsToRemove: [
			"playerResponse.adPlacements",
			"playerResponse.playerAds",
			"adPlacements",
			"playerAds",
			"playerConfig",
			"auxiliaryUi.messageRenderers.enforcementMessageViewModel",
		],
		observerConfig: {
			childList: true,
			subtree: true,
		},
	};

	const keyEvent = new KeyboardEvent("keydown", {
		key: "k",
		code: "KeyK",
		keyCode: 75,
		which: 75,
		bubbles: true,
		cancelable: true,
		view: window,
	});

	const mouseEvent = new MouseEvent("click", {
		bubbles: true,
		cancelable: true,
		view: window,
	});

	let unpausedAfterSkip = 0;

	window.__ytplayer_adblockDetected = false;

	if (config.adblocker) {
		addblocker();
	}
	if (config.removePopup) {
		popupRemover();
		observer.observe(document.body, config.observerConfig);
	}

	removeJsonPaths(config.domainsToRemove, config.jsonPathsToRemove);

	function addblocker() {
		setInterval(() => {
			const skipBtn = document.querySelector(".videoAdUiSkipButton,.ytp-ad-skip-button");
			const adContainer = document.querySelector(".ad-showing");

			if (adContainer) {
				const video = document.querySelector("video");
				video.playbackRate = 10;
				video.volume = 0;
				video.currentTime = video.duration;
				skipBtn?.click();
			}

			const adElementsToRemove = document.querySelectorAll(
				".ytd-action-companion-ad-renderer, " +
					"div#root.style-scope.ytd-display-ad-renderer.yt-simple-endpoint, " +
					"div#sparkles-container.style-scope.ytd-promoted-sparkles-web-renderer, " +
					"div#main-container.style-scope.ytd-promoted-video-renderer, " +
					"ytd-in-feed-ad-layout-renderer, " +
					".ytd-video-masthead-ad-v3-renderer, " +
					"div#player-ads.style-scope.ytd-watch-flexy, div#panels.style-scope.ytd-watch-flexy, " +
					".ytp-ad-skip-button-modern"
			);

			adElementsToRemove.forEach((element) => element?.remove());

			skipBtn?.click();
		}, 50);
	}

	function popupRemover() {
		setInterval(() => {
			const fullScreenButton = document.querySelector(".ytp-fullscreen-button");
			const modalOverlay = document.querySelector("tp-yt-iron-overlay-backdrop");
			const popup = document.querySelector(".style-scope ytd-enforcement-message-view-model");
			const popupButton = document.getElementById("dismiss-button");

			const bodyStyle = document.body.style;
			bodyStyle.setProperty("overflow-y", "auto", "important");

			if (modalOverlay) {
				modalOverlay.removeAttribute("opened");
				modalOverlay.remove();
			}

			if (popup) {
				if (popupButton) popupButton.click();
				popup.remove();
				unpausedAfterSkip = 2;

				fullScreenButton.dispatchEvent(mouseEvent);

				setTimeout(() => {
					fullScreenButton.dispatchEvent(mouseEvent);
				}, 500);
			}

			if (!unpausedAfterSkip > 0) {
				return;
			}

			unPauseVideo(document.querySelector("#movie_player > video.html5-main-video"));
			unPauseVideo(document.querySelector("#movie_player > .html5-video-container > video"));
		}, 1000);
	}

	function unPauseVideo(video) {
		if (!video) return;
		if (video.paused) {
			document.dispatchEvent(keyEvent);
			unpausedAfterSkip = 0;
		} else if (unpausedAfterSkip > 0) unpausedAfterSkip--;
	}

	function removeJsonPaths(domains, jsonPaths) {
		const currentDomain = window.location.hostname;
		if (!domains.includes(currentDomain)) return;

		jsonPaths.forEach((jsonPath) => {
			const pathParts = jsonPath.split(".");
			let obj = window;
			let previousObj = null;
			let partToSetUndefined = null;

			for (const part of pathParts) {
				if (obj.hasOwnProperty(part)) {
					previousObj = obj;
					partToSetUndefined = part;
					obj = obj[part];
				} else {
					break;
				}
			}

			if (previousObj && partToSetUndefined !== null) {
				previousObj[partToSetUndefined] = undefined;
			}
		});
	}
})();
