import NewTeam from "./src/models/newTeam"
import Team from "./src/models/team"

declare module "discord.js" {
    /**
     * Correction to discord.js's index.d.ts file, the parameters of this function were updated between 11.3.0 and the latest version.
     */
    interface Role {
		setColor(color: ColorResolvable, reason?: string): Promise<Role>
    }

    /**
     * Correction to discord.js's index.d.ts file to add a new property to ChannelData.
     */
	type ChannelDataWithReason = {
		type?: "category" | "text" | "voice" | "news" | "store"
		name?: string
		position?: number
		topic?: string
		nsfw?: boolean
		bitrate?: number
		userLimit?: number
		parent?: ChannelResolvable
		permissionOverwrites?: PermissionOverwrites[] | ChannelCreationOverwrites[]
        rateLimitPerUser?: number
        reason?: string
    }
    interface Guild {
        createChannel(name: string, options?: ChannelDataWithReason): Promise<CategoryChannel | TextChannel | VoiceChannel>
    }
}
