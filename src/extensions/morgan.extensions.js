module.exports = function(morgan) {
    // colorstatus - Returns the status number in color.
    morgan.token("colorstatus", (req, res) => {
        // Default to green.
        let color = 32;

        if (!res._header) {
            return null;
        }

        if (res.statusCode >= 500) {
            // 5xx is red.
            color = 31;
        } else if (res.statusCode >= 400) {
            // 4xx is yellow.
            color = 33;
        } else if (res.statusCode >= 300) {
            // 3xx is cyan.
            color = 36;
        }

        return `\x1b[${color}m\x1b[1m${res.statusCode}\x1b[0m`;
    });

    // colorresponse - Returns the response time in color.
    morgan.token("colorresponse", (req, res) => {
        // Default to green.
        let color = 32;

        // Ensure we have the data to proceed.
        if (!res._header || !req._startAt) {
            return "";
        }

        // Calculate the response time.
        const diff = process.hrtime(req._startAt);
        const ms = diff[0] * 1e3 + diff[1] * 1e-6;

        if (ms >= 1000) {
            // 1s or greater is red.
            color = 31;
        } else if (ms >= 100) {
            // 100ms to 1s is yellow.
            color = 33;
        } else if (ms >= 10) {
            // 10ms to 100ms is cyan.
            color = 36;
        }

        return `\x1b[${color}m\x1b[1m${ms.toFixed(3)}\x1b[0m`;
    });

    // newline - Simple newline.
    morgan.token("newline", () => "\n");

    // realip - The user's real IP address.
    morgan.token("realip", (req) => {
        const ip = (req.headers["x-forwarded-for"] ? `${req.headers["x-forwarded-for"]}` : void 0) || req.ip;

        return ip;
    });
};
