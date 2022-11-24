import PlayerDbTypes from "./playerDbTypes"

declare namespace TeamDbTypes {
    type AddPilotRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type CreateRecordsets = {
        recordsets: [
            {
                TeamId: number
                PlayerId: number
            }[]
        ]
    }

    type DisbandRecordsets = {
        recordsets: [
            {
                ChallengeId: number
            }[],
            {
                PlayerId: number
            }[]
        ]
    }

    type GetAllActiveRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Locked: boolean
            }[]
        ]
    }

    type GetByIdRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Locked: boolean
            }[]
        ]
    }

    type GetByNameOrTagRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Disbanded: boolean
                Locked: boolean
            }[]
        ]
    }

    type GetByPilotRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                IsFounder: boolean
                Locked: boolean
            }[]
        ]
    }

    type GetClockedChallengeCountRecordsets = {
        recordsets: [
            {
                ClockedChallenges: number
            }[]
        ]
    }

    type GetDataRecordsets = {
        recordsets: [
            {
                Season: number
                Award: string
                Description: string
            }[],
            (TeamData & {
                WinsTA: number
                LossesTA: number
                TiesTA: number
                WinsCTF: number
                LossesCTF: number
                TiesCTF: number
                WinsHomeTA: number
                LossesHomeTA: number
                TiesHomeTA: number
                WinsAwayTA: number
                LossesAwayTA: number
                TiesAwayTA: number
                WinsNeutralTA: number
                LossesNeutralTA: number
                TiesNeutralTA: number
                WinsHomeCTF: number
                LossesHomeCTF: number
                TiesHomeCTF: number
                WinsAwayCTF: number
                LossesAwayCTF: number
                TiesAwayCTF: number
                WinsNeutralCTF: number
                LossesNeutralCTF: number
                TiesNeutralCTF: number
                Wins2v2TA: number
                Losses2v2TA: number
                Ties2v2TA: number
                Wins3v3TA: number
                Losses3v3TA: number
                Ties3v3TA: number
                Wins4v4TA: number
                Losses4v4TA: number
                Ties4v4TA: number
                Wins2v2CTF: number
                Losses2v2CTF: number
                Ties2v2CTF: number
                Wins3v3CTF: number
                Losses3v3CTF: number
                Ties3v3CTF: number
                Wins4v4CTF: number
                Losses4v4CTF: number
                Ties4v4CTF: number
            })[],
            {   TeamId: number
                Name: string
                Tag: string
                Wins: number
                Losses: number
                Ties: number
                GameType: string
            }[],
            {   TeamId: number
                Name: string
                Tag: string
                Rating: number
                Games: number
                Qualified: boolean
            }[],
            {
                Map: string
                Wins: number
                Losses: number
                Ties: number
                GameType: string
            }[],
            (PlayerDbTypes.GameStats & {
                PlayerId: number
                Name: string
                Games: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
                TeamId: number
                TeamName: string
                TeamTag: string
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            })[],
            (PlayerDbTypes.GameStats & PlayerDbTypes.CTFStats & {
                PlayerId: number
                Name: string
                Games: number
                OvertimePeriods: number
                TeamId: number
                TeamName: string
                TeamTag: string
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            })[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetDataForCTFMapRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Wins: number
                Losses: number
                Ties: number
                WinsHome: number
                LossesHome: number
                TiesHome: number
                WinsAway: number
                LossesAway: number
                TiesAway: number
                WinsNeutral: number
                LossesNeutral: number
                TiesNeutral: number
                Wins2v2: number
                Losses2v2: number
                Ties2v2: number
                Wins3v3: number
                Losses3v3: number
                Ties3v3: number
                Wins4v4: number
                Losses4v4: number
                Ties4v4: number
            }[],
            {
                TeamId: number
                Name: string
                Tag: string
                Wins: number
                Losses: number
                Ties: number
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Captures: number
                Pickups: number
                CarrierKills: number
                Returns: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                OvertimePeriods: number
                TeamId: number
                TeamName: string
                TeamTag: string
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            (PlayerDbTypes.GameStats & PlayerDbTypes.CTFStats & {
                ChallengeId: number
                ChallengingTeamId: number
                ChallengingTeamName: string
                ChallengingTeamTag: string
                ChallengingTeamScore: number
                ChallengedTeamId: number
                ChallengedTeamName: string
                ChallengedTeamTag: string
                ChallengedTeamScore: number
                RatingChange: number
                Map: string
                MatchTime: Date
                GameType: string
                StatTeamId: number
                StatTeamName: string
                StatTeamTag: string
                PlayerId: number
                Name: string
            })[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetDataForTAMapRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Wins: number
                Losses: number
                Ties: number
                WinsHome: number
                LossesHome: number
                TiesHome: number
                WinsAway: number
                LossesAway: number
                TiesAway: number
                WinsNeutral: number
                LossesNeutral: number
                TiesNeutral: number
                Wins2v2: number
                Losses2v2: number
                Ties2v2: number
                Wins3v3: number
                Losses3v3: number
                Ties3v3: number
                Wins4v4: number
                Losses4v4: number
                Ties4v4: number
            }[],
            {
                TeamId: number
                Name: string
                Tag: string
                Wins: number
                Losses: number
                Ties: number
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
                TeamId: number
                TeamName: string
                TeamTag: string
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            (PlayerDbTypes.GameStats & PlayerDbTypes.CTFStats & {
                ChallengeId: number
                ChallengingTeamId: number
                ChallengingTeamName: string
                ChallengingTeamTag: string
                ChallengingTeamScore: number
                ChallengedTeamId: number
                ChallengedTeamName: string
                ChallengedTeamTag: string
                ChallengedTeamScore: number
                RatingChange: number
                Map: string
                MatchTime: Date
                GameType: string
                StatTeamId: number
                StatTeamName: string
                StatTeamTag: string
                PlayerId: number
                Name: string
            })[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetGameLogRecordsets = {
        recordsets: [
            (PlayerDbTypes.GameStats & PlayerDbTypes.CTFStats & {
                ChallengeId: number
                ChallengingTeamId: number
                ChallengingTeamName: string
                ChallengingTeamTag: string
                ChallengingTeamScore: number
                ChallengedTeamId: number
                ChallengedTeamName: string
                ChallengedTeamTag: string
                ChallengedTeamScore: number
                RatingChange: number
                Map: string
                MatchTime: Date
                GameType: string
                StatTeamId: number
                StatTeamName: string
                StatTeamTag: string
                PlayerId: number
                Name: string
            })[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetHeadToHeadStatsRecordsets = {
        recordsets: [
            {
                Team1Wins: number
                Team2Wins: number
                Ties: number
                Team1WinsTA: number
                Team2WinsTA: number
                TiesTA: number
                Team1WinsTATeam1Home: number
                Team2WinsTATeam1Home: number
                TiesTATeam1Home: number
                Team1WinsTATeam2Home: number
                Team2WinsTATeam2Home: number
                TiesTATeam2Home: number
                Team1WinsTANeutral: number
                Team2WinsTANeutral: number
                TiesTANeutral: number
                Team1WinsTA2v2: number
                Team2WinsTA2v2: number
                TiesTA2v2: number
                Team1WinsTA3v3: number
                Team2WinsTA3v3: number
                TiesTA3v3: number
                Team1WinsTA4v4: number
                Team2WinsTA4v4: number
                TiesTA4v4: number
                Team1WinsCTF: number
                Team2WinsCTF: number
                TiesCTF: number
                Team1WinsCTFTeam1Home: number
                Team2WinsCTFTeam1Home: number
                TiesCTFTeam1Home: number
                Team1WinsCTFTeam2Home: number
                Team2WinsCTFTeam2Home: number
                TiesCTFTeam2Home: number
                Team1WinsCTFNeutral: number
                Team2WinsCTFNeutral: number
                TiesCTFNeutral: number
                Team1WinsCTF2v2: number
                Team2WinsCTF2v2: number
                TiesCTF2v2: number
                Team1WinsCTF3v3: number
                Team2WinsCTF3v3: number
                TiesCTF3v3: number
                Team1WinsCTF4v4: number
                Team2WinsCTF4v4: number
                TiesCTF4v4: number
            }[],
            {
                Team1Wins: number
                Team2Wins: number
                Ties: number
                Map: string
                GameType: string
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Captures: number
                Pickups: number
                CarrierKills: number
                Returns: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            {
                PlayerId: number
                Name: string
                Games: number
                Captures: number
                Pickups: number
                CarrierKills: number
                Returns: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                Map: string
                MatchTime: Date
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            }[],
            {
                ChallengeId: number
                ChallengingTeamId: number
                ChallengingTeamName: string
                ChallengingTeamTag: string
                ChallengingTeamScore: number
                ChallengedTeamId: number
                ChallengedTeamName: string
                ChallengedTeamTag: string
                ChallengedTeamScore: number
                RatingChange: number
                Map: string
                MatchTime: Date
                GameType: string
                StatTeamId: number
                StatTeamName: string
                StatTeamTag: string
                PlayerId: number
                Name: string
                Captures: number
                Pickups: number
                CarrierKills: number
                Returns: number
                Kills: number
                Assists: number
                Deaths: number
                Damage: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetHomeMapsRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type GetHomeMapsByTypeRecordsets = {
        recordsets: [
            {
                Map: string
                GameType: string
            }[]
        ]
    }

    type GetInfoRecordsets = {
        recordsets: [
            {
                Map: string
                GameType: string
            }[],
            {
                PlayerId: number
                Name: string
                Captain: boolean
                Founder: boolean
            }[],
            {
                Name: string
                DateRequested: Date
            }[],
            {
                Name: string
                DateInvited: Date
            }[],
            {
                PenaltiesRemaining: number
            }[]
        ]
    }

    type GetNeutralMapsRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type GetNeutralMapsByTypeRecordsets = {
        recordsets: [
            {
                Map: string
                GameType: string
            }[]
        ]
    }

    type GetNextClockDateRecordsets = {
        recordsets: [
            {
                NextDate: Date
            }[]
        ]
    }

    type GetPilotAndInvitedCountRecordsets = {
        recordsets: [
            {
                Members: number
            }[]
        ]
    }

    type GetPilotCountRecordsets = {
        recordsets: [
            {
                Members: number
            }[]
        ]
    }

    type GetSeasonStandingsRecordsets = {
        recordsets: [
            (TeamData & {
                League: string
                Wins1: number
                Losses1: number
                Ties1: number
                Wins2: number
                Losses2: number
                Ties2: number
                Wins3: number
                Losses3: number
                Ties3: number
                WinsMap?: number
                LossesMap?: number
                TiesMap?: number
            })[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetTimezoneRecordsets = {
        recordsets: [
            {
                Timezone: string
            }[]
        ]
    }

    type HasClockedTeamThisSeasonRecordsets = {
        recordsets: [
            {
                HasClocked: boolean
            }[]
        ]
    }

    type HasPenaltiesRecordsets = {
        recordsets: [
            {
                HasPenalties: boolean
            }[]
        ]
    }

    type NameExistsRecordsets = {
        recordsets: [
            {
                Name: number
            }[]
        ]
    }

    type ReinstateRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type RemovePilotRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type TagExistsRecordsets = {
        recordsets: [
            {
                Tag: number
            }[]
        ]
    }

    type TeamData = {
        TeamId: number
        Name: string
        Tag: string
        Disbanded: boolean
        Locked: boolean
        Rating: number
        Wins: number
        Losses: number
        Ties: number
    }
}

export = TeamDbTypes
