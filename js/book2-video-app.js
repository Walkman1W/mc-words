const EPISODES = [
  {
    page: 1,
    cid: 41675066574,
    title: "初入方块世界",
    subtitle: "Welcome to the block world",
    image: "/assets/images/book2/episode-01.png",
  },
  {
    page: 2,
    cid: 41675392110,
    title: "森林探索",
    subtitle: "Let’s explore the forest",
    image: "/assets/images/book2/episode-02.png",
  },
  {
    page: 3,
    cid: 41675591513,
    title: "矿洞寻宝",
    subtitle: "A treasure hunt underground",
    image: "/assets/images/book2/episode-03.png",
  },
  {
    page: 4,
    cid: 41675853341,
    title: "村庄的一天",
    subtitle: "A day in the village",
    image: "/assets/images/book2/episode-04.png",
  },
  {
    page: 5,
    cid: 41679062627,
    title: "农场与动物",
    subtitle: "Fun at the farm",
    image: "/assets/images/book2/episode-05.png",
  },
  {
    page: 6,
    title: "建造我们的家",
    subtitle: "Let’s build our home!",
    image: "/assets/images/book2/episode-06.png",
    coming: true,
  },
  {
    page: 7,
    title: "怪物之夜",
    subtitle: "Survive the night!",
    image: "/assets/images/book2/episode-07.png",
    coming: true,
  },
  {
    page: 8,
    title: "最终冒险",
    subtitle: "The final adventure",
    image: "/assets/images/book2/episode-08.png",
    coming: true,
  },
];
const bvid = "BV16ybu6NEEj",
  grid = document.getElementById("episode-grid"),
  modal = document.getElementById("video-modal"),
  player = document.getElementById("video-player"),
  closeButton = document.getElementById("btn-close-video"),
  title = document.getElementById("modal-title"),
  description = document.getElementById("modal-description");
let lastFocus = null;
function placeholder() {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#0b1b2b"/><text x="8" y="5.2" text-anchor="middle" fill="#51a9ff" font-size="1.4" font-family="sans-serif"></text></svg>',
    )
  );
}
function render() {
  grid.innerHTML = EPISODES.map(
    (e, i) =>
      `<article class="episode-card${e.coming ? " is-coming" : ""}" data-index="${i}"${e.coming ? "" : ' tabindex="0" role="button"'}><div class="episode-thumb"><img src="${e.image || placeholder()}" alt="第${e.page}集 ${e.title}" loading="eager"><span class="episode-label">EP. ${String(e.page).padStart(2, "0")}</span>${e.coming ? '<span class="coming-label">即将上线</span>' : '<span class="episode-play" aria-hidden="true"></span>'}</div><div class="episode-body"><h3>${e.title}</h3><p>${e.subtitle}</p></div></article>`,
  ).join("");
  grid.querySelectorAll(".episode-card:not(.is-coming)").forEach((card) => {
    card.addEventListener("click", () =>
      openEpisode(EPISODES[card.dataset.index], card),
    );
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEpisode(EPISODES[card.dataset.index], card);
      }
    });
  });
}
function openEpisode(e, card) {
  lastFocus = card;
  document.getElementById("bilibili-fallback").href =
    `https://www.bilibili.com/video/${bvid}/?p=${e.page}`;
  title.textContent = `第${e.page}集 · ${e.title}`;
  description.textContent = e.subtitle;
  player.innerHTML = `<iframe title="${e.title}" src="https://player.bilibili.com/player.html?bvid=${bvid}&cid=${e.cid}&page=${e.page}&autoplay=1&high_quality=1" scrolling="no" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  document.querySelector(".book2-page").inert = true;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}
function closeModal() {
  document.querySelector(".book2-page").inert = false;
  modal.classList.add("hidden");
  player.innerHTML = "";
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}
closeButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden"))
    closeModal();
});
render();

modal.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusable = [...modal.querySelectorAll("button, iframe, a[href]")];
  const first = focusable[0],
    last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
