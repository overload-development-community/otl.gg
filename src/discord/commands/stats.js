const Common = require("../../../web/includes/common"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js");

//   ###    #             #
//  #   #   #             #
//  #      ####    ###   ####    ###
//   ###    #         #   #     #
//      #   #      ####   #      ###
//  #   #   #  #  #   #   #  #      #
//   ###     ##    ####    ##   ####
/**
 * A command to display a pilot's stats.
 */
class Stats {
    //       ##          #           ##
    //        #          #            #
    //  ###   #     ##   ###    ###   #
    // #  #   #    #  #  #  #  #  #   #
    //  ##    #    #  #  #  #  # ##   #
    // #     ###    ##   ###    # #  ###
    //  ###
    /**
     * Indicates that this is a global command.
     * @returns {boolean} Whether this is a global command.
     */
    static get global() {
        return true;
    }

    //                                        #
    //                                        #
    //  ##    ##   # #   # #    ###  ###    ###
    // #     #  #  ####  ####  #  #  #  #  #  #
    // #     #  #  #  #  #  #  # ##  #  #  #  #
    //  ##    ##   #  #  #  #   # #  #  #   ###
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot to get stats for.")
                .setRequired(false))
            .setName("stats")
            .setDescription("Display the next matches and events in the OTL.");
    }

    // #                    #  ##
    // #                    #   #
    // ###    ###  ###    ###   #     ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  # ##  #  #  #  #   #    ##
    // #  #   # #  #  #   ###  ###    ##
    /**
     * The command handler.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} user The user initiating the interaction.
     * @returns {Promise<boolean>} A promise that returns whether the interaction was successfully handled.
     */
    static async handle(interaction, user) {
        await interaction.deferReply({ephemeral: false});

        const pilot = interaction.options.getUser("pilot", false) || user;

        let stats;
        try {
            stats = await pilot.getStats();
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        if (stats && (stats.ta ? stats.ta.games : 0) + (stats.ctf ? stats.ctf.games : 0) > 0) {
            const fields = [];

            if (stats.ta && stats.ta.games > 0) {
                fields.push({
                    name: "Team Anarchy",
                    value: `${stats.ta.games} Game${stats.ta.games === 1 ? "" : "s"}, ${((stats.ta.kills + stats.ta.assists) / (stats.ta.deaths < 1 ? 1 : stats.ta.deaths)).toFixed(3)} KDA, ${stats.ta.kills} Kill${stats.ta.kills === 1 ? "" : "s"}, ${stats.ta.assists} Assist${stats.ta.assists === 1 ? "" : "s"}, ${stats.ta.deaths} Death${stats.ta.deaths === 1 ? "" : "s"}${stats.ta.damage ? `, ${stats.ta.damage.toFixed(0)} Damage, ${(stats.ta.damage / Math.max(stats.ta.deathsInGamesWithDamage, 1)).toFixed(2)} Damage Per Death` : ""}`
                });
            }

            if (stats.ctf && stats.ctf.games > 0) {
                fields.push({
                    name: "Capture the Flag",
                    value: `${stats.ctf.games} Game${stats.ctf.games === 1 ? "" : "s"}, ${stats.ctf.captures} Capture${stats.ctf.captures === 1 ? "" : "s"}, ${stats.ctf.pickups} Pickup${stats.ctf.pickups === 1 ? "" : "s"}, ${stats.ctf.carrierKills} Carrier Kill${stats.ctf.carrierKills === 1 ? "" : "s"}, ${stats.ctf.returns} Return${stats.ctf.returns === 1 ? "" : "s"}, ${((stats.ctf.kills + stats.ctf.assists) / (stats.ctf.deaths < 1 ? 1 : stats.ctf.deaths)).toFixed(3)} KDA${stats.ctf.damage ? `, ${stats.ctf.damage.toFixed(0)} Damage` : ""}`
                });
            }

            if (stats.damage) {
                const primaries = (stats.damage.Impulse || 0) + (stats.damage.Cyclone || 0) + (stats.damage.Reflex || 0) + (stats.damage.Crusher || 0) + (stats.damage.Driller || 0) + (stats.damage.Flak || 0) + (stats.damage.Thunderbolt || 0) + (stats.damage.Lancer || 0),
                    secondaries = (stats.damage.Falcon || 0) + (stats.damage["Missile Pod"] || 0) + (stats.damage.Hunter || 0) + (stats.damage.Creeper || 0) + (stats.damage.Nova || 0) + (stats.damage.Devastator || 0) + (stats.damage["Time Bomb"] || 0) + (stats.damage.Vortex || 0),
                    bestPrimary = Object.keys(stats.damage).filter((d) => ["Impulse", "Cyclone", "Reflex", "Crusher", "Driller", "Flak", "Thunderbolt", "Lancer"].indexOf(d) !== -1).sort((a, b) => stats.damage[b] - stats.damage[a])[0],
                    bestSecondary = Object.keys(stats.damage).filter((d) => ["Falcon", "Missile Pod", "Hunter", "Creeper", "Nova", "Devastator", "Time Bomb", "Vortex"].indexOf(d) !== -1).sort((a, b) => stats.damage[b] - stats.damage[a])[0];

                if (primaries + secondaries > 0) {
                    fields.push({
                        name: "Weapon Stats",
                        value: `${bestPrimary && bestPrimary !== "" ? `Most Used Primary: ${bestPrimary}, ` : ""}${bestSecondary && bestSecondary !== "" ? `Most Used Secondary: ${bestSecondary}, ` : ""}Primary/Secondary balance: ${(100 * primaries / (primaries + secondaries)).toFixed(1)}%/${(100 * secondaries / (primaries + secondaries)).toFixed(1)}%`
                    });
                }
            }

            fields.push({
                name: "For more details, visit:",
                value: `https://otl.gg/player/${stats.playerId}/${encodeURIComponent(Common.normalizeName(Discord.getName(pilot), stats.tag))}`
            });

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: `OTL Season ${stats.season} Stats for ${Common.normalizeName(Discord.getName(pilot), stats.tag)}`,
                        fields
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: `Sorry, ${user}, but ${pilot.id === user.id ? "you have" : `${pilot} has`} not played any games on the OTL this season.`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Stats;
