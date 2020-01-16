import {User} from "discord.js"
import PlayerTypes from "../models/player.types"

declare module "discord.js" {
    interface User {
        /**
         * Gets the current season stats for the pilot.
         * @returns {Promise<PlayerTypes.PlayerStats>} A promise that resolves with the pilot's stats.
         */
        getStats(): Promise<PlayerTypes.PlayerStats>
    }
}
