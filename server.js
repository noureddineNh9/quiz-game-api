const http = require("http");
const io = require("socket.io");
const fs = require("fs");
const apiServer = require("./api");

apiServer.get("/rooms", (req, res) => {
   res.send("rooms");
});

apiServer.get("/increaseStars", (req, res) => {
   fs.readFile("./data.json", "utf8", (err, jsonString) => {
      if (err) {
         return res.status(400).json("error");
      }
      try {
         const data = JSON.parse(jsonString);
         console.log(data);
         data.stars++;
         let newData = JSON.stringify(data);
         fs.writeFileSync("./data.json", newData);
         return res.status(200).json("Ok");
      } catch (err) {
         return res.status(400).json("error");
      }
   });
});

apiServer.get("/stars", (req, res) => {
   fs.readFile("./data.json", "utf8", (err, jsonString) => {
      if (err) {
         return res.status(400).json("error");
      }
      try {
         const data = JSON.parse(jsonString);
         return res.status(200).json(data);
      } catch (err) {
         return res.status(400).json("error");
      }
   });
});

const httpServer = http.createServer(apiServer);
const socketServer = io(httpServer, {
   cors: {
      origin: "http://localhost:3000",
   },
});

const sockets = require("./sockets");

httpServer.listen(process.env.PORT || 5000, () => {
   console.log(`app is running on port ${process.env.PORT}`);
});

sockets.listen(socketServer);
