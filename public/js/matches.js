/* global Common, MatchView */

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
        Matches.page = 1;

        Array.from(document.getElementsByClassName("select-page")).forEach((paginator) => {
            paginator.addEventListener("click", (ev) => {
                if (ev.target.classList.contains("active")) {
                    return;
                }

                Array.from(document.getElementsByClassName("select-page")).forEach((page) => {
                    page.classList.remove("active");
                });

                paginator.classList.add("active");

                Matches.page = +paginator.innerText;

                Common.loadDataIntoTemplate(`/api/match?season=${document.getElementById("season").innerText}&page=${Matches.page}`, "#completed-matches", MatchView.get);
            });

            paginator.addEventListener("selectstart", (ev) => {
                ev.preventDefault();
            });
        });

        document.getElementById("select-prev").addEventListener("click", () => {
            const el = document.getElementsByClassName(`select-page-${Matches.page - 1}`)[0];

            if (el) {
                el.click();
            }
        });

        document.getElementById("select-prev").addEventListener("selectstart", (ev) => {
            ev.preventDefault();
        });

        document.getElementById("select-next").addEventListener("click", () => {
            const el = document.getElementsByClassName(`select-page-${Matches.page + 1}`)[0];

            if (el) {
                el.click();
            }
        });

        document.getElementById("select-next").addEventListener("selectstart", (ev) => {
            ev.preventDefault();
        });
    }
}

document.addEventListener("DOMContentLoaded", Matches.DOMContentLoaded);
