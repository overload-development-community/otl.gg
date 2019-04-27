//   ###                                      #####                              #   #    #
//  #   #                                     #                                  #   #
//  #       ###   # ##   #   #   ###   # ##   #      # ##   # ##    ###   # ##   #   #   ##     ###   #   #
//   ###   #   #  ##  #  #   #  #   #  ##  #  ####   ##  #  ##  #  #   #  ##  #   # #     #    #   #  #   #
//      #  #####  #       # #   #####  #      #      #      #      #   #  #       # #     #    #####  # # #
//  #   #  #      #       # #   #      #      #      #      #      #   #  #       # #     #    #      # # #
//   ###    ###   #        #     ###   #      #####  #      #       ###   #        #     ###    ###    # #
/**
 * A class that represents the 500 view.
 */
class ServerErrorView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered cast template.
     * @returns {string} An HTML string of the cast.
     */
    static get() {
        return /* html */`
            <div id="error">
                <div class="section">Self-destruct sequence activated.</div>
                <div class="text">Something broke.  The error that caused this has been logged.  Please try your request again later.</div>
            </div>
        `;
    }
}

if (typeof module !== "undefined") {
    module.exports = ServerErrorView; // eslint-disable-line no-undef
}
