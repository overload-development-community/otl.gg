//  #   #          #     #####                           #  #   #    #
//  #   #          #     #                               #  #   #
//  ##  #   ###   ####   #       ###   #   #  # ##    ## #  #   #   ##     ###   #   #
//  # # #  #   #   #     ####   #   #  #   #  ##  #  #  ##   # #     #    #   #  #   #
//  #  ##  #   #   #     #      #   #  #   #  #   #  #   #   # #     #    #####  # # #
//  #   #  #   #   #  #  #      #   #  #  ##  #   #  #  ##   # #     #    #      # # #
//  #   #   ###     ##   #       ###    ## #  #   #   ## #    #     ###    ###    # #
/**
 * A class that represents the 404 view.
 */
class NotFoundView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered not found template.
     * @param {{message: string}} data The data for the not found view.
     * @returns {string} An HTML string of the not found view.
     */
    static get(data) {
        const {message} = data;

        return /* html */`
            <div id="error">
                <div class="section">404 - Cloaking device activated.</div>
                <div class="text">${message}</div>
            </div>
        `;
    }
}

if (typeof module !== "undefined") {
    module.exports = NotFoundView; // eslint-disable-line no-undef
}
