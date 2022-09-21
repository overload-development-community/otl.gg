/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####            #                   #             #
//  #   #                               #             #
//  #   #   ###    ##    # ##    ###   ####    ###   ####    ###
//  ####   #   #    #    ##  #  #       #         #   #     #   #
//  # #    #####    #    #   #   ###    #      ####   #     #####
//  #  #   #        #    #   #      #   #  #  #   #   #  #  #
//  #   #   ###    ###   #   #  ####     ##    ####    ##    ###
/**
 * A command to reinstate a disbanded team.
 */
class Reinstate {
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Indicates that this is a command that can be simulated.
     * @returns {boolean} Whether this is a command that can be simulated.
     */
    static get simulate() {
        return true;
    }

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
                .setDescription("The name or tag of the team to reinstate.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .setName("reinstate")
            .setDescription("Reinstates a disbanded team.");
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
        Reinstate.builder(builder);
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
        const response = await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id);

        const checkTeam = await Reinstate.validate(interaction, member);

        const customId = `reinstate-${user.id}-${checkTeam.tag}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`Yes, reinstate ${checkTeam.name}`)
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you want to reinstate **${checkTeam.name}**?  You will become the team's founder.`,
                    color: 0xffff00
                })
            ],
            components: [row]
        });

        const collector = response.createMessageComponentCollector();

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.customId !== customId) {
                return;
            }

            const team = await Reinstate.validate(interaction, member);

            try {
                await team.reinstate(member);
            } catch (err) {
                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw err;
            }

            await interaction.editReply({components: []});
            await interaction.followUp({
                embeds: [
                    Discord.embedBuilder({
                        description: `Congratulations, ${member}!  Your team has been reinstated!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`
                    })
                ]
            });

            collector.stop();
        });

        return true;
    }

    //             ##     #       #         #
    //              #             #         #
    // # #    ###   #    ##     ###   ###  ###    ##
    // # #   #  #   #     #    #  #  #  #   #    # ##
    // # #   # ##   #     #    #  #  # ##   #    ##
    //  #     # #  ###   ###    ###   # #    ##   ##
    /**
     * Performs command validation.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The guild member initiating the interaction.
     * @returns {Promise<Team>} A promise that returns the team to reinstate.
     */
    static async validate(interaction, member) {
        await Validation.memberShouldNotBeOnATeam(interaction, member);
        await Validation.memberShouldNotBeCreatingTeam(interaction, member);
        const team = await Validation.teamShouldExist(interaction, interaction.options.getString("team", true), member);
        await Validation.teamShouldNotBeDisbanded(interaction, team, member);
        await Validation.memberShouldBePriorTeamCaptainOrFounder(interaction, team, member);
        await Validation.memberShouldBeAllowedToBeCaptain(interaction, member);
        await Validation.memberShouldBeAllowedToJoinATeam(interaction, member);
        await Validation.memberShouldNotBeBannedFromTeam(interaction, team, member);

        return team;
    }
}

module.exports = Reinstate;
