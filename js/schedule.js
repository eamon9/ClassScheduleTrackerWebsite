// comment out const API = `http://localhost:3000` when commit and push changes to git
// const API = `http://localhost:3000`;
// const API = `https://scheduletracker-v1xz.onrender.com`;

const API =
  window.location.hostname === "localhost"
    ? `http://localhost:3000`
    : `https://scheduletracker-v1xz.onrender.com`;

// days starts with 0- Svētdiena for better organization
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

let today;
let now;
let currentTime;

function get_API_Endpoint() {
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

  return apiEndpoint;
}

const apiEndpoint = get_API_Endpoint();

async function fetchSchedule() {
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
    dayElement.setAttribute("data-day", day.day);

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = day.day;
    dayElement.appendChild(dayTitle);

    day.lessons.forEach((lesson) => {
      const lessonElement = document.createElement("p");
      lessonElement.textContent =
        `${lesson.time} - ${lesson.activity} (${lesson.location})` +
        (lesson.note ? ` [${lesson.note}]` : "");
      // for debug!!! lesson.note
      lesson.note
        ? console.log(
            `Lesson with note: ${lesson.time} - ${lesson.activity} (${lesson.location}) [${lesson.note}]`
          )
        : "";

      dayElement.appendChild(lessonElement);
    });

    container.appendChild(dayElement);
  });
}

function getCurrentTimeInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function updateTime() {
  //******************* */
  // Override "today" and "currentTime" for testing
  /* const mockDate = new Date("2024-12-05T11:00:00"); // Set to desired date and time
  const mockDay = mockDate.getDay(); // Gets the day of the week (e.g., 2 for Otrdiena)
  const mockTime = mockDate.getHours() * 60 + mockDate.getMinutes(); // Converts to total minutes
  today = days[mockDay];
  now = mockDate;
  currentTime = mockTime; */

  now = new Date();
  today = days[now.getDay()];
  currentTime = now.getHours() * 60 + now.getMinutes();
  //******************* */

  const dayName = days[now.getDay()];
  const dayDate = now.getDate();
  const month = `${months[now.getMonth()]}`;

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const time = `${hours}:${minutes}`;

  document.getElementById("current-time").innerHTML = time;
  document.getElementById("current-date").innerHTML = dayDate;
  document.getElementById("current-day").innerHTML = dayName;
  document.getElementById("current-month").innerHTML = month;
}

function getCurrentLesson(schedule) {
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

function highlightCurrentLesson(schedule) {
  const scheduleContainer = document.getElementById("schedule-container");
  const currentLesson = getCurrentLesson(schedule);

  const currentLessonText = currentLesson
    ? `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})` +
      (currentLesson.note ? ` [${currentLesson.note}]` : "")
    : "Šobrīd stundas nenotiek.";

  const currentLessonDiv = document.querySelector(".current-lesson");
  if (currentLessonDiv) {
    currentLessonDiv.textContent = currentLessonText;
  }

  scheduleContainer.querySelectorAll(".highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  if (currentLesson) {
    const daySection = Array.from(
      scheduleContainer.querySelectorAll(".day")
    ).find((el) => el.querySelector("h3").textContent.includes(today));

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

// Function to scroll to the current day's section
function scrollToCurrentDay() {
  const currentDay = document.getElementById("current-day").textContent.trim();
  const daySection = document.querySelector(`.day[data-day="${currentDay}"]`);

  if (daySection) {
    daySection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    console.log(`No schedule found for ${currentDay}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let schedule = null;

  // Initialize the clock
  setInterval(updateTime, 1000);
  updateTime();

  fetchSchedule()
    .then((data) => {
      schedule = data;
      displaySchedule(schedule);

      setInterval(() => highlightCurrentLesson(schedule), 1000);
      highlightCurrentLesson(schedule);
    })
    .catch((error) => {
      console.error("Error fetching or displaying schedule:", error);
    });

  // Handle current time container click
  const currentTimeContainer = document.querySelector(
    ".current-time-container"
  );
  if (currentTimeContainer) {
    currentTimeContainer.addEventListener("click", scrollToCurrentDay);
  }

  // Handle current lesson container click
  const currentLessonDiv = document.querySelector(".current-lesson");

  if (currentLessonDiv) {
    currentLessonDiv.addEventListener("click", () => {
      const lessonText = currentLessonDiv.textContent.trim();
      if (lessonText === "Šobrīd stundas nenotiek.") {
        console.log(
          "Šobrīd stundas nenotiek., skipojam tīšanu uz neeksistējošu vietu."
        );
        return;
      }

      const currentDay = document
        .getElementById("current-day")
        .textContent.trim();

      const container = document.getElementById("schedule-container");
      const daySection = Array.from(container.querySelectorAll(".day")).find(
        (el) => el.querySelector("h3").textContent.includes(currentDay)
      );

      if (daySection) {
        daySection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        console.log(`No schedule found for ${currentDay}`);
      }
    });
  }

  // Get the button element
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  // Show the button when scrolling down
  window.onscroll = () => {
    if (
      document.body.scrollTop > 100 ||
      document.documentElement.scrollTop > 100
    ) {
      scrollToTopBtn.style.display = "block";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  };

  // Scroll to the top when the button is clicked
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

console.log(1, `API constant: ${API}`);
console.log(2, `Current page path: ${window.location.pathname}`);
console.log(3, `Generated API endpoint: ${apiEndpoint}`);

console.log(
  4,
  "Schedule container exists:",
  !!document.getElementById("schedule-container")
);
console.log(
  5,
  "Current time element exists:",
  !!document.getElementById("current-time")
);
