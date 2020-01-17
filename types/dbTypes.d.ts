declare namespace DbTypes {
    type EmptyRecordsets = {recordsets: [{}[]]}

    type Parameters = {
        [x: string]: {
            type: any
            value: any
        }
    }
}

export = DbTypes
