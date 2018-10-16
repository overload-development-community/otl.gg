DROP TABLE dbo.tblTeamHome
DROP TABLE dbo.tblTeamBan
DROP TABLE dbo.tblRoster
DROP TABLE dbo.tblRequest
DROP TABLE dbo.tblNewTeam
DROP TABLE dbo.tblLeadershipPenalty
DROP TABLE dbo.tblJoinBan
DROP TABLE dbo.tblInvite
DROP TABLE dbo.tblCaptainHistory
DROP TABLE dbo.tblTeam

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
    HistoryID INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblCaptainHistory_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DiscordId VARCHAR(24) NOT NULL,
    DateCaptain DATETIME NOT NULL CONSTRAINT DF_tblCaptainHistory_DateCaptain DEFAULT (getutcdate()),
    PRIMARY KEY (HistoryID ASC)
)

CREATE TABLE dbo.tblInvite (
    InviteId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblInvite_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DiscordId VARCHAR(24) NOT NULL,
    Name VARCHAR(64) NOT NULL,
    DateInvited DATETIME NOT NULL CONSTRAINT DF_tblInvite_DateInvited DEFAULT (getutcdate()),
    PRIMARY KEY (InviteId ASC)
)

CREATE TABLE dbo.tblJoinBan (
    BanId INT IDENTITY(1, 1) NOT NULL,
    DiscordId VARCHAR(24) NOT NULL,
    DateExpires DATETIME NOT NULL CONSTRAINT DF_tblJoinBan_DateExpires DEFAULT (dateadd(day,(28),getutcdate())),
    PRIMARY KEY (BanId ASC)
)

CREATE TABLE dbo.tblLeadershipPenalty (
    PenaltyId INT IDENTITY(1, 1) NOT NULL,
    DiscordId VARCHAR(24) NOT NULL,
    PRIMARY KEY (PenaltyId ASC)
)

CREATE TABLE dbo.tblNewTeam (
    NewTeamId INT IDENTITY(1, 1) NOT NULL,
    DiscordId VARCHAR(24) NOT NULL,
    Name VARCHAR(25) NULL,
    Tag VARCHAR(5) NULL,
    PRIMARY KEY (NewTeamId ASC)
)

CREATE TABLE dbo.tblRequest (
    RequestId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblRequest_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DiscordId VARCHAR(24) NOT NULL,
    Name VARCHAR(64) NOT NULL,
    DateRequested DATETIME NOT NULL CONSTRAINT DF_tblRequest_DateRequested DEFAULT (getutcdate()),
    PRIMARY KEY (RequestId ASC)
)

CREATE TABLE dbo.tblRoster (
    RosterId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblRoster_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DiscordId VARCHAR(24) NOT NULL,
    Name VARCHAR(64) NOT NULL,
    Captain BIT NOT NULL CONSTRAINT DF_tblRoster_Captain DEFAULT (0),
    Founder BIT NOT NULL CONSTRAINT DF_tblRoster_Founder DEFAULT (0),
    DateAdded DATETIME NOT NULL CONSTRAINT DF_tblRoster_DateAdded DEFAULT (getutcdate()),
    PRIMARY KEY (RosterId ASC)
)

CREATE TABLE dbo.tblTeamBan (
    BanId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblTeamBan_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    DiscordId VARCHAR(24) NOT NULL,
    DateExpires DATETIME NOT NULL CONSTRAINT DF_tblTeamBan_DateExpires DEFAULT (dateadd(day,(28),getutcdate())),
    PRIMARY KEY (BanId ASC)
)

CREATE TABLE dbo.tblTeamHome (
    HomeId INT IDENTITY(1, 1) NOT NULL,
    TeamId INT NOT NULL CONSTRAINT FK_tblTeamHome_TeamId_tblTeam_TeamId FOREIGN KEY (TeamId) REFERENCES dbo.tblTeam (TeamId),
    Number INT NOT NULL,
    Map VARCHAR(100) NOT NULL,
    PRIMARY KEY (HomeId ASC)
)
