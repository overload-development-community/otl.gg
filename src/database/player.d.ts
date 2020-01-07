import Player from "./player";

type GameRecord = {
    teamSize: number,
    record: number,
    playerId?: number,
    name?: string,
    teamId: number,
    tag: string,
    teamName: string,
    opponentTeamId: number,
    opponentTag: string,
    opponentTeamName: string,
    challengeId: number,
    matchTime: Date,
    map: string,
    overtimePeriods: number
};
