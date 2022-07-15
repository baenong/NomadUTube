import "dotenv/config";

import "./db";
import "./models/Video";
import "./models/User";
import "./models/Comment";
import "./models/Reply";

import app from "./server";

const PORT = 4000;

// Listening Request
const handleListening = () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
};

app.listen(PORT, handleListening);
