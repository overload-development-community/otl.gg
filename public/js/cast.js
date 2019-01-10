const leftStreamers = [],
    rightStreamers = [];

let leftIndex = -1,
    rightIndex = -1;

/**
 * Processes a keydown event.
 * @param {{code: string}} e The event.
 * @returns {void}
 */
const keydown = (e) => {
    "use strict";

    if (e.repeat) {
        return;
    }

    switch (e.code) {
        case "ArrowLeft":
            leftIndex++;
            if (leftIndex >= leftStreamers.length) {
                leftIndex = -1;
            }

            document.getElementById("left-player").innerHTML = "";
            if (leftIndex === -1) {
                document.getElementById("left-viewing").classList.add("hidden");
                document.getElementById("left-frame").classList.add("hidden");
            } else {
                document.getElementById("left-viewing").classList.remove("hidden");
                document.getElementById("left-frame").classList.remove("hidden");

                document.getElementById("left-name").innerText = leftStreamers[leftIndex].name;
                document.getElementById("left-twitch").innerText = leftStreamers[leftIndex].twitch;

                new Twitch.Player("left-player", {
                    width: 768,
                    height: 432,
                    channel: leftStreamers[leftIndex].twitch
                });
            }
            break;
        case "ArrowRight":
            rightIndex++;
            if (rightIndex >= rightStreamers.length) {
                rightIndex = -1;
            }

            document.getElementById("right-player").innerHTML = "";
            if (rightIndex === -1) {
                document.getElementById("right-viewing").classList.add("hidden");
                document.getElementById("right-frame").classList.add("hidden");
            } else {
                document.getElementById("right-viewing").classList.remove("hidden");
                document.getElementById("right-frame").classList.remove("hidden");

                document.getElementById("right-name").innerText = rightStreamers[rightIndex].name;
                document.getElementById("right-twitch").innerText = rightStreamers[rightIndex].twitch;

                new Twitch.Player("right-player", {
                    width: 768,
                    height: 432,
                    channel: rightStreamers[rightIndex].twitch
                });
            }
            break;
    }
};

document.addEventListener("keydown", keydown);

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    keydown({code: "ArrowLeft"});
    keydown({code: "ArrowRight"});
});
