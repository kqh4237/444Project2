const express = require("express");
const cors = require("cors");
require("dotenv").config();

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

//test route
app.get("/", (req,res) =>{
    res.send("Nick Snyder's Pizza Planet API is running!");
});

//routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log("Server running on port 5000");
});