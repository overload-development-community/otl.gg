declare namespace NewTeamDbTypes {
    type CreateRecordsets = {
        recordsets: [
            {
                NewTeamId: number
            }[]
        ]
    }

    type GetByPilotRecordsets = {
        recordsets: [
            {
                NewTeamId: number,
                Name: string,
                Tag: string
            }[]
        ]
    }
}

export = NewTeamDbTypes
