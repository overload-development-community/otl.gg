import {GuildMember, User} from "discord.js";

declare namespace PlayerTypes {
    type CTFStats = {
        captures: number
        pickups: number
        carrierKills: number
        returns: number
    }

    type GameRecord = {
        teamSize: number
        record: number
        playerId?: number
        name?: string
        teamId: number
        tag: string
        teamName: string
        opponentTeamId: number
        opponentTag: string
        opponentTeamName: string
        challengeId: number
        matchTime: Date
        map: string
        overtimePeriods: number
    };

    type GameStats = KDAStats & {
        damage: number
    }

    type KDAStats = {
        kills: number
        assists: number
        deaths: number
    }

    type WeaponStats = {
        weapon: string
        damage: number
    }

    type UserOrGuildMember = GuildMember|User
}

export = PlayerTypes
