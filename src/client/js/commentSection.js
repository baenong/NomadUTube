const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const btn = form.querySelector("button");
const textarea = form.querySelector("textarea");

const addComment = (text, name, createdAt, id) => {
  const videoComments = document.querySelector("#commentContainer");

  if (videoComments.childElementCount === 1) {
    videoComments.removeChild();
  }

  const newComment = document.createElement("li");
  newComment.className = "comment";

  const commentContainer = document.createElement("div");
  commentContainer.className = "comment-mixin__container";
  newComment.appendChild(commentContainer);

  const commentAvatar = document.createElement("div");
  commentAvatar.className = "comment-mixin__avatar";
  const commentData = document.createElement("div");
  commentData.className = "comment-mixin__data";
  commentContainer.appendChild(commentAvatar);
  commentContainer.appendChild(commentData);

  // Header
  const commentHeader = document.createElement("div");
  commentHeader.className = "comment-mixin__header";
  commentData.appendChild(commentHeader);

  const spanName = document.createElement("span");
  spanName.innerText = name;
  commentHeader.appendChild(spanName);

  const spanCreated = document.createElement("span");
  const whenCreated = new Date(createdAt);
  spanCreated.innerText = `${whenCreated.getFullYear()}. ${whenCreated.getMonth()}. ${whenCreated.getDate()}`;
  commentHeader.appendChild(spanCreated);

  // Text
  const commentText = document.createElement("div");
  commentText.className = "comment-mixin__text";
  commentData.appendChild(commentText);

  const anchorAvatar = document.createElement("a");
  const spanAvatar = document.createElement("span");
  commentAvatar.appendChild(anchorAvatar);
  anchorAvatar.appendChild(spanAvatar);

  const loggedInAvatar = document.querySelector(".header__avatar");
  const img = document.createElement("img");
  img.src = loggedInAvatar.src;
  spanAvatar.appendChild(img);

  const p = document.createElement("p");
  p.innerText = text;
  commentText.appendChild(p);

  // Delete Button
  const commentEdit = document.createElement("div");
  commentEdit.className = "comment-edit";
  const a = document.createElement("a");
  a.className = "edit-btn";
  a.href = `/api/comments/${id}/delete`;
  a.innerText = "X";
  commentEdit.appendChild(a);
  commentData.appendChild(commentEdit);

  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  textarea.value = "";

  if (response.status === 201) {
    const result = await response.json();
    const { name, createdAt, id } = result;
    addComment(text, name, createdAt, id);
  }
};

// 05:10
form.addEventListener("submit", handleSubmit);
