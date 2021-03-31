import Challenge from "../src/models/challenge"
import ChallengeTypes from "./challengeTypes"
import DiscordJs from "discord.js"
import PlayerTypes from "./playerTypes"
import Team from "../src/models/team"
import TeamTypes from "./teamTypes"
import Teams from "../web/includes/teams"
import MatchTypes from "./matchTypes"
 
declare namespace ViewTypes {
    type CastViewParameters = {
        challenge: Challenge
        castData: ChallengeTypes.CastDataChallenge
        challengingTeamRoster: ChallengeTypes.CastDataRoster[]
        challengedTeamRoster: ChallengeTypes.CastDataRoster[]
    }

    type HomeViewParameters = {
        standings: TeamTypes.Standing[]
        stats: PlayerTypes.PlayerKDAStats[]
        matches: MatchTypes.CurrentMatch[]
        news: DiscordJs.Message[]
        teams: Teams
    }

    type IndexViewParameters = {
        head: string
        html: string
        protocol: string
        host: string
        originalUrl: string
        year: number
        version: string
    }

    type MatchViewParameters = {
        challenge: Challenge
        details: ChallengeTypes.TeamDetailsData
        weapons: string[]
        gameTypeName: string
    }

    type MatchesViewParameters = {
        seasonList: number[]
        season: number
        pending: MatchTypes.PendingMatch[]
        totalCompleted: number
        completed: MatchTypes.ConfirmedMatch[]
        matchesPerPage: number
    }

    type PlayerViewParameters = PlayerTypes.CareerData & {
        playerId: number
        totals: PlayerTypes.GameStats & PlayerTypes.CTFStats & {
            games: number
            gamesWithDamage: number
            deathsInGamesWithDamage: number
            overtimePeriods: number
            primaries: number
            secondaries: number
            totalDamage: number
        }
        seasonList: number[]
        season: number
        postseason: boolean
        gameType: string
        teams: Teams
    }

    type PlayerGameLogViewParameters = PlayerTypes.GameLog & {
        playerId: number
        seasonList: number[]
        season: number
        postseason: boolean
        teams: Teams
    }

    type PlayersViewParameters = {
        freeAgents: PlayerTypes.FreeAgent[]
        seasonList: number[]
        stats: PlayerTypes.SeasonStats[]
        averages: PlayerTypes.KDAStats & PlayerTypes.CTFStats & {
            kda: number
            damagePerGame: number
            damagePerDeath: number
        }
        season: number
        postseason: boolean
        gameType: string
        gameTypeName: string
        all: boolean
        teams: Teams
    }

    type RecordsViewParameters = {
        seasonList: number[]
        records: {
            [x: string]: PlayerTypes.GameRecord[]
        }
        season: number
        postseason: boolean
        gameType: string
        recordType: string
        gameTypeName: string
        teamId: number
        teams: Teams
        teamList: TeamTypes.Standing[]
    }

    type StandingsViewParameters = {
        seasonList: number[]
        maps: string[]
        standings: TeamTypes.Standing[]
        season: number
        records: string
        recordsTitle: string
        records1: string
        records2: string
        records3: string
        map: string
        teams: Teams
    }

    type TeamViewParameters = {
        pageTeam: Team
        teamInfo: TeamTypes.TeamInfo
        timezone: string
        seasonList: number[]
        teamData: TeamTypes.TeamStats
        season: number
        postseason: boolean
        teams: Teams
    }

    type TeamGameLogViewParameters = {
        pageTeam: Team
        seasonList: number[]
        matches: TeamTypes.GameLog[]
        season: number
        postseason: boolean
        teams: Teams
    }
}

export = ViewTypes
