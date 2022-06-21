import express from "express";
import {
  getEdit,
  postEdit,
  getDelete,
  watch,
  getUpload,
  postUpload,
} from "../controllers/videoController";
import { protectorMiddleware, uploadVideo } from "../middlewares";

const videoRouter = express.Router();

// if you write upload router bottom of id
// express think upload is id

videoRouter.route("/:id([0-9a-f]{24})").get(watch);
videoRouter
  .route("/:id([0-9a-f]{24})/edit")
  .all(protectorMiddleware)
  .get(getEdit)
  .post(postEdit);
videoRouter
  .route("/:id([0-9a-f]{24})/delete")
  .all(protectorMiddleware)
  .get(getDelete);
videoRouter
  .route("/upload")
  .all(protectorMiddleware)
  .get(getUpload)
  .post(uploadVideo.single("video"), postUpload);

export default videoRouter;
