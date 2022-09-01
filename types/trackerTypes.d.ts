declare namespace TrackerTypes {
    type BrowserAPIResponse = {
        body: {
            server: {
                ip: string
                name: string
                serverNotes: string
                lastSeen: string // Date
                online: boolean
                version: string
            }
            game?: Game
        }[]
    }

    type Game = {
        currentPlayers: number
        maxPlayers: number
        matchLength: number
        mapName: string
        mode: string
        jip: boolean
        hasPassword: boolean
        matchNotes: string
        inLobby: boolean
        creator: string
    }

    type GameAPIResponse = {
        body: {
            ip: string
            settings: Settings
            start: string // Date
            end: string // Date,
            players: Player[]
            kills: {
                time: number
                attacker: string
                attackerTeam: string
                defender: string
                defenderTeam: string
                assisted: string
                assistedTeam: string
                weapon: string
            }[]
            goals: {
                time: number
                scorer: string
                scorerTeam: string
                assisted: string
                blunder: boolean
            }[]
            flagStats: {
                time: number
                event: string
                scorer: string
                scorerTeam: string
            }[]
            damage: {
                attacker: string
                defender: string
                weapon: string
                damage: number
            }[]
            teamScore: {
                [x: string]: number
            }
            lastUpdate: string // Date
            teamChanges: {
                time: number
                playerName: string
                previousTeam: string
                currentTeam: string
            }[]
        }
    }

    type GameListAPIResponse = {
        body: {
            games: {
                id: number
                ip: string
                data: {
                    settings: Settings
                    players: Player[]
                    teamScore: {
                        [x: string]: number
                    }
                }
                date: string // Date
                server: Server
            }[]
        }
    }

    type Player = {
        name: string
        team: string
        kills: number
        assists: number
        deaths: number
        goals: number
        goalAssists: number
        blunders: number
        returns: number
        pickups: number
        captures: number
        carrierKills: number
        connected: boolean
        disconnected: boolean
    }

    type Server = {
        ip: string
        name: string
        notes: string
        version: string
        lastSeen: string // Date
    }

    type Settings = {
        creator: string
        forceModifier1: string
        forceModifier2: string
        forceMissile1: string
        forceMissile2: string
        forceWeapon1: string
        forceWeapon2: string
        forceLoadout: string
        powerupFilterBitmask: number
        powerupBigSpawn: string
        powerupInitial: string
        turnSpeedLimit: string
        powerupSpawn: string
        friendlyFire: boolean
        matchMode: string
        maxPlayers: number
        showEnemyNames: string
        timeLimit: number
        scoreLimit: number
        respawnTimeSeconds: number
        respawnShieldTimeSeconds: number
        level: string
        joinInProgress: boolean
        rearViewAllowed: boolean
        teamCount: number
        players: string[]
        hasPassword: boolean
        matchNotes: string
        classicSpawnsEnabled: boolean
        ctfCarrierBoostEnabled: boolean
        suddenDeath: boolean
        name: string
        type: string
        start: string // Date
        time: number
        server: Server
        condition: string
        countdown: number
    }
}

export = TrackerTypes
