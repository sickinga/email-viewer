const http = require("http");
const { Client } = require("yapople");
const credentials = require("./credentials.json");

const client = new Client({
    host: "pop.ooe.owr.at",
    port: 995,
    tls: true,
    mailparser: true,
    username: credentials.username,
    password: credentials.password,
});
(async () => {
    await client.connect();
    const messages = await client.retrieveAll();
    messages.forEach((message) => {
        console.log(message.subject);
    });
    await client.quit();
})().catch(console.error);

const hostname = "127.0.0.1";
const port = 8000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World");
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
