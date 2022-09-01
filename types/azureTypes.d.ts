declare namespace AzureTypes {
    type Server = {
        resourceGroupName: string
        vmName: string
        ipAddress: string
        host: string
        location: string
        started?: boolean
        timeout?: NodeJS.Timeout
        warningTimeout?: NodeJS.Timeout
    }
}

export = AzureTypes
