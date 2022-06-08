import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  location: String,
});

userSchema.pre("save", async function () {
  try {
    this.password = await bcrypt.hash(this.password, 5);
  } catch (error) {
    console.log(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
