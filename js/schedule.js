//const API = `http://localhost:3000`;
const API = `https://scheduletracker-v1xz.onrender.com`;

async function fetchSchedule() {
  const currentPage = window.location.pathname;

  let apiEndpoint;

  if (currentPage.includes("paula")) {
    apiEndpoint = `${API}/api/paula`;
  } else if (currentPage.includes("toms")) {
    apiEndpoint = `${API}/api/toms`;
  } else {
    console.error("Unknown page");
    return;
  }

  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

function displaySchedule(schedule) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  schedule.forEach((day) => {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = day.day;
    dayElement.appendChild(dayTitle);

    day.lessons.forEach((lesson) => {
      const lessonElement = document.createElement("p");
      lessonElement.textContent = `${lesson.time} - ${lesson.activity} (${lesson.location})`;
      dayElement.appendChild(lessonElement);
    });

    container.appendChild(dayElement);
  });
}

function showSchedule(apiEndpoint) {
  fetchSchedule(apiEndpoint)
    .then((schedule) => {
      displaySchedule(schedule);
    })
    .catch((error) => {
      console.error("Error fetching or displaying schedule:", error);
    });
}

function updateTime() {
  const now = new Date();

  const days = [
    "Svētdiena",
    "Pirmdiena",
    "Otrdiena",
    "Trešdiena",
    "Ceturtdiena",
    "Piektdiena",
    "Sestdiena",
  ];
  const months = [
    "Janvāris",
    "Februāris",
    "Marts",
    "Aprīlis",
    "Maijs",
    "Jūnijs",
    "Jūlijs",
    "Augusts",
    "Septembris",
    "Oktobris",
    "Novembris",
    "Decembris",
  ];

  const dayName = days[now.getDay()];
  const dayDate = now.getDate();
  const month = `${months[now.getMonth()]}<br>`;
  const day = `${dayName}<br>`;
  const date = `${dayDate}<br>`;

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  document.getElementById("current-time").innerHTML = time;
  document.getElementById("current-date").innerHTML = date;
  document.getElementById("current-day").innerHTML = day;
  document.getElementById("current-month").innerHTML = month;
}

document.addEventListener("DOMContentLoaded", () => {
  showSchedule(`${API}/api/paula`);
  showSchedule(`${API}/api/toms`);
  setInterval(updateTime, 1000);
  updateTime();
});

function getCurrentLesson(schedule) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const today = getTodayName();

  const todaySchedule = schedule.find((day) => day.day === today);

  if (!todaySchedule) {
    return null;
  }

  const currentLesson = todaySchedule.lessons.find((lesson) => {
    const [start, end] = lesson.time
      .split(" - ")
      .map((t) =>
        t.split(":").reduce((h, m) => parseInt(h) * 60 + parseInt(m), 0)
      );
    return currentTime >= start && currentTime < end;
  });

  return currentLesson || null;
}

function getTodayName() {
  const days = [
    "Svētdiena",
    "Pirmdiena",
    "Otrdiena",
    "Trešdiena",
    "Ceturtdiena",
    "Piektdiena",
    "Sestdiena",
  ];
  return days[new Date().getDay()];
}

function highlightCurrentLesson(schedule) {
  const container = document.getElementById("schedule-container");
  const currentLesson = getCurrentLesson(schedule);

  const currentLessonText = currentLesson
    ? `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})`
    : "Šobrīd stundas nenotiek.";
  document.querySelector(".current-lesson").textContent = currentLessonText;

  container.querySelectorAll(".highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  if (currentLesson) {
    const today = getTodayName();
    const daySection = Array.from(container.querySelectorAll(".day")).find(
      (el) => el.querySelector("h3").textContent.includes(today)
    );

    if (daySection) {
      const lessonElement = Array.from(daySection.querySelectorAll("p")).find(
        (el) =>
          el.textContent.includes(
            `${currentLesson.time} - ${currentLesson.activity}`
          )
      );
      if (lessonElement) {
        lessonElement.classList.add("highlight");
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchSchedule()
    .then((schedule) => {
      displaySchedule(schedule);

      setInterval(() => highlightCurrentLesson(schedule), 1000);
      highlightCurrentLesson(schedule);
    })
    .catch((error) => {
      console.error("Error fetching or displaying schedule:", error);
    });
});
