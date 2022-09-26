//    #    #                     #     #   #    #
//   # #   #                     #     #   #
//  #   #  # ##    ###   #   #  ####   #   #   ##     ###   #   #
//  #   #  ##  #  #   #  #   #   #      # #     #    #   #  #   #
//  #####  #   #  #   #  #   #   #      # #     #    #####  # # #
//  #   #  ##  #  #   #  #  ##   #  #   # #     #    #      # # #
//  #   #  # ##    ###    ## #    ##     #     ###    ###    # #
/**
 * A class that represents the about view.
 */
class AboutView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered about page template.
     * @returns {string} An HTML string of the about page.
     */
    static get() {
        return /* html */`
            <div id="about">
                <div class="section">About the Overload Teams League</div>
                <div class="text">
                    The Overload Teams League is a community of players who compete in the game <a href="https://playoverload.com" target="_blank">Overload</a>, a Six Degrees of Freedom First Person Shooter by Revival Productions.<br /><br />
                    To play, join the Discord server (link is at the bottom of the page), where you may join an existing team or create your own.  For rules specific to the league, please see the Rules section on the Discord server.
                </div>
                <div class="section">Available Maps</div>
                <div class="text">
                    For a complete list of maps available to play in the OTL, visit the <a href="/maplist">map list</a>.
                </div>
                <div class="section">Discord Bot Commands</div>
                <div class="text">
                    The following commands are available on the Discord server.  You may issue most commands in any channel, or in private messages to The Fourth Sovereign.  Don't worry, she won't try to absorb your consciousness into her own.
                </div>
                <div id="commands">
                    <div class="header">Command</div>
                    <div class="header">Description</div>
                    <div class="header">Examples</div>

                    <div class="section">OTL Azure Server Commands</div>

                    <div class="command">/servers</div>
                    <div>List all available servers and see their status.</div>
                    <div class="example">/servers</div>

                    <div class="command">/start &lt;server></div>
                    <div>Start the server by region.  The server will stay online until it is idle for 15 minutes.</div>
                    <div class="example">/start us-west</div>

                    <div class="command">/extend &lt;server></div>
                    <div>Extend a server by region.  This resets the idle timer to 15 minutes.</div>
                    <div class="example">/extend us-west</div>

                    <div class="section">Basic Commands</div>

                    <div class="command">/help</div>
                    <div>Get a link to this page.</div>
                    <div class="example">/help</div>

                    <div class="command">/version</div>
                    <div>Get the version of the bot.</div>
                    <div class="example">/version</div>

                    <div class="command">/website</div>
                    <div>Get a link to the website.</div>
                    <div class="example">/website</div>

                    <div class="command">/maplist</div>
                    <div>Get a link to the map list.</div>
                    <div class="example">/maplist</div>

                    <div class="command">/testing</div>
                    <div>Adds you to the publicly mentionable Testing Discord role.</div>
                    <div class="example">/testing</div>

                    <div class="command">/stoptesting</div>
                    <div>Removes you from the publicly mentionable Testing Discord role.</div>
                    <div class="example">/stoptesting</div>

                    <div class="command">/timezone [&lt;timezone>]</div>
                    <div>Changes your personal time zone.  See #timezone-faq on the Discord server for details.  Pass no parameters to clear your timezone.</div>
                    <div class="example">/timezone America/Los_Angeles<br />/timezone Europe/Berlin<br />/timezone</div>

                    <div class="command">/twitch &lt;channel></div>
                    <div>Sets or removes your Twitch channel.  Useful if you will be streaming your team's matches, or if you will be casting matches.  Note that this is automatically set if you have streamer mode setup to enable automatically in Discord.</div>
                    <div class="example">/twitch kantor<br />/twitch</div>

                    <div class="command">/homes [team]</div>
                    <div>Gets the current list of home levels for either your team or the specified team.</div>
                    <div class="example">/homes<br />/homes CF<br />/homes Cronus Frontier</div>

                    <div class="command">/neutrals [team]</div>
                    <div>Gets the current list of preferred neutral levels for either your team or the specified team.</div>
                    <div class="example">/neutrals<br />/neutrals CF<br />/neutrals Cronus Frontier</div>

                    <div class="command">/next</div>
                    <div>List the upcoming scheduled matches and events.</div>
                    <div class="example">/next</div>

                    <div class="command">/mynext</div>
                    <div>List the upcoming scheduled matches for your team.</div>
                    <div class="example">/next</div>

                    <div class="command">/matchtime &lt;challengeId></div>
                    <div>Gets the match time in your local time zone.</div>
                    <div class="example">/matchtime 12</div>

                    <div class="command">/cast &lt;challengeId></div>
                    <div>Indicates that you wish to cast a scheduled match that you are not playing in.  You can get the challenge ID from the #scheduled-matches channel on Discord.  You will join the challenge channel and be able to coordinate your efforts with both teams.</div>
                    <div class="example">/cast 1</div>

                    <div class="command">/uncast</div>
                    <div>You must use this command in a challenge channel you are casting a match for.  Indicates that you no longer wish to cast a scheduled match.</div>
                    <div class="example">/uncast</div>

                    <div class="command">/vod &lt;challengeId> &lt;url></div>
                    <div>Post a video on demand for a match that you cast.  Only works if you /cast the match.  The challengeId will be messaged to you by the bot upon the closure of the match.</div>
                    <div class="example">/vod 1 https://twitch.tv/videos/12345678</div>

                    <div class="command">/stats [&lt;pilot>]</div>
                    <div>Gets the current season stats for the player, or yourself if used without mentioning a pilot.</div>
                    <div class="example">/stats @Kantor<br />/stats</div>

                    <div class="command">/request &lt;team></div>
                    <div>Request to join a team.</div>
                    <div class="example">/request CF<br />/request Cronus Frontier</div>

                    <div class="command">/accept &lt;team></div>
                    <div>Accepts an invitation to join a team.</div>
                    <div class="example">/accept CF<br />/accept Cronus Frontier</div>

                    <div class="command">/leave</div>
                    <div>Leaves your current team.</div>
                    <div class="example">/leave</div>

                    <div class="section">Team Creation</div>

                    <div class="command">/createteam</div>
                    <div>Begins the process of creating a new team.  This will create a new channel where you can complete creation of your team.</div>
                    <div class="example">/createteam</div>

                    <div class="command">/name &lt;name></div>
                    <div>Names your team.  Must be between 6 and 25 characters.  Use only alpha-numeric characters and spaces.</div>
                    <div class="example">/name Cronus Frontier</div>

                    <div class="command">/tag &lt;tag></div>
                    <div>Creates a tag for that represents your team in short form.  Must be 5 characters or less.  Use only alpha-numeric characters.</div>
                    <div class="example">/tag CF</div>

                    <div class="command">/cancel</div>
                    <div>Cancels the process of creating a new team, removing the new team channel.</div>
                    <div class="example">/cancel</div>

                    <div class="command">/complete</div>
                    <div>Completes the process of creating a new team.  This will create four new channels for use by your new team.  There are two text channels and two voice channels, one of each for the team and one of each for the team's leadership.  Your team will also be officially added to the website.</div>
                    <div class="example">/complete</div>

                    <div class="section">Team Management</div>

                    <div class="command">/color<br />(normal|<wbr />light|<wbr />dark)<br />(red|<wbr />orange|<wbr />yellow|<wbr />lime|<wbr />green|<wbr />spring|<wbr />aqua|<wbr />azure|<wbr />blue|<wbr />violet|<wbr />purple|<wbr />pink)</div>
                    <div>Founder only.  Gives your team role a color on the Discord server.</div>
                    <div class="example">/color normal red<br />/color dark green</div>

                    <div class="command">/teamtimezone &lt;timezone></div>
                    <div>Founder only.  Changes your team's time zone.  See #timezone-faq on the Discord server for details.</div>
                    <div class="example">/teamtimezone America/Los_Angeles<br />/teamtimezone Europe/Berlin</div>

                    <div class="command">/addhome (CTF|<wbr />2v2|<wbr />3v3|<wbr />4v4+) &lt;map></div>
                    <div>Founder or Captain only.  Adds a home map for your team.  You must have 5 home maps set for each game type before you can issue a challenge.  You can have no more than 5 maps.</div>
                    <div class="example">/addhome 2v2 Vault<br />/addhome 4v4+ Syrinx<br />/addhome CTF Halcyon</div>

                    <div class="command">/removehome (CTF|<wbr />2v2|<wbr />3v3|<wbr />4v4+) &lt;map></div>
                    <div>Founder or Captain only.  Removes a home map for your team.  You must have 5 home maps set for each game type before you can issue a challenge.</div>
                    <div class="example">/removehome 2v2 Vault<br />/removehome 4v4+ Syrinx<br />/removehome CTF Halcyon</div>

                    <div class="command">/addneutral (CTF|<wbr />TA) &lt;map></div>
                    <div>Founder or Captain only.  Adds a neutral map for your team.  Having a neutral map list is optional.</div>
                    <div class="example">/addneutral TA Vault<br />/addneutral CTF Halcyon</div>

                    <div class="command">/removeneutral (CTF|<wbr />TA) &lt;map></div>
                    <div>Founder or Captain only.  Removes a neutral map for your team.</div>
                    <div class="example">/removeneutral TA Vault<br />/removeneutral CTF Halcyon</div>

                    <div class="command">/invite &lt;pilot></div>
                    <div>Founder or Captain only.  Invites a pilot to your team.  You must have 2 pilots on your team before you can issue a challenge.</div>
                    <div class="example">/invite @Kantor</div>

                    <div class="command">/remove &lt;pilot></div>
                    <div>Founder or Captain only.  Removes a pilot from the team, or cancels a request or invitation from the pilot.</div>
                    <div class="example">/remove @Kantor</div>

                    <div class="command">/addcaptain &lt;pilot></div>
                    <div>Founder only.  Adds a captain from your roster to your team, up to two captains.</div>
                    <div class="example">/addcaptain @Kantor</div>

                    <div class="command">/removecaptain &lt;pilot></div>
                    <div>Founder only.  Removes a captain from your team.  The player will remain on your roster.</div>
                    <div class="example">/removecaptain @Kantor</div>

                    <div class="command">/disband</div>
                    <div>Founder only.  Disbands your team.  Clears your roster (including you), removes your team channels, and sets your team as disbanded on the website.</div>
                    <div class="example">/disband</div>

                    <div class="command">/makefounder &lt;pilot></div>
                    <div>Founder only.  Transfers ownership of your team to another pilot.  You remain on the roster as a captain.  Note that if this puts your team above the team limit of 2 captains, you cannot issue this command until you remove another captain.</div>
                    <div class="example">/makefounder @Kantor</div>

                    <div class="command">/reinstate &lt;team></div>
                    <div>Reinstates a disbanded team.  You must have previously been a founder or captain of the team you are trying to reinstate.</div>
                    <div class="example">/reinstate CF<br />/reinstate Cronus Frontier</div>

                    <div class="command">/challenge &lt;team> (TA|<wbr />CTF)</div>
                    <div>Founder or Captain only.  Challenges another team to a match.  Creates a challenge channel where you can negotiate the match parameters with the other team.  You can optionally include the game type.</div>
                    <div class="example">/challenge CF<br />/challenge Cronus Frontier TA</div>

                    <div class="section">Challenges (Only allowed in challenge channels)</div>

                    <div class="command">/convert (&lt;date and time&gt;|<wbr />now)</div>
                    <div>Converts a date and time to everyone's time zone in the challenge channel.  If you omit the date or year, it will use what the date or year will be the next time it is the entered time.  Uses your personal time zone.</div>
                    <div class="example">/convert 3/14 3:00 PM<br />/convert Mar 14 15:00<br />/convert 3:00 PM<br />/convert now</div>

                    <div class="command">/matchtime</div>
                    <div>Gets the match time in your local time zone.</div>
                    <div class="example">/matchtime</div>

                    <div class="command">/deadline</div>
                    <div>Gets the clock deadilne in your local time zone.</div>
                    <div class="example">/deadline</div>

                    <div class="command">/streaming</div>
                    <div>Indicates that you will be streaming this match as you play it.  Note that this is automatically set if you have streamer mode setup to enable automatically in Discord and your stream game is set to Overload.  If you are casting your team's game, you will need to issue the /notcasting command.</div>
                    <div class="example">/streaming</div>

                    <div class="command">/notstreaming</div>
                    <div>Indicates that you will not be streaming this match as you play it.  This is the default, you only need to issue this command if you previously used the /streaming command but no longer will be streaming the match as you play.</div>
                    <div class="example">/notstreaming</div>

                    <div class="command">/pickmap (a|<wbr />b|<wbr />c|<wbr />d|<wbr />e)</div>
                    <div>Founder or Captain only.  Picks a map from the home map team's home maps and locks in that map for the match.  Cannot be used once the map is locked in.</div>
                    <div class="example">/pickmap b</div>

                    <div class="command">/suggestmap &lt;map></div>
                    <div>Founder or Captain only.  Suggests a neutral map.  The map cannot be one of the home map team's home maps.  Cannot be used once the map is locked in.</div>
                    <div class="example">/suggestmap Vault</div>

                    <div class="command">/suggestrandommap [(most|<wbr />least) &ltcount>]</div>
                    <div>Founder or Captain only.  Suggests a random map.  This will choose a map for the game type that's been played on the OTL before, but is not one of the home map team's home maps.  You can limit the random selection to the most or least popular maps in the league.</div>
                    <div class="example">/suggestrandommap<br />/suggestrandommap most 10<br />/suggestrandommap least 20</div>

                    <div class="command">/suggestteamsize (2|<wbr />3|<wbr />4|<wbr />5|<wbr />6|<wbr />7|<wbr />8)</div>
                    <div>Founder or Captain only.  Suggests the team size for the match.</div>
                    <div class="example">/suggestteamsize 3</div>

                    <div class="command">/suggesttype (TA|<wbr />CTF)</div>
                    <div>Founder or Captain only.  Suggests the game type for the match.</div>
                    <div class="example">/suggesttype CTF</div>

                    <div class="command">/suggesttime (&lt;date and time&gt;|<wbr />now)</div>
                    <div>Founder or Captain only.  Suggests a date and time for the challenge.  If you omit the date or year, it will use what the date or year will be the next time it is the entered time.  Uses your personal time zone.</div>
                    <div class="example">/suggesttime 3/14 3:00 PM<br />/suggesttime Mar 14 15:00<br />/suggesttime 3:00 PM<br />/suggesttime now</div>

                    <div class="command">/clock</div>
                    <div>Founder or Captain only.  Puts a challenge on the clock, giving both teams 28 days to schedule and play the match.  Limits apply, see #challenges on the Discord server for details.</div>
                    <div class="example">/clock</div>

                    <div class="command">/report &lt;tracker url></div>
                    <div>Founder or Captain only.  Reports the match by tracker URL, indicating that your team has not won the match.</div>
                    <div class="example">/report https://tracker.otl.gg/archive/12345</div>

                    <div class="command">/reportscore &lt;score1> &lt;score2></div>
                    <div>Founder or Captain only.  Reports the match by score, indicating that your team has not won the match.</div>
                    <div class="example">/reportscore 62 39<br />/reportscore 45 78<br />/reportscore 63 63</div>

                    <div class="command">/rematch</div>
                    <div>Founder or Captain only.  Requests a rematch.  Both teams must enter this command.  Once that happens, this will create a new challenge channel with normal parameters, except the team size will remain the same as the previous match and the match time will be set to start immediately.</div>
                    <div class="example">/rematch</div>
                </div>
            </div>
        `;
    }
}

if (typeof module !== "undefined") {
    module.exports = AboutView; // eslint-disable-line no-undef
}
