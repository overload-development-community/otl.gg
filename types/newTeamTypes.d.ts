import DiscordJs from "discord.js"

declare namespace NewTeamTypes {
    type NewTeamData = {
        id: number
        member: DiscordJs.GuildMember
        name?: string
        tag?: string
    }
}

export = NewTeamTypes
