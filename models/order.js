var mongoose = require("mongoose");
const OrderSchema = mongoose.Schema({
  quantity: { type: String, required: true },
  productId: { type: String, required: true },
  address: { type: String, required: false },
});
module.exports = mongoose.model("Order", OrderSchema);
