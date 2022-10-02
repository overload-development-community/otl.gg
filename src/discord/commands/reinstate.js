/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1),
    commandSemaphore = new Semaphore(1);

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
     * @returns {string} The subcommand group for this command.
     */
    static get simulate() {
        return "team";
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
    static handle(interaction, user) {
        return commandSemaphore.callFunction(async () => {
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

            const collector = response.createMessageComponentCollector({time: 890000});

            collector.on("collect", (/** @type {DiscordJs.ButtonInteraction} */buttonInteraction) => buttonSemaphore.callFunction(async () => {
                if (collector.ended || buttonInteraction.customId !== customId) {
                    return;
                }

                await buttonInteraction.deferUpdate();

                let team;
                try {
                    team = await Reinstate.validate(interaction, member);
                } catch (err) {
                    Validation.logButtonError(interaction, buttonInteraction, err);
                    return;
                }

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
                    collector.stop();
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
            }));

            collector.on("end", async () => {
                try {
                    await interaction.editReply({components: []});
                } catch {}
            });

            return true;
        });
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
