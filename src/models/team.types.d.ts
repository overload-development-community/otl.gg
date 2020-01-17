import DiscordJs from "discord.js"
import PlayerTypes from "./player.types"
import Team from "./team"

declare namespace TeamTypes {
    type GameLog = PlayerTypes.GameStats & PlayerTypes.CTFStats & {
        challengeId: number
        challengingTeamId: number
        challengingTeamName: string
        challengingTeamTag: string
        challengingTeamScore: number
        challengedTeamId: number
        challengedTeamName: string
        challengedTeamTag: string
        challengedTeamScore: number
        ratingChange: number
        map: string
        matchTime: Date
        gameType: string
        statTeamId: number
        statTeamName: string
        statTeamTag: string
        playerId: number
        name: string
    }

    type Standing = TeamRecord & {
        wins1: number
        losses1: number
        ties1: number
        wins2: number
        losses2: number
        ties2: number
        wins3: number
        losses3: number
        ties3: number
        winsMap: number
        lossesMap: number
        tiesMap: number
    }

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
        color?: string
    }

    type TeamStats = {
        records: (TeamRecord & {
            winsTA: number
            lossesTA: number
            tiesTA: number
            winsCTF: number
            lossesCTF: number
            tiesCTF: number
            winsHomeTA: number
            lossesHomeTA: number
            tiesHomeTA: number
            winsAwayTA: number
            lossesAwayTA: number
            tiesAwayTA: number
            winsNeutralTA: number
            lossesNeutralTA: number
            tiesNeutralTA: number
            winsHomeCTF: number
            lossesHomeCTF: number
            tiesHomeCTF: number
            winsAwayCTF: number
            lossesAwayCTF: number
            tiesAwayCTF: number
            winsNeutralCTF: number
            lossesNeutralCTF: number
            tiesNeutralCTF: number
            wins2v2TA: number
            losses2v2TA: number
            ties2v2TA: number
            wins3v3TA: number
            losses3v3TA: number
            ties3v3TA: number
            wins4v4TA: number
            losses4v4TA: number
            ties4v4TA: number
            wins2v2CTF: number
            losses2v2CTF: number
            ties2v2CTF: number
            wins3v3CTF: number
            losses3v3CTF: number
            ties3v3CTF: number
            wins4v4CTF: number
            losses4v4CTF: number
            ties4v4CTF: number
        })
        opponents: {
            teamId: number
            name: string
            tag: string
            wins: number
            losses: number
            ties: number
            gameType: string
        }[]
        maps: {
            map: string
            wins: number
            losses: number
            ties: number
            gameType: string
        }[]
        statsTA: (PlayerTypes.GameStats & {
            playerId: number
            name: string
            games: number
            gamesWithDamage: number
            deathsInGamesWithDamage: number
            overtimePeriods: number
            teamId: number
            teamName: string
            teamTag: string
            challengeId: number
            challengingTeamTag: string
            challengedTeamTag: string
            map: string
            matchTime: Date
            bestKills: number
            bestAssists: number
            bestDeaths: number
            bestDamage: number
        })[]
        statsCTF: (PlayerTypes.GameStats & PlayerTypes.CTFStats & {
            playerId: number
            name: string
            games: number
            overtimePeriods: number
            teamId: number
            teamName: string
            teamTag: string
            challengeId: number
            challengingTeamTag: string
            challengedTeamTag: string
            map: string
            matchTime: Date
            bestCaptures: number
            bestPickups: number
            bestCarrierKills: number
            bestReturns: number
            bestKills: number
            bestAssists: number
            bestDeaths: number
            bestDamage: number
        })[]

    }
    type TeamWithConfirmation = {
        team: Team
        confirm: string
    }
}

export = TeamTypes
