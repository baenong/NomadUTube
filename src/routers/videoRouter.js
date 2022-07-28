import express from "express";
import {
  getEdit,
  postEdit,
  getDelete,
  watch,
  getUpload,
  postUpload,
} from "../controllers/videoController";
import {
  protectorMiddleware,
  s3DeleteVideoMiddleware,
  uploadVideo,
} from "../middlewares";

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
  .use(s3DeleteVideoMiddleware)
  .get(getDelete);
videoRouter
  .route("/upload")
  .all(protectorMiddleware)
  .get(getUpload)
  .post(
    uploadVideo.fields([
      { name: "video", maxCount: 1 },
      { name: "thumb", maxCount: 1 },
    ]),
    postUpload
  );

export default videoRouter;
