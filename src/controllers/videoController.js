import User from "../models/User";
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
    const videos = await Video.find({}).sort({ createdAt: "desc" });
    return res.render("home", { pageTitle: "Home", videos });
  } catch {
    return res.render("server-error");
  }
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  const owner = await User.findById(video.owner);

  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }
  return res.render("watch", { pageTitle: video.title, video, owner });
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
    return res.render("404", { pageTitle: "Video not found." });
  }

  // 소유주가 맞는지 확인하는 프로세스가 필요함(url만 쳐서 edit 화면으로 못 가도록)
  // 아래 렌더링에 video가 필요하기 때문에 처음에 exists대신 findById를 쓰는 것이 낫다
  if (String(video.owner) !== String(_id)) {
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
    return res.status(403).redirect("/");
  }

  await video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  return res.redirect(`/videos/${id}`);
};

// Upload Video Controller
export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  // const { title, description, hashtags } = req.body;
  const {
    session: {
      user: { _id },
    },
    body: { title, description, hashtags },
    file: { path: fileUrl },
  } = req;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });

    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();

    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
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

  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    // Search
    videos = await Video.find({
      title: { $regex: new RegExp(keyword, "i") },
    }).sort({ createdAt: "desc" });
  }
  return res.render("search", { pageTitle: "Search", videos });
};
