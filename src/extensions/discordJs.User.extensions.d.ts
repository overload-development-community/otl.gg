import {User} from "discord.js"

declare module "discord.js" {
    interface User {
        /**
         * Gets the current season stats for the pilot.
         * @returns {Promise<{ta: {games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number}, ctf: {games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number}, damage: Object<string, number>, playerId: number, name: string, tag: string, season: number}>} A promise that resolves with the pilot's stats.
         */
        getStats(): Promise<{
            ta: {
                games: number
                kills: number
                assists: number
                deaths: number
                damage: number
                deathsInGamesWithDamage: number
            }
            ctf: {
                games: number
                captures: number
                pickups: number
                carrierKills: number
                returns: number
                kills: number
                assists: number
                deaths: number
                damage: number
            }
            damage: {
                [x: string]: number
            }
            playerId: number
            name: string
            tag: string
            season: number
        }>
    }
}
