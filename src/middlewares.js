import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import Video from "./models/Video";

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const isHeroku = process.env.NODE_ENV === "production";

const s3ImageUploader = multerS3({
  s3: s3,
  bucket: "utubestudy",
  acl: "public-read",
});

const s3VideoUploader = multerS3({
  s3: s3,
  bucket: "utubestudy",
  acl: "public-read",
});

export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.siteName = "UTube";
  res.locals.loggedInUser = req.session.user || {};
  res.locals.isHeroku = isHeroku;
  return next();
};

export const protectorMiddleware = (req, res, next) => {
  if (res.locals.loggedIn) {
    return next();
  } else {
    req.flash("error", "Log in first.");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!res.locals.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized");
    return res.redirect("/");
  }
};

export const uploadAvatar = multer({
  dest: "uploads/images/",
  limits: {
    fileSize: 3000000,
  },
  storage: isHeroku ? s3ImageUploader : undefined,
});

export const uploadVideo = multer({
  dest: "uploads/videos/",
  limits: {
    fileSize: 10000000,
  },
  storage: isHeroku ? s3VideoUploader : undefined,
});

const s3SDeleteObject = async (url) => {
  const targetUrl = url.split("/")[3];

  await s3.send(
    new DeleteObjectCommand({
      Bucket: "utubestudy",
      Key: targetUrl,
    })
  );
};

export const s3DeleteAvatarMiddleware = async (req, res, next) => {
  const avatar = req.session.user.avatarUrl;

  if (req.session.user.socialOnly) {
    return next();
  }
  if (!req.file) {
    return next();
  }
  if (!avatar) {
    return next();
  }

  await s3SDeleteObject(avatar);

  return next();
};

export const s3DeleteVideoMiddleware = async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const video = await Video.findById(id);

  if (!video) {
    return next();
  }

  const videoUrl = video.fileUrl;
  const thumbUrl = video.thumbUrl;

  await s3SDeleteObject(videoUrl);
  await s3SDeleteObject(thumbUrl);

  return next();
};
