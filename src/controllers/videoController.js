import User from "../models/User";
import Comment from "../models/Comment";
import Video from "../models/Video";

export const home = async (req, res) => {
  // promise : callback의 최신버전같은 느낌
  // await : error는? try catch로
  // await는 db를 기다려준다. => 코드를 읽을 때 굉장히 편해진다.

  /*
  callback 방식
  Video.find({}, (error, videos) => {
    if(error) {
      return res.render("server-error");
    }
    return res.render("home", {pageTitle: "Home", videos});
  })
  */
  try {
    const videos = await Video.find({})
      .sort({ createdAt: "desc" })
      .populate("owner", "name");
    return res.render("home", { pageTitle: "Home", videos });
  } catch {
    return res.render("server-error");
  }
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  const owner = await User.findById(video.owner);
  const comments = await Comment.find({ video: id }).populate("owner");

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  return res.render("watch", {
    pageTitle: video.title,
    video,
    owner,
    comments,
  });
};

// Edit Video Controller
export const getEdit = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
    body: { title, description, hashtags },
  } = req;

  const video = await Video.findById(id);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "You are not the owner of the video.");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  req.flash("success", "Change saved.");
  return res.redirect(`/videos/${id}`);
};

// Upload Video Controller
export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { title, description, hashtags },
    files: { video, thumb },
  } = req;

  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: res.locals.isHeroku ? video[0].location : video[0].path,
      thumbUrl: res.locals.isHeroku ? thumb[0].location : video[0].path,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });

    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();

    req.flash("success", "Success Upload Video");

    return res.redirect("/");
  } catch (error) {
    req.flash("error", error._message);
    return res.status(400).render("upload", { pageTitle: "Upload Video" });
  }
};

// Delete Video Controller
export const getDelete = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;

  const video = await Video.findById(id);
  const user = await User.findById(_id);

  if (!video) {
    return res.status(400).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndDelete(id);
  user.videos.splice(user.videos.indexOf(id), 1);
  user.save();

  req.flash("success", "Success Delete Video");
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    // Search
    if (keyword.startsWith("#")) {
      videos = await Video.find({
        hashtags: keyword,
      })
        .sort({ createdAt: "desc" })
        .populate("owner", ["name", "socialOnly", "avatarUrl"]);
    } else {
      videos = await Video.find({
        title: { $regex: new RegExp(keyword, "i") },
      })
        .sort({ createdAt: "desc" })
        .populate("owner", ["name", "socialOnly", "avatarUrl"]);
    }
  }
  return res.render("search", { pageTitle: "Search", videos });
};

//status(400) : render 전 스테이스터스 설정
//sendStatus(400) : 상태코드만 반환

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    params: { id },
    body: { text },
    session: { user },
  } = req;

  const video = await Video.findById(id);

  if (!video) {
    return res.sendStatus(404);
  }

  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
  });

  video.comments.push(comment._id);
  video.save();

  const owner = await User.findById(user._id);
  owner.comments.push(comment._id);
  owner.save();

  return res
    .status(201)
    .json({ name: owner.name, createdAt: comment.createdAt, id: comment._id });
};

export const deleteComment = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;

  const comment = await Comment.findById(id);
  const user = await User.findById(_id);
  const video = await Video.findById(comment.video);

  if (!comment) {
    return res.status(400).render("404", { pageTitle: "Comment not found." });
  }
  if (String(comment.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }

  await Comment.findByIdAndDelete(id);
  user.comments.splice(user.comments.indexOf(id), 1);
  user.save();

  video.comments.splice(video.comments.indexOf(id), 1);
  video.save();

  req.flash("success", "Delete Comment Success");
  return res.redirect(`/videos/${video._id}`);
};
