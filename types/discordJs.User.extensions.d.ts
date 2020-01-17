import {User} from "discord.js"
import PlayerTypes from "./playerTypes"

declare module "discord.js" {
    interface User {
        /**
         * Gets the current season stats for the pilot.
         * @returns {Promise<PlayerTypes.PlayerStats>} A promise that resolves with the pilot's stats.
         */
        getStats(): Promise<PlayerTypes.PlayerStats>
    }
}
