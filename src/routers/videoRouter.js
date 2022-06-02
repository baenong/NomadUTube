import express from "express";
import {
  getEdit,
  postEdit,
  getDelete,
  watch,
  getUpload,
  postUpload,
} from "../controllers/videoController";

const videoRouter = express.Router();

// if you write upload router bottom of id
// express think upload is id

videoRouter.route("/:id([0-9a-f]{24})").get(watch);
videoRouter.route("/:id([0-9a-f]{24})/edit").get(getEdit).post(postEdit);
videoRouter.route("/:id([0-9a-f]{24})/delete").get(getDelete);
videoRouter.route("/upload").get(getUpload).post(postUpload);

export default videoRouter;
