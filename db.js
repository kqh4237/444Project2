const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: "localhost",
    user: "pizzauser",
    password: "Student1!",
    database: "pizza_store",
});

module.exports = pool;