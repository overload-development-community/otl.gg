/**
 * @typedef {import("../../types/mapTypes").MapGameType} MapTypes.MapGameType
 */

//  #   #                #        #            #     #   #    #
//  #   #                #                     #     #   #
//  ## ##   ###   # ##   #       ##     ###   ####   #   #   ##     ###   #   #
//  # # #      #  ##  #  #        #    #       #      # #     #    #   #  #   #
//  #   #   ####  ##  #  #        #     ###    #      # #     #    #####  # # #
//  #   #  #   #  # ##   #        #        #   #  #   # #     #    #      # # #
//  #   #   ####  #      #####   ###   ####     ##     #     ###    ###    # #
//                #
//                #
/**
 * A class that represents the map list view.
 */
class MapListView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered map list page template.
     * @param {MapTypes.MapGameType[]} maplist The list of maps to display.
     * @returns {string} An HTML string of the map list page.
     */
    static get(maplist) {
        const taMaps = maplist.filter((m) => m.gameType === "TA"),
            ctfMaps = maplist.filter((m) => m.gameType === "CTF");

        return /* html */`
            <div id="maplist">
                <div class="section">Map List</div>
                <div class="text">
                    The following is a list of available maps for play on the OTL:
                </div>
                <div class="section">Team Anarchy</div>
                <div id="maps" style="grid-template-rows: repeat(${Math.floor((taMaps.length + 3) / 4)}, auto);">
                    ${taMaps.map((map) => /* html */`
                        <div>${MapListView.Common.htmlEncode(map.map)}</div>
                    `).join("")}
                </div>
                <div class="section">Capture the Flag</div>
                <div id="maps" style="grid-template-rows: repeat(${Math.floor((ctfMaps.length + 3) / 4)}, auto);">
                    ${ctfMaps.map((map) => /* html */`
                        <div>${MapListView.Common.htmlEncode(map.map)}</div>
                    `).join("")}
                </div>
            </div>
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
MapListView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = MapListView; // eslint-disable-line no-undef
}
