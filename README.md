# otl-bot

The Discord bot used for the Overload Teams League.

# Commands

Commands can work from any channel that the bot is in, or directly via DM to the bot.  The following commands are implemented:

## General

* `!help` - Get redirected to a help page with a list of commands for the bot.
* `!version` - The current version number of the bot.  Also a good way to make sure it's online.
* `!website` - A link to the OTL website.

## Team Creation

* `!createteam` - Begins the process of creating a team.  You will be put into a temporary channel where you can work out the details for your team before having it added to the league.
* `!name <name>` - Assigns a name to your team.  Must only contain letters, numbers, or spaces, and must be between 6 and 25 characters.
* `!tag <tag>` - Assigns a shorthand tag to your team.  Must only contain capital letters or numbers, and must be between 1 and 5 characters.
* `!cancel` - Cancels team creation.  This will remove your temporary channel.
* `!complete` - Completes team creation.  This will remove your temporary channel, create your team, make you the founder, and add your team to the league.  You will also get two new channels, your general team channel and a captains-only channel.  This will also open up further commands with which to manage your team.

## Team Management

* `!color [(light|dark)] (red|orange|yellow|green|aqua|blue|purple)` - Change the color of your team.  Your team members' names will be displayed in this color.
* `!addcaptain <pilot>` - Adds the specified pilot as a captain of your team.  The pilot must be already on your team.  This command gives them access to the captains-only channel as well as other roster commands.  You may only have 2 captains.
* `!removecaptain <pilot>` - Removes the specified pilot as a captain of your team.
* `!disband` - Disbands your team.  This will cancel all pending matches, reject all pending invites and requests, removes everyone from your team, and removes your team channels.  You or your captains can always use the reinstate command later to reinstate your team.
* `!makefounder <pilot>` - Makes the specified pilot the founder of your team.  You will remain a captain.  This command will fail if the it increases the number of captains to 3.
* `!reinstate <team>` - You may reinstate a team you were formerly a founder or captain of with this command.  This makes you the founder of an otherwise empty team.
* `!home (1|2|3) <map>` - Specifies a home level for your team.  You will not be able to make or receive challenges without all three home maps specified.

## Roster Management

* `!request <team>` - If you'd like to join a team that's already been created, this command will notify the team's leadership of your request.  To find out the status of the request, you must speak with that team's leadership.
* `!invite <pilot>` - If you'd like to invite a pilot to join your team, this command will perform that action.  It does not matter if the pilot has sent a request or not.  Note that you cannot invite pilots to your team to the point that your roster goes above 8 players.
* `!accept <team>` - If you've been invited to a team, this command will accept the invitation and add you to the team.  You will now be able to use the team channel to communicate with your team.
* `!leave` - This command will remove you from your current team.  Note that founders cannot use this command to leave, they must transfer ownership with the makefounder command.
* `!remove <pilot>` - This command serves three purposes.  First, it removes a pilot's request.  Second, it removes any pending invitation to the pilot.  Third, it removes a player from the team.  Note that captains cannot remove the founder or other captains.
