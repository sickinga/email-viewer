const http = require("http");
const exec = require("child_process").exec;
const credentials = require("./credentials.json");
const POP3Client = require("mailpop3");
const util = require("util");

const debug = false;
let currentMail;
let client;

function initClient() {
    client = new POP3Client(995, "mail.skginfo.at", {
        tlserrs: false,
        enabletls: true,
        debug: false,
    });
    setClientHandlers();
}

function setClientHandlers() {
    client.on("error", function (err) {
        if (err.errno === 111) console.log("Unable to connect to server");
        else console.log("Server error occurred");

        console.log(err);
    });

    client.on("connect", function (rawdata) {
        console.log("CONNECT success");
        client.login(credentials.username, credentials.password);
    });

    client.on("invalid-state", function (cmd) {
        console.log("Invalid state. You tried calling " + cmd);
    });

    client.on("locked", function (cmd) {
        console.log(
            "Current command has not finished yet. You tried calling " + cmd
        );
    });

    client.on("login", function (status, rawdata) {
        if (status) {
            console.log("LOGIN/PASS success");
            client.capa();
        } else {
            console.log("LOGIN/PASS failed");
            client.quit();
        }
    });

    client.on("capa", function (status, data, rawdata) {
        if (status) {
            console.log("CAPA success");
            if (debug) console.log("Parsed data: " + util.inspect(data));
            client.stat();
        } else {
            console.log("CAPA failed");
            client.quit();
        }
    });

    client.on("stat", function (status, data, rawdata) {
        if (status === true) {
            console.log("STAT success");
            if (debug) console.log("Parsed data: " + util.inspect(data));
            client.list();
        } else {
            console.log("STAT failed");
            client.quit();
        }
    });

    client.on("list", function (status, msgcount, msgnumber, data, rawdata) {
        if (status === false) {
            if (msgnumber !== undefined)
                console.log("LIST failed for msgnumber " + msgnumber);
            else console.log("LIST failed");

            client.quit();
        } else if (msgcount === 0) {
            console.log("LIST success with 0 elements");
            client.quit();
        } else {
            console.log("LIST success with " + msgcount + " element(s)");
            client.retr(msgcount);
        }
    });

    client.on("uidl", function (status, msgnumber, data, rawdata) {
        if (status === true) {
            console.log("UIDL success");
        } else {
            console.log("UIDL failed for msgnumber " + msgnumber);
            client.quit();
        }
    });

    client.on("top", function (status, msgnumber, data, rawdata) {
        if (status === true) {
            console.log("TOP success for msgnumber " + msgnumber);
            if (debug) console.log("Parsed data: " + data);
            client.retr(msgnumber);
        } else {
            console.log("TOP failed for msgnumber " + msgnumber);
            client.quit();
        }
    });

    client.on("retr", function (status, msgnumber, data, rawdata) {
        if (status === true) {
            console.log("RETR success for msgnumber " + msgnumber);
            checkNewMail(data);

            if (debug) console.log("Parsed data: " + data);

            client.quit();
        } else {
            console.log("RETR failed for msgnumber " + msgnumber);
            client.quit();
        }
    });

    client.on("dele", function (status, msgnumber, data, rawdata) {
        if (status === true) {
            console.log("DELE success for msgnumber " + msgnumber);
            client.rset();
        } else {
            console.log("DELE failed for msgnumber " + msgnumber);
            client.quit();
        }
    });

    client.on("rset", function (status, rawdata) {
        if (status === true) console.log("RSET success");
        else console.log("RSET failed");

        client.quit();
    });

    client.on("quit", function (status, rawdata) {
        if (status === true) console.log("QUIT success");
        else console.log("QUIT failed");
    });
}

function checkNewMail(data) {
    const newMail = getMail(data);
    if (!currentMail || newMail.date !== currentMail.date) {
        currentMail = newMail;
        exec("xset s reset && xset dpms force on");
        return true;
    }
    return false;
}

function getMail(data) {
    const body = data
        .split("Content-Type: text/html")[1]
        .split("\r\n")
        .slice(1, -1)
        .join("\r\n");
    const date = data.split("Date: ")[1].split("\r\n")[0];
    return { body, date };
}

const hostname = "127.0.0.1";
const port = 8000;

initClient();
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");

    try {
        res.write("<script>setTimeout(() => location.reload(), 15000)</script>");
        res.end(currentMail.body);
    } catch (e) {
        console.log(e);
    }
});

server.on("close", client.quit);

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    startMailPulling();
});

function startMailPulling() {
    setInterval(() => {
        console.log("Reconnecting to mail server...");
        initClient();
    }, 60000);
}
