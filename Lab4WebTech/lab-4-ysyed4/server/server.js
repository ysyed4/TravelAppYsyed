require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser=require("cookie-parser");
const bcryptjs=require("bcryptjs")
const cors = require('cors');

const mongoString = process.env.DATABASE_URL;

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.connect(mongoString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const database = mongoose.connection;

database.on("error", (error) => {
  console.log("Database connection error:", error);
});
database.once("connected", () => {
  console.log("Database Connected");
});

const routes = require("./routes/routes");
app.use("/api", routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
