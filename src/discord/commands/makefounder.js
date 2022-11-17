/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1);

//  #   #         #             #####                           #
//  #   #         #             #                               #
//  ## ##   ###   #   #   ###   #       ###   #   #  # ##    ## #   ###   # ##
//  # # #      #  #  #   #   #  ####   #   #  #   #  ##  #  #  ##  #   #  ##  #
//  #   #   ####  ###    #####  #      #   #  #   #  #   #  #   #  #####  #
//  #   #  #   #  #  #   #      #      #   #  #  ##  #   #  #  ##  #      #
//  #   #   ####  #   #   ###   #       ###    ## #  #   #   ## #   ###   #
/**
 * A command to make another pilot a founder.
 */
class MakeFounder {
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
        return "roster";
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
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot on your team to make the founder.")
                .setRequired(true))
            .setName("makefounder")
            .setDescription("Replaces you as your team's founder with another pilot on your team.");
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
        MakeFounder.builder(builder);
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

        const {pilot: checkPilot, team: checkTeam} = await MakeFounder.validate(interaction, member);

        const customId = `makefounder-${user.id}-${checkPilot.id}-${checkTeam.tag}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`Yes, make ${checkPilot.displayName} my team's founder`)
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you want to make ${checkPilot} the founder of **${checkTeam.name}**?  You will remain a team captain.`,
                    color: 0xffff00
                })
            ],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({time: 890000});

        collector.on("collect", async (/** @type {DiscordJs.ButtonInteraction} */buttonInteraction) => {
            await buttonInteraction.deferUpdate();

            return buttonSemaphore.callFunction(async () => {
                if (collector.ended || buttonInteraction.customId !== customId) {
                    return;
                }

                let pilot, team;
                try {
                    ({pilot, team} = await MakeFounder.validate(interaction, member));
                } catch (err) {
                    Validation.logButtonError(interaction, buttonInteraction, err);
                    return;
                }

                try {
                    await team.makeFounder(member, pilot);
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
                            description: `${member}, you have transferred team ownership to ${pilot}.  You remain a team captain.`,
                            color: team.role.color
                        })
                    ]
                });

                collector.stop();
            });
        });

        collector.on("end", async () => {
            try {
                await interaction.editReply({components: []});
            } catch {}
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
     * @returns {Promise<{pilot: DiscordJs.GuildMember, team: Team}>} A promise that returns the new founder and the team.
     */
    static async validate(interaction, member) {
        await Validation.memberShouldBeFounder(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member),
            pilot = await Validation.pilotShouldBeOnServer(interaction, member);
        await Validation.pilotShouldBeDifferentThanMember(interaction, pilot, member);
        await Validation.pilotShouldBeOnTeam(interaction, pilot, team, member);
        await Validation.pilotShouldBeAllowedToBeCaptain(interaction, pilot, member);

        return {pilot, team};
    }
}

module.exports = MakeFounder;
