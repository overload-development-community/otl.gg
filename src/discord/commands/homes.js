const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #
//  #   #
//  #   #   ###   ## #    ###    ###
//  #####  #   #  # # #  #   #  #
//  #   #  #   #  # # #  #####   ###
//  #   #  #   #  # # #  #          #
//  #   #   ###   #   #   ###   ####
/**
 * A command to retrieve a team's homes.
 */
class Homes {
    // #            #    ##       #
    // #                  #       #
    // ###   #  #  ##     #     ###   ##   ###
    // #  #  #  #   #     #    #  #  # ##  #  #
    // #  #  #  #   #     #    #  #  ##    #
    // ###    ###  ###   ###    ###   ##   #
    /**
     * The common command builder.
     * @param {DiscordJs.SlashCommandBuilder | DiscordJs.SlashCommandSubcommandBuilder} builder The command builder.
     * @returns {void}
     */
    static builder(builder) {
        builder
            .addStringOption((option) => option
                .setName("team")
                .setDescription("The name or tag of the team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(false))
            .setName("homes")
            .setDescription("Retrieves a team's homes.");
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
        const builder = new DiscordJs.SlashCommandBuilder();
        Homes.builder(builder);
        return builder;
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

        const member = Discord.findGuildMemberById(user.id),
            checkTeam = interaction.options.getString("team", false);

        let team;
        if (checkTeam) {
            team = await Validation.teamShouldExist(interaction, checkTeam, member);
        } else {
            team = await Validation.memberShouldBeOnATeam(interaction, member);
        }

        let homes;
        try {
            homes = await team.getHomeMapsByType();
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        const msg = Discord.embedBuilder({
            title: `Home maps for **${team.name}**`,
            fields: [],
            color: team.role.color
        });

        Object.keys(homes).sort().forEach((gameType) => {
            msg.addFields({
                name: Challenge.getGameTypeName(gameType),
                value: homes[gameType].join("\n"),
                inline: true
            });
        });

        await interaction.editReply({
            embeds: [msg]
        });
        return true;
    }
}

module.exports = Homes;
