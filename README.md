# otl.gg

The Discord bot and website used for the Overload Teams League.  Visit the OTL at https://otl.gg.

# Version History

## v7.0.1 - 3/9/2022

* Allow a number of commands to be repeated.  Critial commands that would cause problems to be repeated are still not allowed.  If you find yourself in a situation where you need to repeat a command (for instance, your opponent typed `!confirm` when your team was supposed to), interject a dummy command, such as `!version`, in between two commands to allow the command you wish to repeat to go through.
* Fix bug when deleting Google calendar events.
* Package updates.

## v7.0.0 - 1/27/2022

New Features:

* New dark-ish mode.
* New rating system for OTL Season 7.  See Discord for details.
* Provisional ratings are now only italicized and not prorated, since the rating system does the proration already.
* Rosters can now be added to while locked, but new players cannot play in restricted challenges until the team's roster is unlocked.
* Discord timestamps are now shown instead of times across multiple timezones.
* `!convert` can be used anywhere.  Make sure you still have your own timezone set with `!timezone`, or this command won't work as expected.
* Challenges are now recorded in Google Calendar at https://otl.gg/calendar.
* Discord events are now added when challenge times are agreed to.
* Use Discord events instead of database for `!next` command.
* `!clock` no longer has a restriction of one clock per opponent per season.
* `!remove` is now allowed when rosters are locked.
* Servers are now recorded with the match when `!report` with a URL or `!addstats` is used to report a match.
* Added monsterball levels to https://otl.gg/maplist.
* Repository now called `otl.gg` instead of `otl-bot`.
* Scores added to #otlbot-alerts channel.
* New `!qualified` and `!notqualified` admin commands.  Non-qualified teams, which don't count towards a team's rating, are shown in red on the team page.
* New `!restricted` and `!unrestricted` admin commands to specify that a challenge is restricted and should not allow players added while a team's roster is locked to play in that challenge.

Bug Fixes:

* Pilot to Discord name mapping is now done in the database instead of Redis.
* Caching refactored to use a library, should prevent endless connections to the redis server.
* `!report` no longer can be performed by the winning team with a URL.
* Fixed a CSS error with diamonds in the map section of players page.
* Duplicated commands are no longer allowed, preventing multiple reports of the same game.
* `!clock` validation is now done in the correct order to prevent confusion.
* `!confirm` can no longer be done by two people simultaneously.
* `!forcemap` can no longer be used prior to the team size being set.
* `!forceteamsize` and `!suggestteamsize` now show specific error messages depending on the input.
* `!regen` command now logged properly.
* `!removemap` error message no longer causes a crash.
* Items cached are no longer saved 1000 times as long as necessary.
* Replaced html-minifier library with html-minifier-terser.

## v6.0.2 - 8/30/2021

* Package updates.

## v6.0.1 - 7/7/2021

* Teams are now called "Blue/Team 1" and "Orange/Team 2" to match updates in olmod 0.4.2.
* `!regen` command for admin to regenerate a pinned post for a challenge.

## v6.0.0 - 6/30/2021

* `!report` now shows the secondary notice immediately instead of after updating the pinned message.
* `!shenanigans` has been removed to avoid confusion.

## v5.0.2 - 3/31/2021

* Records page now filters by team.
* Fix bug with standings page.
* Fix bug with adding stats with a timestamp to ignore events after.
* Improve handling of timezones when a year isn't specified in a date.

## v5.0.1 - 3/17/2021

New Features:

* New date time zone conversion library is being used.  Please report any new bugs with `!suggesttime` or `!convert`.
* Date parsing now allows just a time in most places.  It will use the first date in the future when that time will be.  Good for scheduling matches for later in the day.
* New `!convert` command for challenge rooms, which lets you arbitrarily convert dates and times to the timezone of everyone in the channel.
* Net damage is now displayed as a statistic on the matches and match pages.
* Self-damage is now calculated as part of the total damage taken on the match page.
* `!addstats` now includes a timestamp parameter that will allow an administrator to remove all events that happened in a game after a certain point in time.

Bug Fixes:

* `!suggestrandommap` works again.
* Various issues with the cast pages have been resolved.
* Fixed unhandled exception when an invalid date without a year is given (ie: February 29).
* Hardened querystring handling on the standings page.
* `!pickmap` error message now correctly states there are five home maps.
* Fix `4v4+` as a valid home map type.
* Fixed confirmed team size not showing in the pinned post for challenges.
* Fixed a pretty bad memory leak with the website.
* Removed team rating from the team page when viewing all seasons.
* Removed a number of redundant messages when dealing with maps or captains.

## v5.0.0 - 12/31/2020

Support for Season 5 of the OTL.

## v4.0.6 - 9/21/2020

* Fax various bugs introduced with home maps in v4.0.4.
* Fix divide by zero errors for damage per death.

## v4.0.5 - 9/7/2020

* Channel topics for challenges and new teams have been removed, and replaced with a pinned message.
* Challenge channel pinned messages are now simplified, and will contain a checklist of things that are needed to do prior to the match.  Use https://otl.gg/about to see the full list of commands available.
* Twitch names and streaming designations will now automatically pick up from your Discord presence.  As long as your Twitch streams are detected by Discord, you should not need to use the `!twitch` and `!streaming` commands.  For those that prefer to not use Discord presence for their Twitch streams, but still wish to mark themselves as streaming the match, the commands can still be used.  Note that this is aggressive - there is a 30 minute check, if you're streaming Overload within 30 minutes of your match you will be set as streaming your match.
* New `!mynext` command that only shows the next matches for your team.
* Player page damage breakdown section now respects the Postseason selector.
* Fixed bug with rematch not showing available home maps to pick from.
* Fixed bug with challenge channel permissions.
* Fixed bug when adding stats from the wrong game.

## v4.0.4 - 9/3/2020

* Home maps have been overhauled.  Team anarchy is now split into 3 categories, 2v2, 3v3, and 4v4+, and the set of commands to manage home maps has changed.  See https://otl.gg/about for the new list of commands.
* Website will now show the home maps for each cateogry.
* New neutral maps feature.  Similar to home maps, but does not get divided into categories for Team Anarchy.  See https://otl.gg/about for the new list of commands.
* When challenging a team, if both teams have matching maps in their neutral map lists, those maps are displayed when the challenge is created.
* Teams are no longer required to have a stock map in their home map list.
* New ELO algorithm for CTF games.  Internally, when games finish with the winner under 10 points, the algorithm will add 1 point to each team until one team is at 10 points, and then calculate CTF ELO like before.
* Update game settings for olmod.
* Fix a number of bugs with malformed website requests.

## v4.0.3 - 7/30/2020

* Captains will no longer be left in a team's captains channel after they've left the team.
* Due to league growth and Discord category channel limits, the Challenges channel category will now cap at 40 challenges.  If any challenges go in that would put it above the cap, it will rename the Challenges channel to "Old Challenges" and create a brand new "Challenges" channel.
* `!pickmap` is now case insensitive.

## v4.0.2 - 7/23/2020

* Maps are now categorized into game types.  You cannot fly a map in game modes other than Team Anarchy if they were not intended for that game mode.  However, any map can be flown in team anarchy.
* `!report` now accepts a tracker URL instead of the score.  You can `!report` multiple games this way to combine stats from multiple games in the event of disconnections.
* `!report` using the score, the old way of reporting games, still works but will now wipe out any stats accumulated up to that point.  Use this as a workaround if you're having trouble using `!report` with the tracker URL parameter.  `!report 0 0` will reset both the score and the stats for the game, so use that if you need to start over using `!report` with the tracker URL parameter.
* Teams may now `!challenge` another team even if they have pending postseason challenges open.
* `!creatematch` now has a parameter to create a number of games, alternating the home team of each game but keeping the colors throughout the series.
* Add `!testing` and `!stoptesting` commands for users to join the publicly mentionalbe @Testers role.
* `!suggesttime` no longer defaults to GMT when using dashes in the date.  Technical note: The workaround is to replace the dashes with slashes, so if you were using dashes in your date previously keep this in mind.

## v4.0.1 - 7/11/2020

* Fix various website bugs with stats for players that switch teams.
* Commands that set topics no longer wait for the topic to be set, and will throw errors if they timeout.
* Fix bug with error logging.
* Fix HTML encoding in JavaScript.
* Various code cleanup.

## v4.0.0 - 6/30/2020

Support for Season 4 of the OTL.

### Bot

* Fixed bug with logging.
* Disallow challenging your own team.

### Website

* Restrict season numbers on the records and players pages to prevent abuse.

## v3.0.4 - 3/31/2020

* Added the `!suggestrandommap` command, see https://otl.gg/about for more details.
* Match page now orders players by number of captures instead of by KDA for the CTF game type.
* Added damage totals taken per player to the match page.
* Fixed the players page, the option to show active or all players should work again.
* Players page should no longer show players listed twice.
* All references to screenshots have been removed, in favor of providing tracker links.
* Closed games will now invalidate caches so that the home page and the standings page will refresh with current ratings.
* Fixed bug with an incomplete `!addstats` command inadvertantly changing the challenge's match time.
* ???

## v3.0.3 - 3/1/2020

* New `!capexempt` command allows the server owner to add players to teams beyond the roster cap.
* `!uncast` now works as expected.
* Various bugs with stats on the website are fixed.
* Colors for rematches will no longer change between matches.
* Captains cap has been removed.
* Added game settings for olmod to read.
* Fixed bug introduced in newer versions of Chrome having to do with countdowns.
* Fixed security bug in the og:url meta tag.
* Fixed a new instance of an unnormalized name on the website.
* Added support for adding stats from a game on a Russian server.

## v3.0.2 - 1/28/2020

* `!addstats` now will move the match time back if it was played earlier than the game was agreed upon.
* The font in the damage breakdown section of the players page is now more consistent on Windows.
* Records page now only counts season 3 and later for all time damage records.
* Links page now points to tracker.otl.gg instead of olproxy.otl.gg.
* Security fix with minification.

## v3.0.1 - 1/23/2020

### Bot:

* `!close` now displays stats for both teams, rather than for one team twice.
* Channel topics for challenges and teams are formatted correctly.
* CTF formats have been standardized across the bot and the website.  Example: `4 C/8 P (12 CK, 8 R), 1.250 KDA (40 K, 10 A, 40 D), 5000 Dmg`
* Join in progress games where players not part of the match accidentally joined are now ignored.
* `!suggesttype` and `!confirmtype` are now disabled for locked matches.
* `!addstats` will now notify on score change if it changed the score to a tie.
* `!creatematch` now allows being called without a game type, defaulting to Team Anarchy.
* `!creatematch` no longer checks validity of home map count for game types other than the type of match it is creating.

### Website:

* Players page no longer counts friendly fire damage towards damage stats.
* Removed option to display all or active pilots for postseason on players page.  This will now always display all players who competed in the postseason.
* Players page now only counts the game type selected when considering if a player was active.
* Cast page no longer lists players twice in a postseason game.
* Cast page now displays whether the last game the teams played was an overtime game.
* Matches page now shows dates if there is only one page of matches available.
* Records and player pages will now show the last season if the new season has no data yet.
* Various formatting fixes across the website related to damage and CTF stats.
* Improved mobile support.  If something doesn't look good on mobile devices, please file an issue.
* Replaced express-minify with custom combination and minification handlers using terser and csso with caching to Redis.

### Back end:

* Now using .d.ts files for complex types across JavaScript.  These can be found in the /types directory, and all existing .d.ts files have been moved to that directory.
* Various dependency upgrades.

## v3.0.0 - 12/31/2019

Support for Season 3 of the OTL.

### Bot:

* New and updated commands for CTF support.  See https://otl.gg/about.
* Allow bot to read from the tracker for all supported languages except Russian.
* Fixed `!removemap` command, it actually works now.
* Fixed `!addstats` command to correctly do reverse pilot lookups when the match was split across multiple games.

### Website:

* New CTF stats across the entire website.
* New damage stats across the website.  Players listing and records will only list damage stats for season 3 and later.
* There are some known formatting and mobile layout issues that will be addressed in a future version.
* Caching can now be disabled from the settings file.

## v2.1.1 - 12/1/2019

### Bot:

* Increased maximum team roster size to 10.
* New `!swapcolors` admin command for cases where teams played the wrong color for a match.
* `!stats` now works for players with URL entities in their name.
* Fixed `!addstats` to not crash when there's no attacker on a damage stat.
* When a team is founded, the team founder is removed from other teams' invites and requests.

### Website:

* Top KDA on the home page now requires players have played in 10% of their teams' games.
* Players page now defaults to active players, which means players who have played in 10% of their teams' games.
  * This 10% value will be monitored and adjusted as necessary.
* Rating changes on team page now show the correct operator for all games.
* Season selectors across the site have been fixed.
* Match page no longer shows an empty area instead of a score when the score is 0.
* Match page loads better on mobile.

## v2.1.0 - 11/16/2019

### Bot:

* Home team no longer takes postseason games into account when determining the home team.
* New `!addstats` command to add stats from the tracker.
* New `!homes (<team>)` command to list your team's homes or a specific team's homes.
* `!addstat` will now allow players not on the server.
* `!addstat` will no longer add a player twice to a game.
* New `!clearstats` command
* Games reported to #match-results will now link to the match page on the website.
* All references to home server have been removed.
* A player leaving the server who was scheduled to stream a match no longer crashes the challenge's topic.

### Website:

* Damage stats are now displayed on the match page for Season 2.
* Rating changes are now displayed on various pages throughout the site.
* Cast page no longer 404s.
* Cast page only shows a player's season stats.
* Cast page correctly shows the previous match, regardless if it had stats or not.
* Team page now includes games without player stats.
* Players page now shows the most recent team they were on in the season selected.
* Teams who did not play in a season do not show up in the standings for that season.
* A player in the top 5 KDA but not on a team will not crash the home page.
* URLs on the player page now respect name normalization.

### General:

* Redis is now more stable and won't error out the page if it's down.
* Improved logging.
* Improved caching.

## v2.0.3 - 8/10/2019

### Bot:

* 5 home maps are now required for challenges.
* Games with no stats are allowed to be closed.
* `!timezone` by itself will clear your timezone.  If you are on a team, your timezone will default to the team's timezone, otherwise it will default to America/Los_Angeles.  This also has the side effect of removing you from the listing of free agents.
* `!disband` no longer causes errors.
* You can now `!cast` an old match.  Use this for adding VODs to old matches.
* `!cleartime` now behaves as expected.
* Improved error handling.
* Many minor performance updates.

### Website:

* Rating no longer shown on postseason page, since ratings don't apply to postseason.
* Games with no stats will no longer awkwardly show the header for stats.

## v2.0.2 - 7/8/2019

### Bot:

* Switched logging from Discord to a website.
* Better cache invalidation when players join, leave, create, disband, or reinstate teams.

### Website:

* Records for matches now show the record for the season the match was/will be played in.
* Fix stats on team page showing all time stats regardless of the season selected.

## v2.0.1 - 7/4/2019

### Bot:

* New command `!maplist` to point to the webpage that lists all maps in play.
* Piots who leave a team while being a team captain now leave that team's captains channel as well.
* Display a better message when team creators mix up `!name` and `!tag`.
* `!lockteam` and `!unlockteam` now lock and unlock the specified team, not the person's team who issued the command.
* When the match time is forced in a challenge that's already been confirmed, notifications that the match is about to begin are no longer sent.
* Fix several instances of caching not taking advantage of promises.
* Many typos fixed across the bot, thanks @SiriusTR.
* `!version` points to the overload-development-community repository.
* Improved error handling.

### Website:

* Season selectors are fixed across the site.
* New map list page under About.
* Show the most recent season when going to the Matches, Players, and Records page.
* Pending matches no longer showes the season number, which doesn't make sense.
* Footer points to the overload-development-community repository.
* Remove /405 route.

## v2.0 - 7/1/2019

* Support matches up to 8 players per team.
* Improved error handling.

## v1.1.1 - 6/17/2019

### Bot:

* Improvements to the performance of the match notification system.
* Added `!vod` command for casters to record a video on demand.  Lists the video in the new #vods channel.
* Unvoiding a match with no match time set no longer causes an error.
* Bot no longer listens to server member changes on servers other than the OTL.
* Start Discord before the website.
* Improved error handling.

### Website:

* Much of the website data is now cached, with cache invalidations happening automatically upon certain events.
* Match page now properly normalizes names.
* Streamers are now noted on the match page.
* Casters and VoDs are now displayed on the match page.
* Dates now display on the matches page when paging.
* Dates on matches page now link to their match page.
* Display fixes on the standings page.

## v1.1 - 4/30/2019

### Bot:

* Refactored database code to be less monolithic.
* For commands where you enter a date and time, if you don't enter a year, it will no longer fail to recognize Daylight Savings Time properly in some cases.
* The `!home` command will now enforce the one stock map per team rule.
* Added `!overtime` command to implement overtime periods for games that use overtime.
* Improved error reporting.
* The `!addstat` command now shows KDA.
* Added `!lockteam` and `!unlockteam` commands to lock and unlock team rosters.
* Added `!addmap` and `!removemap` commands to add and remove maps from the allowed map pool.
* Fix to `!creatematch` not swapping team colors properly.
* Added `!next time` to show the next events and matches in the user's local time zone.
* Increase admin's `!forcetime` range to 180 days.
* Fix a bug where the bot will throw an error if a player leaves a server after playing a match but before it's closed.
* Fix a bug with issuing `!voidgame` and `!closegame` too rapidly in succession.

### Website:

* Refactored to a proper MVC pattern.
* Uses a more generic router.
* Now using morgan for logging.
* Improved display name sanitizing.
* Fix a bug with team size records being incorrect on the standings page.
* Overtime games are now noted on the website on the home, matches, and match page.
* Added a prominent link to Challonge.
* Added images for Burning Indika, Junebug, Keg Party, Mesa, Sub Rosa, and Turnstile.
* Added new links page.
* Website now uses SSL.
* Matches page now dynamically loads 10 matches at a time.
* Website now has a favicon.
* Added custom 404 and 500 pages.
* Team rosters now link to the player's page.
* New match page, linked to from everywhere on the site that shows a match.  The match's time serves as the link.

## v1.0.7 - 3/10/2019

### Bot:

* Events are now shown in the `!next` command.
* Maps can now be changed after they are set.
* Teams now get an announcements channel that everyone can read but only founders and captains can post in.
* Commands that take dates will no longer accept dates too far into the future (or past where applicable).
* Reordered the team colors in the challenge topic to match the order that they appear in game.
* Fix a bug with the KDA only showing for one team in the #match-results channel.

### Website:

* Many pages now have new or improved filtering based on the season and whether to show regular season or postseason stats.
* Added the best game for each map and opponent on the player page.
* Fixed link color in some less common browsers.
* Fixed website crash when viewing a player who is not on a team.

## v1.0.6 - 2/24/2019

### Bot:

* The Fourth Sovereign can now be invited to other servers.  Use https://discordapp.com/oauth2/authorize?client_id=469895441186816031&scope=bot&permissions=0 to invite the bot to your server.  Valid commands on servers outside the OTL are `!next` and `!stats`.
* Match reminders will now also remind teams of any unset parameters, and will remind players to set their `!streaming` flag.
* KDA now appears in the #match-results channel.
* Challenge IDs now won't spike into the 1000's when the server gets unexpectedly rebooted.
* `!stream` is now an alias for `!streaming`.
* `!retag` command errors have been fixed.

### Website:

* New Overdigit font for numbers.
* Matches that have been given a `!title` now have the title shown on the matches page.
* Player pages will now show a player's performance against each team and on each map played.
* KDA is now always to 3 decimal places.
* Fixed some places where the player name wasn't normalized.

## v1.0.5 - 2/5/2019

* Continued work on having better responsive design overall on the website.
* The game log on the team page is more readable.
* The sorting of the `!next` command now sorts from earliest match to the latest.
* The website will now direct traffic to the cast page if no one is setup to cast the match.
* `!adjudicate extend` can be used to simply clear the match time from a match that was missed, but now will display the correct message if the challenge was not clocked, and will update the channel's topic appropriately.

## v1.0.4 - 2/3/2019

* New `!stats` command to view your own stats and get a URL to your stats page.
* Fixed bug with `!rematch` command that was resetting the match times and team sizes of all challenges.
* Fixed crash on player stats page for players not on a team.
* Cast page no longer includes stats from games that aren't yet official.
* Records page no longer fails when there aren't categories available.

## v1.0.3 - 1/31/2019

### Bot:

* Added `!rematch` command from inside a challenge room to allow for immediate rematches.  This will create a new challenge between the same teams with the home server team swapped (or neutral if the prior challenge was neutral), the same team size, and a match time of now.  This is intended to allow for teams to play a series of matches in a row and requires a representative of BOTH teams to issue the command.  Teams should still use the `!challenge` command for other challenging purposes.
* Added `!next` command to list all pending matches.
* Updated the `!cast` command to allow `!cast next` to inform players what the next match available to cast is.  Note, you still need to use `!cast` with a challenge ID, this is just an informative command.
* Removed the requirement to confirm a `!challenge`.
* New teams' founders will now get permissions for at-everyone and at-here and to delete and pin messages in their team channels, and captains will now get permissions for at-everyone and at-here.  I will make a pass to allow this for existing teams shortly after release.
* Dates no longer require a year, and will assume the first occurrence of that date in the future.
* Dates can be replaced with the keyword "now", allowing for immediate scheduling.
* The 30 minute warning now mentions the correct amount of time remaining until a match when a match is scheduled inside 30 minutes.
* URLs no longer will have exclamation points at the end of them, so the exclamation point won't be part of the URL.

### Website:

* Fixed various website CSS bugs, including making them a bit more mobile friendly.  This probably still has a long way to go, so if you see any issues on mobile, please post in #dev or file an issue on GitHub with details.
* New records and player pages.
* Matches page now has countdowns for pending matches.
* Matches page redesigned and paginated.
* Players page now shows league averages, along with a line visually indicating where that average lies.
* Fixed the Best Game stats for teams.
* Normalized names for best performer on the Cast page.
* Technical update to allow hot-swapping web pages.

## v1.0.2 - 1/10/2019

* Bug fixes, especially concerning mobile devices.
* New page for casters to easily cast matches between teams.
* New #scheduled-matches page that lists matches as they are scheduled.
* Updates to `!cast`, `!matchtime`, and `!countdown` commands to make it easier to follow matches.

## v1.0.1 - 1/9/2019

* Bug fixes.
* Significantly more stats on the website.

## v1.0 - 1/1/2019

* Initial release.
