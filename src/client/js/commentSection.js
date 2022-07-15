const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const btn = form.querySelector("button");
const textarea = form.querySelector("textarea");

const handleSubmit = (event) => {
  event.preventDefault();
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
};

// 05:10
form.addEventListener("submit", handleSubmit);
