declare namespace NameMapDbTypes {
    type GetAllRecordsets = {
        recordsets: [
            {
                PilotName: string
                DiscordId: string
            }[]
        ]
    }
}

export = NameMapDbTypes
