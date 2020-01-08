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
     * @param {string[]} maplist The list of maps to display.
     * @returns {string} An HTML string of the map list page.
     */
    static get(maplist) {
        return /* html */`
            <div id="maplist">
                <div class="section">Map List</div>
                <div class="text">
                    The following is a list of available maps for play on the OTL:
                </div>
                <div id="maps" style="grid-template-rows: repeat(${Math.floor((maplist.length + 3) / 4)}, auto);">
                    ${maplist.map((map) => /* html */`
                        <div>${MapListView.Common.htmlEncode(map)}</div>
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
