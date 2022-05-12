let videos = [
  {
    title: "Hello",
    rating: 5,
    comments: 2,
    createdAt: "2 minutes ago",
    views: 59,
    id: 1,
  },
  {
    title: "Second Video",
    rating: 4.5,
    comments: 12,
    createdAt: "3 minutes ago",
    views: 59,
    id: 2,
  },
  {
    title: "Third Video",
    rating: 5,
    comments: 2,
    createdAt: "2 minutes ago",
    views: 101,
    id: 3,
  },
];

export const trending = (req, res) => {
  // Mixin is smart partial
  res.render("home", { pageTitle: "Home", videos });
};

export const watch = (req, res) => {
  const { id } = req.params;
  const video = videos[id - 1];
  return res.render("watch", { pageTitle: `Watching ${video.title}`, video });
};

// Edit Video Controller
export const getEdit = (req, res) => {
  const { id } = req.params;
  const video = videos[id - 1];
  // 소유주가 맞는지 확인하는 프로세스가 필요함(url만 쳐서 edit 화면으로 못 가도록)
  res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};

export const postEdit = (req, res) => {
  const { id } = req.params;
  videos[id - 1].title = req.body.title;
  return res.redirect(`/videos/${id}`);
};
