var express = require("express");
var cors = require("cors");
var index = require("./routes/index");
var mongoose = require("mongoose");
var app = express();
ruid = require("express-ruid");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());
app.use(ruid());
app.use("/", index);
// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development

    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});
app.use((err, req, res, next) => {
    res.statusCode = 500;
    // Do not expose your error in production
    res.json({ error: err.message });
    next();
});

const PORT = process.env.PORT || 5000;
mongoose
    .connect(
        `mongodb+srv://amalabidi:amal123456789@cluster0.ez8x1av.mongodb.net/test`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => app.listen(PORT, console.log(`Sever running on port ${PORT}`)))
    .catch((error) => console.log(error.message));

module.exports = app;