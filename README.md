# otl-bot

The Discord bot and website used for the Overload Teams League.  Visit the OTL at http://otl.gg.

# Version History

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
