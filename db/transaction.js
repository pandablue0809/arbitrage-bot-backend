const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const TransactionSchema = new Schema({
    Date: {
        type: String,
        required: true
    },
    TradeAmount: {
        type: String,
        required: true
    },
    EarnAmount: {
        type: String,
        required: true
    },
});
module.exports = Report = mongoose.model("transactions", TransactionSchema);