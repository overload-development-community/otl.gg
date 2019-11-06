//  #   #          #            #        ###
//  #   #          #            #          #
//  ## ##   ###   ####    ###   # ##       #   ###
//  # # #      #   #     #   #  ##  #      #  #
//  #   #   ####   #     #      #   #      #   ###
//  #   #  #   #   #  #  #   #  #   #  #   #      #
//  #   #   ####    ##    ###   #   #   ###   ####
/**
 * A class that provides functions for the match page.
 */
class MatchJs {
    // ###    ##   #  #   ##                #                 #    #                    #           #
    // #  #  #  #  ####  #  #               #                 #    #                    #           #
    // #  #  #  #  ####  #      ##   ###   ###    ##   ###   ###   #      ##    ###   ###   ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    # ##  #  #   #    #     #  #  #  #  #  #  # ##  #  #
    // #  #  #  #  #  #  #  #  #  #  #  #   #    ##    #  #   #    #     #  #  # ##  #  #  ##    #  #
    // ###    ##   #  #   ##    ##   #  #    ##   ##   #  #    ##  ####   ##    # #   ###   ##    ###
    /**
     * Setup the weapon grid.
     * @returns {void}
     */
    static DOMContentLoaded() {
        document.querySelectorAll("a.weapon").forEach((a) => a.addEventListener("click", (ev) => {
            document.getElementById("weapon").innerText = a.title;

            for (let x = 0; x < MatchJs.players.length; x++) {
                let total = 0;
                for (let y = 0; y < MatchJs.players.length; y++) {
                    const damage = (MatchJs.damage.find((d) => d.name === MatchJs.players[x] && d.opponentName === MatchJs.players[y] && d.weapon === a.title && (d.teamId !== d.opponentTeamId || d.name === d.opponentName)) || {damage: 0}).damage,
                        el = document.getElementById(`damage-${x}-${y}`);

                    el.innerText = damage === 0 ? "" : damage.toFixed(0);
                    if (!el.classList.contains("friendly")) {
                        total += damage;
                    }
                }
                document.getElementById(`damage-${x}-total`).innerText = total.toFixed(0);
            }

            ev.preventDefault();
            ev.stopPropagation();
            return false;
        }));
    }
}

document.addEventListener("DOMContentLoaded", MatchJs.DOMContentLoaded);
