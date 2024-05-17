const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();
const cors = require("cors")
const app = express();

//create a connection to the database using connection pools- this keeps the connection open and allows people to queue
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST, //localhost
  user: process.env.MYSQL_USER, //root user in mysql
  password: process.env.MYSQL_PASSWORD, //password for root user in mysql
  database: process.env.MYSQL_DATABASE, //name of the database you want to query
  port: 3306,
  ssl:{ca:fs.readFileSync("./DigiCertGlobalRootCA.crt.pem")},
  waitForConnections: true, //if want to allow people to queue for connection spots
  connectionLimit: 10, // number of available connection spots
  queueLimit: 0, //how many people can queue for a connection spot- if 0 as many people as needed can queue
});

app.use(cors({ origin: process.env.CLIENT_HOST }));

//========== ENDPOINTS ============//
//Root endpoint: return all countries
app.get("/", (req, res) => {
  console.log("/ endpoint was hit 🎯");
  pool.query("SELECT * FROM country", (err, result) => {
    if (err) return console.log(err);
    res.send(result);
  });
});


//get a list of countries that belong in Oceania
app.get("/oceania", (req, res) => {
  console.log("/oceania endpoint was hit 🎯");
  pool.query(
    'SELECT name, LifeExpectancy FROM country WHERE Continent = "Oceania" order by LifeExpectancy DESC LIMIT 10;',
    (err, result) => {
      if (err) return console.log(err);
      res.send(result);
    }
  );
});

//Show the information about a specific country by it's name
app.get("/country/:countryname", (req, res) => {
  console.log("/country endpoint was hit 🎯");
  const countryname = req.params.countryname;

  pool.query(
    `SELECT * FROM country WHERE Name = "${countryname}";`,
    (err, result) => {
      if (err) return console.log(err);
      res.send(result);
    }
  );
});


//Find the total population of a continent
app.get("/population/:continent", (req, res) => {
  console.log("/population/:continent endpoint was hit 🎯");
  const continent = req.params.continent;
  const query =
    "SELECT SUM(population)AS sum FROM country WHERE continent = ?;";

  pool.execute(query, [continent], (err, result) => {
    if (err) return console.log(err);

    console.log(result);

    res.send(`The total population of ${continent} is ${result[0].sum}`);
  });
});



//========== PORT ============//
const PORT = process.env.PORT;
console.log(PORT);

app
  .listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
  })
  .on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log("Port is already in use");
    } else {
      console.log("Server Error", error);
    }
  });