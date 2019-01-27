//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##    ###    ###
//  # # #      #   #     #   #  ##  #  #   #  #
//  #   #   ####   #     #      #   #  #####   ###
//  #   #  #   #   #  #  #   #  #   #  #          #
//  #   #   ####    ##    ###   #   #   ###   ####
/**
 * A class that handles the matches page.
 */
class Matches {
    // ###    ##   #  #   ##                #                 #    #                    #           #
    // #  #  #  #  ####  #  #               #                 #    #                    #           #
    // #  #  #  #  ####  #      ##   ###   ###    ##   ###   ###   #      ##    ###   ###   ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    # ##  #  #   #    #     #  #  #  #  #  #  # ##  #  #
    // #  #  #  #  #  #  #  #  #  #  #  #   #    ##    #  #   #    #     #  #  # ##  #  #  ##    #  #
    // ###    ##   #  #   ##    ##   #  #    ##   ##   #  #    ##  ####   ##    # #   ###   ##    ###
    /**
     * Initializes the page.
     * @returns {void}
     */
    static DOMContentLoaded() {
        Matches.page = 0;

        Array.from(document.getElementsByClassName("select-page")).forEach((paginator, index) => {
            paginator.addEventListener("click", (ev) => {
                if (ev.target.classList.contains("active")) {
                    return;
                }

                Array.from(document.getElementsByClassName("page")).forEach((page) => {
                    page.classList.add("hidden");
                });

                Array.from(document.getElementsByClassName(`page-${index}`)).forEach((page) => {
                    page.classList.remove("hidden");
                });

                Array.from(document.getElementsByClassName("select-page")).forEach((page) => {
                    page.classList.remove("active");
                });

                paginator.classList.add("active");

                Matches.page = +paginator.innerText - 1;
            });
        });

        document.getElementById("select-prev").addEventListener("click", () => {
            const el = document.getElementsByClassName(`select-page-${Matches.page - 1}`)[0];

            if (el) {
                el.click();
            }
        });

        document.getElementById("select-next").addEventListener("click", () => {
            const el = document.getElementsByClassName(`select-page-${Matches.page + 1}`)[0];

            if (el) {
                el.click();
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", Matches.DOMContentLoaded);
