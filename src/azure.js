/**
 * @typedef {import("../types/azureTypes").Server} AzureTypes.Server
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 * @typedef {import("../types/trackerTypes").Game} TrackerTypes.Game
 */

const azure = require("@azure/identity"),
    ComputeManagementClient = require("@azure/arm-compute").ComputeManagementClient,
    EventEmitter = require("events").EventEmitter,
    Log = require("./logging/log"),
    Tracker = require("./tracker"),

    browser = new EventEmitter(),
    settings = require("../settings").azure;

/** @type {{[x: string]: TrackerTypes.Game}} */
const servers = {};

/** @type {typeof import("./discord")} */
let Discord;

setTimeout(() => {
    Discord = require("./discord");
}, 0);

//    #
//   # #
//  #   #  #####  #   #  # ##    ###
//  #   #     #   #   #  ##  #  #   #
//  #####    #    #   #  #      #####
//  #   #   #     #  ##  #      #
//  #   #  #####   ## #  #       ###
/**
 * A class that handles calls to Azure.
 */
class Azure {
    //               #    ###    #                             #
    //               #     #                                   #
    //  ###    ##   ###    #    ##    # #    ##    ##   #  #  ###    ###
    // ##     # ##   #     #     #    ####  # ##  #  #  #  #   #    ##
    //   ##   ##     #     #     #    #  #  ##    #  #  #  #   #      ##
    // ###     ##     ##   #    ###   #  #   ##    ##    ###    ##  ###
    /**
     * Sets the timeouts for the server.
     * @param {AzureTypes.Server} server The server object.
     * @param {string} region The server's region.
     * @param {DiscordJs.TextChannel} channel The Discord channel to communicate to.
     * @returns {void}
     */
    static setTimeouts(server, region, channel) {
        server.warningTimeout = setTimeout(async () => {
            await Discord.queue(`The ${region} server will automatically shut down in 5 minutes.  Use the \`!extend ${region}\` command to reset the shutdown timer to 15 minutes.`, channel);
        }, 600000);
        server.timeout = setTimeout(async () => {
            await Azure.stop(server);
            server.started = false;
            await Discord.queue(`The ${region} server is being shutdown.  Thanks for playing!`, channel);

            browser.removeAllListeners(server.ipAddress);
        }, 900000);
    }

    //               #
    //               #
    //  ###    ##   ###   #  #  ###
    // ##     # ##   #    #  #  #  #
    //   ##   ##     #    #  #  #  #
    // ###     ##     ##   ###  ###
    //                          #
    /**
     * Sets up communications for a server.
     * @param {AzureTypes.Server} server The server object.
     * @param {string} region The server's region.
     * @param {DiscordJs.TextChannel} channel The Discord channel to communicate to.
     * @returns {void}
     */
    static setup(server, region, channel) {
        server.started = true;
        if (server.warningTimeout) {
            clearTimeout(server.warningTimeout);
        }
        if (server.timeout) {
            clearTimeout(server.timeout);
        }
        server.warningTimeout = void 0;
        server.timeout = void 0;
        this.setTimeouts(server, region, channel);

        browser.removeAllListeners(server.ipAddress);
        browser.on(server.ipAddress, async (data) => {
            // Ensure the timeouts are cleared.
            if (server.warningTimeout) {
                clearTimeout(server.warningTimeout);
            }
            if (server.timeout) {
                clearTimeout(server.timeout);
            }
            server.warningTimeout = void 0;
            server.timeout = void 0;

            // We're receiving data that a game or lobby has ended, setup the timeouts and, if this is a completed game, get the completed game data.
            if (!data.game) {
                this.setTimeouts(server, region, channel);

                if (!data.inLobby) {
                    try {
                        const gameList = await Tracker.getGameList();

                        const game = gameList.body.games.find((g) => g.ip === server.ipAddress);

                        if (game) {
                            const embed = Discord.embedBuilder({
                                title: `${region} Game Completed`,
                                description: `Tracker URL: https://tracker.otl.gg/archive/${game.id}`
                            });

                            if (game.data.teamScore && Object.keys(game.data.teamScore).length > 0) {
                                embed.addFields(Object.keys(game.data.teamScore).sort((a, b) => game.data.teamScore[b] - game.data.teamScore[a]).map((team) => ({
                                    name: team,
                                    value: game.data.teamScore[team].toLocaleString("en-us")
                                })));
                            } else {
                                embed.addFields(game.data.players.sort((a, b) => b.kills * 3 + b.assists - (a.kills * 3 + a.assists)).map((player) => ({
                                    name: player.name,
                                    value: (game.data.players.length === 2 ? player.kills : player.kills * 3 + player.assists).toLocaleString("en-us")
                                })));
                            }

                            await Discord.richQueue(embed, channel);
                        }
                    } catch (err) {
                        Log.exception("There was an error while displaying completed game data.", err);
                    }
                }
                return;
            }

            // We're just starting a game, report it.
            if (data.inLobby && !data.game.inLobby) {
                await Discord.queue(`${region} game has started!`, channel);
                return;
            }

            // We're receiving updated game data, display it.
            await Discord.queue(`${region} lobby status: ${data.game.mapName} ${data.game.mode}, ${data.game.currentPlayers}/${data.game.maxPlayers} players\nJoin at **${server.ipAddress}** (${server.host})`, channel);
        });
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###
    // ##      #    #  #  #  #   #
    //   ##    #    # ##  #      #
    // ###      ##   # #  #       ##
    /**
     * Starts an Azure VM.
     * @param {AzureTypes.Server} server The server to start.
     * @returns {Promise} A promise that resolves when the server has been started.
     */
    static start(server) {
        const credential = new azure.ClientSecretCredential(settings.tenantId, settings.clientId, settings.secret),
            client = new ComputeManagementClient(credential, settings.subscriptionId);

        return client.virtualMachines.beginStart(server.resourceGroupName, server.vmName);
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Starts up the check for Azure servers online.
     * @returns {void}
     */
    static startup() {
        setInterval(async () => {
            try {
                const serverData = await Tracker.getBrowser();

                for (const server of serverData.body) {
                    if (server.game) {
                        if (!servers[server.server.ip]) {
                            browser.emit(server.server.ip, {game: server.game, inLobby: false});
                        } else if (server.game.currentPlayers !== servers[server.server.ip].currentPlayers || server.game.maxPlayers !== servers[server.server.ip].maxPlayers || server.game.mapName !== servers[server.server.ip].mapName || server.game.mode !== servers[server.server.ip].mode || server.game.inLobby !== servers[server.server.ip].inLobby) {
                            browser.emit(server.server.ip, {game: server.game, inLobby: servers[server.server.ip].inLobby});
                        }
                    } else if (servers[server.server.ip]) {
                        browser.emit(server.server.ip, {game: null, inLobby: servers[server.server.ip].inLobby});
                    }

                    servers[server.server.ip] = server.game;
                }
            } catch (err) {
                Log.exception("There was an error while checking for Azure servers.", err);
            }
        }, 5000);
    }

    //         #
    //         #
    //  ###   ###    ##   ###
    // ##      #    #  #  #  #
    //   ##    #    #  #  #  #
    // ###      ##   ##   ###
    //                    #
    /**
     * Stops an Azure VM.
     * @param {AzureTypes.Server} server The server to stop.
     * @returns {Promise} A promise that resolves when the server has been stopped.
     */
    static stop(server) {
        const credential = new azure.ClientSecretCredential(settings.tenantId, settings.clientId, settings.secret),
            client = new ComputeManagementClient(credential, settings.subscriptionId);

        return client.virtualMachines.beginDeallocate(server.resourceGroupName, server.vmName);
    }
}

module.exports = Azure;
