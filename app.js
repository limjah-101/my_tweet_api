const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

//  <<<<<<<<<<<<<<<< DB CONNECTION >>>>>>>>>>>>>>>>>
mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true })
        .then( () => {
            console.log('"CONNECTED SUCCESSFULLY TO ATLAS"')
        })
mongoose.connection.on('error', err => {
    console.log(`CONNECTION to ATLAS FAILED: ${err.message}`);
})

const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const usersRoutes = require('./routes/users');

app.get("/api", (req, res) => {
    fs.readFile('docs/apiDocs.json', (err, data) => {
        if (err) {
            res.status(400).json({ error: err })
        }
        let docs = JSON.parse(data)
        res.json(docs);
    })
})

// <<<<<<<<<<<<<<<<<<<<< MIDDLEWARES >>>>>>>>>>>>>>>>
//Browser refresh -> log route | status | request duration code
app.use(morgan('dev')); 
//Parse body to JSON
app.use(bodyParser.json());
// Parse Cookie
app.use(cookieParser());
//Schema Validation
app.use(expressValidator());
//
app.use(cors());

app.use("/api", postRoutes);
app.use("/api", authRoutes); //leave route("/") 'cause it's already handle in authroute (avoid ERR!!!)
app.use("/api", usersRoutes);
//Pretty Error Unauthorized error msg
app.use( function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        res.status(401).json({ error: "Sorry, action not allowed!" })
    }
});




//<<<<<<<<<<<<<<<<<<<<<< RUN SERVER >>>>>>>>>>>>>>>>>>>

const port = process.env.port || 8080;
app.listen(port, () => {
    console.log(`Node API is listnen on port ${port}`);
});