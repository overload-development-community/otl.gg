/**
 * @typedef {import("../../src/models/challenge")} Challenge
 * @typedef {{name: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, gamesWithDamage: number, deathsInGamesWithDamage: number, twitchName: string}} Roster
 */

//   ###                  #     #   #    #
//  #   #                 #     #   #
//  #       ###    ###   ####   #   #   ##     ###   #   #
//  #          #  #       #      # #     #    #   #  #   #
//  #       ####   ###    #      # #     #    #####  # # #
//  #   #  #   #      #   #  #   # #     #    #      # # #
//   ###    ####  ####     ##     #     ###    ###    # #
/**
 * A class that represents the cast view.
 */
class CastView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered cast template.
     * @param {{challenge: Challenge, challengingTeamRoster: Roster[], challengedTeamRoster: Roster[], castData: {challengingTeamWins: number, challengingTeamLosses: number, challengingTeamTies: number, challengingTeamRating: number, challengedTeamWins: number, challengedTeamLosses: number, challengedTeamTies: number, challengedTeamRating: number, challengingTeamHeadToHeadWins: number, challengedTeamHeadToHeadWins: number, headToHeadTies: number, challengingTeamId: number, challengingTeamScore: number, challengedTeamId: number, challengedTeamScore: number, map: string, gameType: string, matchTime: Date, name: string, teamId: number, captures: number, pickups: number, carrierKills: number, returns: number,kills: number, assists: number, deaths: number, damage: number}}} data The cast data.
     * @returns {string} An HTML string of the cast.
     */
    static get(data) {
        const {challenge, challengingTeamRoster, challengedTeamRoster, castData} = data,
            challengingTeamColor = challenge.challengingTeam.role && challenge.challengingTeam.role.color ? challenge.challengingTeam.role.hexColor : "white",
            challengedTeamColor = challenge.challengedTeam.role && challenge.challengedTeam.role.color ? challenge.challengedTeam.role.hexColor : "white";

        return /* html */`
            <html>
                <head>
                    <title>${challenge.challengingTeam.name} vs ${challenge.challengedTeam.name}</title>
                    <script src="https://player.twitch.tv/js/embed/v1.js"></script>
                    <script src="/js/common.js"></script>
                    <script src="/js/cast.js"></script>
                    ${CastView.Common.favIcon()}
                    <link rel="stylesheet" href="/css/reset.css" />
                    <link rel="stylesheet" href="/css/cast.css" />
                    <script>
                        ${challengingTeamRoster.filter((p) => p.twitchName).map((p) => /* html */`
                            Cast.leftStreamers.push({
                                name: "${CastView.Common.jsEncode(CastView.Common.normalizeName(p.name, challenge.challengingTeam.tag))}",
                                twitch: "${p.twitchName ? CastView.Common.jsEncode(p.twitchName) : ""}"
                            });
                        `).join("")}
                        ${challengedTeamRoster.filter((p) => p.twitchName).map((p) => /* html */`
                            Cast.rightStreamers.push({
                                name: "${CastView.Common.jsEncode(CastView.Common.normalizeName(p.name, challenge.challengedTeam.tag))}",
                                twitch: "${p.twitchName ? CastView.Common.jsEncode(p.twitchName) : ""}"
                            });
                        `).join("")}
                    </script>
                <head>
                <body ${challenge.details.map ? `style="background-image: url('/images/${challenge.details.map.toLowerCase()}.jpg');"` : ""}>
                    <div id="shade">
                        <div id="logo"></div>
                        <div id="title">Overload Teams League</div>
                        <div id="left-team" style="border-color: ${challengingTeamColor};">
                            <div class="tag"><div class="diamond${challenge.challengingTeam.role && challenge.challengingTeam.role.color ? "" : "-empty"}" ${challenge.challengingTeam.role && challenge.challengingTeam.role.color ? `style="background-color: ${challenge.challengingTeam.role.hexColor};"` : ""}></div> ${challenge.challengingTeam.tag}</div>
                            <div class="name">${challenge.challengingTeam.name}</div>
                        </div>
                        <div id="right-team" style="border-color: ${challengedTeamColor};">
                            <div class="tag"><div class="diamond${challenge.challengedTeam.role && challenge.challengedTeam.role.color ? "" : "-empty"}" ${challenge.challengedTeam.role && challenge.challengedTeam.role.color ? `style="background-color: ${challenge.challengedTeam.role.hexColor};"` : ""}></div> ${challenge.challengedTeam.tag}</div>
                            <div class="name">${challenge.challengedTeam.name}</div>
                        </div>
                        <div id="left-rating" style="border-color: ${challengingTeamColor};">
                            ${castData.challengingTeamRating ? /* html */`
                                <div class="rating">Season Rating: <span class="numeric ${castData.challengingTeamWins + castData.challengingTeamLosses + castData.challengingTeamTies < 10 ? "provisional" : ""}">${castData.challengingTeamRating.toFixed(0)}</span></div>
                            ` : ""}
                            <div class="record">Record: <span class="numeric">${castData.challengingTeamWins}-${castData.challengingTeamLosses}${castData.challengingTeamTies ? `-${castData.challengingTeamTies}` : ""}</span></div>
                        </div>
                        <div id="right-rating" style="border-color: ${challengedTeamColor};">
                            ${castData.challengedTeamRating ? /* html */`
                                <div class="rating">Season Rating: <span class="numeric ${castData.challengedTeamWins + castData.challengedTeamLosses + castData.challengedTeamTies < 10 ? "provisional" : ""}">${castData.challengedTeamRating.toFixed(0)}</span></div>
                            ` : ""}
                            <div class="record">Record: <span class="numeric">${castData.challengedTeamWins}-${castData.challengedTeamLosses}${castData.challengedTeamTies ? `-${castData.challengedTeamTies}` : ""}</span></div>
                        </div>
                        ${castData.challengingTeamHeadToHeadWins + castData.challengedTeamHeadToHeadWins + castData.headToHeadTies > 0 ? /* html */`
                            <div id="head-to-head">
                                Head to Head Record<br />
                                <span class="record">${challenge.challengingTeam.tag} <span class="numeric">${castData.challengingTeamHeadToHeadWins}</span>${castData.headToHeadTies ? ` - Ties <span class="numeric">${castData.headToHeadTies}</span>` : ""} - ${challenge.challengedTeam.tag} <span class="numeric">${castData.challengedTeamHeadToHeadWins}</span></span>
                            </div>
                        ` : ""}
                        ${castData.challengingTeamId ? /* html */`
                            <div id="previous">
                                <div class="grid">
                                    <div class="last">Last Match</div>
                                    ${challenge.challengingTeam.id === castData.challengingTeamId ? /* html */`
                                        <div class="left-tag">${challenge.challengingTeam.tag}</div>
                                        <div class="numeric left-score">${castData.challengingTeamScore}</div>
                                        <div class="right-tag">${challenge.challengedTeam.tag}</div>
                                        <div class="numeric right-score">${castData.challengedTeamScore}</div>
                                    ` : /* html */ `
                                        <div class="left-tag">${challenge.challengingTeam.tag}</div>
                                        <div class="numeric left-score">${castData.challengedTeamScore}</div>
                                        <div class="right-tag">${challenge.challengedTeam.tag}</div>
                                        <div class="numeric right-score">${castData.challengingTeamScore}</div>
                                    `}
                                    <div class="map">${castData.map}</div>
                                    <div class="date"><script>document.write(Common.formatDate(new Date("${castData.matchTime}")));</script></div>
                                    ${castData.teamId ? /* html */`
                                        <div class="best">Best Performer</div>
                                        <div class="best-stats">
                                            ${castData.gameType === "TA" ? /* html */`
                                                ${(castData.teamId === challenge.challengingTeam.id ? challenge.challengingTeam : challenge.challengedTeam).tag} ${CastView.Common.htmlEncode(CastView.Common.normalizeName(castData.name, (castData.teamId === challenge.challengingTeam.id ? challenge.challengingTeam : challenge.challengedTeam).tag))}<br />
                                                <span class="numeric">${((castData.kills + castData.assists) / Math.max(1, castData.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${castData.kills}</span> K, <span class="numeric">${castData.assists}</span> A, <span class="numeric">${castData.deaths}</span> D)<br />
                                                ${castData.damage ? /* html */`
                                                    <span class="numeric">${castData.damage.toFixed(0)}</span> Dmg (<span class="numeric">${(castData.damage / Math.max(castData.deaths, 1)).toFixed(2)}</span> DmgPD)
                                                ` : ""}
                                            ` : ""}
                                            ${castData.gameType === "CTF" ? /* html */`
                                                ${(castData.teamId === challenge.challengingTeam.id ? challenge.challengingTeam : challenge.challengedTeam).tag} ${CastView.Common.htmlEncode(CastView.Common.normalizeName(castData.name, (castData.teamId === challenge.challengingTeam.id ? challenge.challengingTeam : challenge.challengedTeam).tag))}<br />
                                                <span class="numeric">${castData.captures}</span> C (<span class="numeric">${castData.pickups}</span> P, <span class="numeric">${castData.carrierKills}</span> CK, <span class="numeric">${castData.returns}</span> R)<br />
                                                <span class="numeric">${((castData.kills + castData.assists) / Math.max(1, castData.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${castData.kills}</span> K, <span class="numeric">${castData.assists}</span> A, <span class="numeric">${castData.deaths}</span> D)<br />
                                                ${castData.damage ? /* html */`
                                                    <span class="numeric">${castData.damage.toFixed(0)}</span> Dmg
                                                ` : ""}
                                            ` : ""}
                                        </div>
                                    ` : ""}
                                </div>
                            </div>
                        ` : ""}
                        <div id="left-roster" class="roster-${challenge.details.gameType.toLowerCase()}">
                            <div class="header">Pilot</div>
                            <div class="header">G</div>
                            ${challenge.details.gameType === "CTF" ? /* html */`
                                <div class="header">CPG</div>
                                <div class="header">PPG</div>
                                <div class="header">CKPG</div>
                                <div class="header">RPG</div>
                            ` : ""}
                            <div class="header">KDA</div>
                            ${challenge.details.gameType === "TA" ? /* html */`
                                <div class="header">KPG</div>
                                <div class="header">APG</div>
                                <div class="header">DPG</div>
                            ` : ""}
                            <div class="header">DmgPG</div>
                            ${challenge.details.gameType === "TA" ? /* html */`
                                <div class="header">DmgPD</div>
                            ` : ""}
                            ${data.challengingTeamRoster.map((p) => /* html */`
                                <div>${p.twitchName ? /* html */`
                                    <div class="twitch-image"></div>&nbsp;
                                ` : ""}${CastView.Common.htmlEncode(CastView.Common.normalizeName(p.name, challenge.challengingTeam.tag))}</div>
                                <div class="numeric">${p.games}</div>
                                ${challenge.details.gameType === "CTF" ? /* html */`
                                    <div class="header">CPG</div>
                                    <div class="header">PPG</div>
                                    <div class="header">CKPG</div>
                                    <div class="header">RPG</div>
                                ` : ""}
                                <div class="numeric">${p.games ? ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(3) : ""}</div>
                                ${challenge.details.gameType === "TA" ? /* html */`
                                    <div class="numeric">${p.games ? (p.kills / p.games).toFixed(2) : ""}</div>
                                    <div class="numeric">${p.games ? (p.assists / p.games).toFixed(2) : ""}</div>
                                    <div class="numeric">${p.games ? (p.deaths / p.games).toFixed(2) : ""}</div>
                                ` : ""}
                                <div class="numeric">${p.damage ? (p.damage / p.gamesWithDamage).toFixed(0) : ""}</div>
                                ${challenge.details.gameType === "TA" ? /* html */`
                                    <div class="numeric">${p.damage ? (p.damage / Math.max(p.deathsInGamesWithDamage, 1)).toFixed(2) : ""}</div>
                                ` : ""}
                            `).join("")}
                        </div>
                        <div id="right-roster" class="roster-${challenge.details.gameType.toLowerCase()}">
                            <div class="header">Pilot</div>
                            <div class="header">G</div>
                            ${challenge.details.gameType === "CTF" ? /* html */`
                                <div class="header">CPG</div>
                                <div class="header">PPG</div>
                                <div class="header">CKPG</div>
                                <div class="header">RPG</div>
                            ` : ""}
                            <div class="header">KDA</div>
                            ${challenge.details.gameType === "TA" ? /* html */`
                                <div class="header">KPG</div>
                                <div class="header">APG</div>
                                <div class="header">DPG</div>
                            ` : ""}
                            <div class="header">DmgPG</div>
                            ${challenge.details.gameType === "TA" ? /* html */`
                                <div class="header">DmgPD</div>
                            ` : ""}
                            ${data.challengedTeamRoster.map((p) => /* html */`
                                <div>${p.twitchName ? /* html */`
                                    <div class="twitch-image"></div>&nbsp;
                                ` : ""}${CastView.Common.htmlEncode(CastView.Common.normalizeName(p.name, challenge.challengingTeam.tag))}</div>
                                <div class="numeric">${p.games}</div>
                                ${challenge.details.gameType === "CTF" ? /* html */`
                                    <div class="header">CPG</div>
                                    <div class="header">PPG</div>
                                    <div class="header">CKPG</div>
                                    <div class="header">RPG</div>
                                ` : ""}
                                <div class="numeric">${p.games ? ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(3) : ""}</div>
                                ${challenge.details.gameType === "TA" ? /* html */`
                                    <div class="numeric">${p.games ? (p.kills / p.games).toFixed(2) : ""}</div>
                                    <div class="numeric">${p.games ? (p.assists / p.games).toFixed(2) : ""}</div>
                                    <div class="numeric">${p.games ? (p.deaths / p.games).toFixed(2) : ""}</div>
                                ` : ""}
                                <div class="numeric">${p.damage ? (p.damage / p.gamesWithDamage).toFixed(0) : ""}</div>
                                ${challenge.details.gameType === "TA" ? /* html */`
                                    <div class="numeric">${p.damage ? (p.damage / Math.max(p.deathsInGamesWithDamage, 1)).toFixed(2) : ""}</div>
                                ` : ""}
                            `).join("")}
                        </div>
                        <div id="left-viewing" style="border-color: ${challengingTeamColor};">
                            Now viewing:<br />
                            <span id="left-name" class="player"></span><br />
                            <div class="twitch-image"></div>&nbsp;<span id="left-twitch" class="twitch"></span>
                        </div>
                        <div id="right-viewing" style="border-color: ${challengedTeamColor};">
                            Now viewing:<br />
                            <span id="right-name" class="player"></span><br />
                            <div class="twitch-image"></div>&nbsp;<span id="right-twitch" class="twitch"></span>
                        </div>
                        <div id="left-frame" style="border-color: ${challengingTeamColor};">
                            <div id="left-player"></div>
                        </div>
                        <div id="right-frame" style="border-color: ${challengedTeamColor};">
                            <div id="right-player"></div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
CastView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = CastView; // eslint-disable-line no-undef
}
