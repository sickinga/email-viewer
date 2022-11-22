import POP3Client from "mailpop3";

var client = new POP3Client(995, "pop.gmail.com", {
    tlserrs: false,
    enabletls: true,
    debug: true,
});

client.on("error", function (err) {
    if (err.errno === 111) console.log("Unable to connect to server");
    else console.log("Server error occurred");

    console.log(err);
});

client.on("connect", function (rawdata) {
    console.log("CONNECT success");
    client.login(username, password);
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
        client.noop();
    } else {
        console.log("CAPA failed");
        client.quit();
    }
});

client.on("noop", function (status, rawdata) {
    if (status) {
        console.log("NOOP success");
        client.stat();
    } else {
        console.log("NOOP failed");
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
        client.uidl();
    }
});

client.on("uidl", function (status, msgnumber, data, rawdata) {
    if (status === true) {
        console.log("UIDL success");
        if (debug) console.log("Parsed data: " + data);
        client.top(123123, 10);
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
        if (debug) console.log("Parsed data: " + data);

        if (msgnumber !== undefined) client.dele(msgnumber);
        else client.quit();
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
