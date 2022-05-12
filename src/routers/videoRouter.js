import express from "express";
import { getEdit, postEdit, watch } from "../controllers/videoController";

const videoRouter = express.Router();

// if you write upload router bottom of id
// express think upload is id

videoRouter.get("/:id(\\d+)", watch);
videoRouter.route("/:id(\\d+)/edit").get(getEdit).post(postEdit);

export default videoRouter;
