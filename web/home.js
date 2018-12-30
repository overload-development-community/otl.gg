const {minify} = require("html-minifier"),

    Common = require("./common"),

    settings = require("../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   #   #
//   #   #
//   #   #   ###   ## #    ###
//   #####  #   #  # # #  #   #
//   #   #  #   #  # # #  #####
//   #   #  #   #  # # #  #
//   #   #   ###   #   #   ###
/**
 * A class that represents the home page.
 */
class Home {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Processes the request.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @returns {void}
     */
    static get(req, res) {
        const html = Common.page(/* html */`
            <div id="matches">
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="score1 winner">
                        219
                    </div>
                    <div class="score2">
                        74
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("12/28/2018 6:09 PM PST")));</script>
                    </div>
                </div>
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="score1 winner">
                        219
                    </div>
                    <div class="score2">
                        74
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("12/29/2018 6:09 PM PST")));</script>
                    </div>
                </div>
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="record1">
                        12-3
                    </div>
                    <div class="record2">
                        5-18
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("12/30/2018 6:09 PM PST")));</script>
                    </div>
                </div>
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="record1">
                        12-3
                    </div>
                    <div class="record2">
                        5-18
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("12/31/2018 6:09 PM PST")));</script>
                    </div>
                </div>
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="record1">
                        12-3
                    </div>
                    <div class="record2">
                        5-18
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("1/1/2019 6:09 PM PST")));</script>
                    </div>
                </div>
                <div class="match">
                    <div class="team1">
                        <div class="diamond" style="background-color: red;"></div> CF
                    </div>
                    <div class="team2">
                        <div class="diamond-empty"></div> JOA
                    </div>
                    <div class="record1">
                        12-3
                    </div>
                    <div class="record2">
                        5-18
                    </div>
                    <div class="date">
                        <script>document.write(formatDate(new Date("1/2/2019 6:09 PM PST")));</script>
                    </div>
                </div>
            </div>
            <div id="header">
                <div id="logo"></div>
                <div id="title">Overload Teams League</div>
            </div>
            <div id="body">
                <div class="section">Season Top Teams</div>
                <div id="standings">
                    <div class="header">Pos</div>
                    <div class="header">Tag</div>
                    <div class="header">Team Name</div>
                    <div class="header">Rating</div>
                    <div class="header">Record</div>
                    <div>1</div>
                    <div class="tag"><div class="diamond" style="background-color: red;"></div> CF</div>
                    <div>Cronus Frontier</div>
                    <div>1920</div>
                    <div>12-3</div>
                    <div>2</div>
                    <div class="tag"><div class="diamond-empty"></div> JOA</div>
                    <div>Juno Offworld Automation</div>
                    <div>1230</div>
                    <div>5-18</div>
                </div>
            </div>
        `);

        res.status(200).send(minify(html, settings.htmlMinifier));
    }
}

module.exports = Home.get;
