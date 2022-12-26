var mongoose = require("mongoose");
const BookSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
});
module.exports = mongoose.model("Book", BookSchema);