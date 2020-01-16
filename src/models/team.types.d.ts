import DiscordJs from "discord.js"

declare namespace TeamTypes {
    type TeamData = {
        member?: DiscordJs.GuildMember
        id: number
        name: string
        tag: string
        isFounder?: boolean
        disbanded?: boolean
        locked?: boolean
    }

    type TeamInfo = {
        homes: {
            map: string
            gameType: string
        }[]
        members: {
            playerId: number
            name: string
            role: string
        }[]
        requests: {
            name: string
            date: Date
        }[]
        invites: {
            name: string
            date: Date
        }[]
        penaltiesRemaining: number
    }

    type TeamRecord = {
        teamId: number
        name: string
        tag: string
        disbanded: boolean
        locked: boolean
        rating: number
        wins: number
        losses: number
        ties: number
    }
}

export = TeamTypes
