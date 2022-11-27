const http = require("http");
const Client = require("yapople").Client;
const exec = require("child_process").exec;
const credentials = require("./credentials.json");

const client = new Client({
    host: "mail.skginfo.at",
    port: 995,
    tls: true,
    mailparser: true,
    username: credentials.username,
    password: credentials.password,
});

const hostname = "127.0.0.1";
const port = 8000;
let mail = "";
const server = http.createServer(async (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    try {
        res.write(
            "<script>setTimeout(() => location.reload(), 30000)</script>"
        );
        res.end(mail);
    } catch (e) {
        console.log(e);
    }
});

server.on("close", client.quit);

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    startMailPulling();
});

server.on("close", () => client.quit());

function startMailPulling() {
    console.log("Connected to mail server");
    let lastMailTimestamp = 0;
    setInterval(() => {
        client.connect().then(() =>
            client.retrieveAll().then((messages) => {
                try {
                    const newMail = messages.sort(
                        (a, b) =>
                            b.receivedDate.getTime() - a.receivedDate.getTime()
                    )[0];
                    if (lastMailTimestamp < newMail.receivedDate.getTime()) {
                        console.log("Messages retrieved");
                        lastMailTimestamp = newMail.receivedDate.getTime();
                        mail = newMail.html;
                        exec("xset s reset && xset dpms force on");
                    }
                    client.quit();
                } catch (e) {
                    client.quit();
                    console.log(e);
                }
            })
        );
    }, 5000);
}
