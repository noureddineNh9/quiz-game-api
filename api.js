const cors = require("cors");
const express = require("express");

const api = express();
api.use(cors());

api.get("/", (req, res) => {
   res.send("It's working");
});

module.exports = api;
