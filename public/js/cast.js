/* global Twitch */

//   ###                  #
//  #   #                 #
//  #       ###    ###   ####
//  #          #  #       #
//  #       ####   ###    #
//  #   #  #   #      #   #  #
//   ###    ####  ####     ##
/**
 * A class that handles the cast page.
 */
class Cast {
    // #                    #
    // #                    #
    // # #    ##   #  #   ###   ##   #  #  ###
    // ##    # ##  #  #  #  #  #  #  #  #  #  #
    // # #   ##     # #  #  #  #  #  ####  #  #
    // #  #   ##     #    ###   ##   ####  #  #
    //              #
    /**
     * Handles the key down event.
     * @param {KeyboardEvent} e The key down event.
     * @returns {void}
     */
    static keydown(e) {
        if (e.repeat) {
            return;
        }

        switch (e.code) {
            case "ArrowLeft":
                Cast.leftIndex++;
                if (Cast.leftIndex >= Cast.leftStreamers.length) {
                    Cast.leftIndex = -1;
                }

                document.getElementById("left-player").innerHTML = "";
                if (Cast.leftIndex === -1) {
                    document.getElementById("left-viewing").classList.add("hidden");
                    document.getElementById("left-frame").classList.add("hidden");
                } else {
                    document.getElementById("left-viewing").classList.remove("hidden");
                    document.getElementById("left-frame").classList.remove("hidden");

                    document.getElementById("left-name").innerText = Cast.leftStreamers[Cast.leftIndex].name;
                    document.getElementById("left-twitch").innerText = Cast.leftStreamers[Cast.leftIndex].twitch;

                    new Twitch.Embed("left-player", {
                        width: 768,
                        height: 432,
                        channel: Cast.leftStreamers[Cast.leftIndex].twitch,
                        allowfullscreen: true,
                        autoplay: true,
                        muted: true,
                        layout: "video"
                    });
                }
                break;
            case "ArrowRight":
                Cast.rightIndex++;
                if (Cast.rightIndex >= Cast.rightStreamers.length) {
                    Cast.rightIndex = -1;
                }

                document.getElementById("right-player").innerHTML = "";
                if (Cast.rightIndex === -1) {
                    document.getElementById("right-viewing").classList.add("hidden");
                    document.getElementById("right-frame").classList.add("hidden");
                } else {
                    document.getElementById("right-viewing").classList.remove("hidden");
                    document.getElementById("right-frame").classList.remove("hidden");

                    document.getElementById("right-name").innerText = Cast.rightStreamers[Cast.rightIndex].name;
                    document.getElementById("right-twitch").innerText = Cast.rightStreamers[Cast.rightIndex].twitch;

                    new Twitch.Embed("right-player", {
                        width: 768,
                        height: 432,
                        channel: Cast.rightStreamers[Cast.rightIndex].twitch,
                        allowfullscreen: true,
                        autoplay: true,
                        muted: true,
                        layout: "video"
                    });
                }
                break;
        }
    }

    // ###    ##   #  #   ##                #                 #    #                    #           #
    // #  #  #  #  ####  #  #               #                 #    #                    #           #
    // #  #  #  #  ####  #      ##   ###   ###    ##   ###   ###   #      ##    ###   ###   ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    # ##  #  #   #    #     #  #  #  #  #  #  # ##  #  #
    // #  #  #  #  #  #  #  #  #  #  #  #   #    ##    #  #   #    #     #  #  # ##  #  #  ##    #  #
    // ###    ##   #  #   ##    ##   #  #    ##   ##   #  #    ##  ####   ##    # #   ###   ##    ###
    /**
     * Sets up the page's key binds.
     * @returns {void}
     */
    static DOMContentLoaded() {
        document.addEventListener("keydown", Cast.keydown);

        Cast.keydown({code: "ArrowLeft"});
        Cast.keydown({code: "ArrowRight"});
    }
}

Cast.leftStreamers = [];
Cast.rightStreamers = [];
Cast.leftIndex = -1;
Cast.rightIndex = -1;

document.addEventListener("DOMContentLoaded", Cast.DOMContentLoaded);
