DROP TABLE dbo.tblTeamHome
DROP TABLE dbo.tblTeamBan
DROP TABLE dbo.tblRosterHistory
DROP TABLE dbo.tblRoster
DROP TABLE dbo.tblRequest
DROP TABLE dbo.tblNewTeam
DROP TABLE dbo.tblLeadershipPenalty
DROP TABLE dbo.tblJoinBan
DROP TABLE dbo.tblInvite
DROP TABLE dbo.tblCaptainHistory
DROP TABLE dbo.tblTeam
DROP TABLE dbo.tblPlayer

CREATE TABLE dbo.tblPlayer (
    PlayerId INT IDENTITY(1, 1) NOT NULL,
    DiscordId VARCHAR(24) NOT NULL,
    Name VARCHAR(64) NOT NULL,
    Timezone VARCHAR(50) NULL,
    DateAdded DATETIME NOT NULL CONSTRAINT DF_tblPlayer_DateAdded DEFAULT (getutcdate()),
    PRIMARY KEY (PlayerId ASC)
)

CREATE TABLE dbo.tblTeam (
    TeamId INT IDENTITY(1, 1) NOT NULL,
    Name VARCHAR(25) NOT NULL,
    Tag VARCHAR(5) NOT NULL,
    Disbanded BIT NOT NULL CONSTRAINT DF_tblTeam_Disbanded DEFAULT (0),
    Locked BIT NOT NULL CONSTRAINT DF_tblTeam_Locked DEFAULT(0),
    DateFounded DATETIME NOT NULL CONSTRAINT DF_tblTeam_DateFounded DEFAULT (getutcdate()),
    PRIMARY KEY (TeamId ASC)
)

CREATE TABLE dbo.tblCaptainHistory (
    HistoryId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblCaptainHistory_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    PlayerId INT NOT NULL CONSTRAINT FK_tblCaptainHistory_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DateCaptain DATETIME NOT NULL CONSTRAINT DF_tblCaptainHistory_DateCaptain DEFAULT (getutcdate()),
    PRIMARY KEY (HistoryId ASC)
)

CREATE TABLE dbo.tblInvite (
    InviteId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblInvite_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    PlayerId INT NOT NULL CONSTRAINT FK_tblInvite_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DateInvited DATETIME NOT NULL CONSTRAINT DF_tblInvite_DateInvited DEFAULT (getutcdate()),
    PRIMARY KEY (InviteId ASC)
)

CREATE TABLE dbo.tblJoinBan (
    BanId INT IDENTITY(1, 1) NOT NULL,
    PlayerId INT NOT NULL CONSTRAINT FK_tblJoinBan_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DateExpires DATETIME NOT NULL CONSTRAINT DF_tblJoinBan_DateExpires DEFAULT (dateadd(day, (28), getutcdate())),
    PRIMARY KEY (BanId ASC)
)

CREATE TABLE dbo.tblLeadershipPenalty (
    PenaltyId INT IDENTITY(1, 1) NOT NULL,
    PlayerId INT NOT NULL CONSTRAINT FK_tblLeadershipPenalty_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DatePenalized DATETIME NOT NULL CONSTRAINT DF_tblLeadershipPenalty DEFAULT (getutcdate()),
    PRIMARY KEY (PenaltyId ASC)
)

CREATE TABLE dbo.tblNewTeam (
    NewTeamId INT IDENTITY(1, 1) NOT NULL,
    PlayerId INT NOT NULL CONSTRAINT FK_tblNewTeam_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    Name VARCHAR(25) NULL,
    Tag VARCHAR(5) NULL,
    PRIMARY KEY (NewTeamId ASC)
)

CREATE TABLE dbo.tblRequest (
    RequestId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblRequest_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    PlayerId INT NOT NULL CONSTRAINT FK_tblRequest_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DateRequested DATETIME NOT NULL CONSTRAINT DF_tblRequest_DateRequested DEFAULT (getutcdate()),
    PRIMARY KEY (RequestId ASC)
)

CREATE TABLE dbo.tblRoster (
    RosterId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblRoster_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    PlayerId INT NOT NULL CONSTRAINT FK_tblRoster_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    Captain BIT NOT NULL CONSTRAINT DF_tblRoster_Captain DEFAULT (0),
    Founder BIT NOT NULL CONSTRAINT DF_tblRoster_Founder DEFAULT (0),
    DateAdded DATETIME NOT NULL CONSTRAINT DF_tblRoster_DateAdded DEFAULT (getutcdate()),
    PRIMARY KEY (RosterId ASC)
)

CREATE TABLE dbo.tblRosterHistory (
    HistoryId INT IDENTITY(1, 1) NOT NULL,
    PlayerId INT NOT NULL CONSTRAINT FK_tblRosterHistory_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    TeamId INT NOT NULL CONSTRAINT FK_tblRosterHistory_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DateJoined DATETIME NOT NULL CONSTRAINT DF_tblRosterHistory_DateJoined DEFAULT (getutcdate()),
    DateLeft DATETIME NULL,
    PRIMARY KEY (RosterId ASC)
)

CREATE TABLE dbo.tblTeamBan (
    BanId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblTeamBan_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    PlayerId INT NOT NULL CONSTRAINT FK_tblTeamBan_PlayerId_tblPlayer_PlayerId FOREIGN KEY (PlayerId) REFERENCES dbo.tblPlayer (PlayerId),
    DateExpires DATETIME NOT NULL CONSTRAINT DF_tblTeamBan_DateExpires DEFAULT (dateadd(day, (28), getutcdate())),
    PRIMARY KEY (BanId ASC)
)

CREATE TABLE dbo.tblTeamHome (
    HomeId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblTeamHome_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    Number INT NOT NULL,
    Map VARCHAR(100) NOT NULL,
    PRIMARY KEY (HomeId ASC)
)
