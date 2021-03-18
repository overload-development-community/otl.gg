import DiscordJs from "discord.js"

declare namespace PlayerTypes {
    type CareerData = {
        player: {
            name: string
            twitchName: string
            timezone: string
            teamId: number
            tag: string
            teamName: string
        }
        career: (GameStats & CTFStats & {
            season: number
            postseason: boolean
            teamId: number
            tag: string
            teamName: string
            games: number
            gamesWithDamage: number
            deathsInGamesWithDamage: number
            overtimePeriods: number
        })[]
        careerTeams: (GameStats & CTFStats & {
            teamId: number
            tag: string
            teamName: string
            games: number
            gamesWithDamage: number
            deathsInGamesWithDamage: number
            overtimePeriods: number
        })[]
        opponents: (KDAStats & CTFStats & {
            teamId: number
            tag: string
            teamName: string
            games: number
            overtimePeriods: number
            challengeId: number
            challengingTeamTag: string
            challengedTeamTag: string
            bestMatchTime: Date
            bestMap: string
            bestCaptures: number
            bestPickups: number
            bestCarrierKills: number
            bestReturns: number
            bestKills: number
            bestAssists: number
            bestDeaths: number
            bestDamage: number
        })[]
        maps: (KDAStats & CTFStats & {
            map: string
            games: number
            overtimePeriods: number
            challengeId: number
            challengingTeamTag: string
            challengedTeamTag: string
            bestOpponentTeamId: number
            bestOpponentTag: string
            bestOpponentTeamName: string
            bestMatchTime: Date
            bestCaptures: number
            bestPickups: number
            bestCarrierKills: number
            bestReturns: number
            bestKills: number
            bestAssists: number
            bestDeaths: number
            bestDamage: number
        })[]
        damage: {
            [x: string]: number
        }
    }

    type CTFStats = {
        captures: number
        pickups: number
        carrierKills: number
        returns: number
    }

    type FreeAgent = {
        playerId: number
        name: string
        discordId: string
        timezone: string
    }

    type GameLog = {
        player: {
            name: string
            teamId: number
            tag: string
            teamName: string
        }
        matches: (GameStats & CTFStats & {
            challengeId: number
            challengingTeamTag: string
            challengedTeamTag: string
            teamId: number
            tag: string
            name: string
            overtimePeriods: number
            opponentTeamId: number
            opponentTag: string
            opponentName: string
            teamScore: number
            opponentScore: number
            ratingChange: number
            teamSize: number
            matchTime: Date
            map: string
            gameType: string
        })[]
    }

    type GameLogData = GameLog & {
        seasons: number[]
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
        netDamage?: number
    }

    type KDAStats = {
        kills: number
        assists: number
        deaths: number
    }

    type PilotWithConfirmation = {
        pilot: DiscordJs.GuildMember,
        confirm: string
    }

    type PlayerKDAStats = {
        playerId: number
        name: string
        teamId: number
        teamName: string
        tag: string
        disbanded: boolean
        locked: boolean
        kda: number
    }

    type PlayerStats = {
        ta: GameStats & {
            games: number
            deathsInGamesWithDamage: number
        }
        ctf: GameStats & CTFStats & {
            games: number
        }
        damage: {
            [x: string]: number
        }
        playerId: number
        name: string
        tag: string
        season: number
    }

    type SeasonStats = {
        playerId: number
        name: string
        teamId: number
        teamName: string
        tag: string
        disbanded: boolean
        locked: boolean
        avgCaptures: number
        avgPickups: number
        avgCarrierKills: number
        avgReturns: number
        avgKills: number
        avgAssists: number
        avgDeaths: number
        avgDamagePerGame: number
        avgDamagePerDeath: number
        kda: number
    }

    type UserOrGuildMember = DiscordJs.GuildMember|DiscordJs.User

    type WeaponStats = {
        weapon: string
        damage: number
    }
}

export = PlayerTypes
