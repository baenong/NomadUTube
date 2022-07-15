import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  createdAt: { type: Date, required: true, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String, required: true },
});

const Reply = mongoose.model("Reply", replySchema);

export default Reply;
