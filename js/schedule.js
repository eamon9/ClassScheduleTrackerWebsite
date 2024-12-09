const API =
  window.location.hostname === "localhost"
    ? `http://localhost:3000`
    : `https://scheduletracker-v1xz.onrender.com`;

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

let schedule = null;
let today;
let now;
let currentTime;

// API Endpoint retrieval
function getAPIEndpoint() {
  const currentPage = window.location.pathname;
  if (currentPage.includes("paula")) {
    return `${API}/api/paula`;
  } else if (currentPage.includes("toms")) {
    return `${API}/api/toms`;
  } else {
    console.error("Unknown page");
    return null;
  }
}

// Fetch Schedule from API
async function fetchSchedule() {
  const apiEndpoint = getAPIEndpoint();
  if (!apiEndpoint) return;

  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching schedule:", error);
  }
}

// Format lesson details
function createLessonElement(lesson) {
  const lessonElement = document.createElement("p");
  lessonElement.textContent = `${lesson.time} - ${lesson.activity} (${lesson.location})`;

  if (lesson.note) {
    lessonElement.textContent += ` [${lesson.note}]`;
  }

  const breakActivities = ["starpbrīdis", "došanās", "brīvais"];
  const isBreak = breakActivities.some((activity) =>
    lesson.activity.toLowerCase().includes(activity)
  );

  if (isBreak) {
    lessonElement.classList.add("break");
    lessonElement.classList.add("hidden");
  } else if (lesson.activity.toLowerCase().includes("pusdienas")) {
    lessonElement.classList.add("lunch-break");
  }

  return lessonElement;
}

// Display schedule for specific day
function displayDaySchedule(daySchedule) {
  const container = document.getElementById("schedule-container");
  const dayElement = document.createElement("div");
  dayElement.classList.add("day");
  dayElement.setAttribute("data-day", daySchedule.day);

  const dayTitle = document.createElement("h3");
  dayTitle.textContent = daySchedule.day;
  dayElement.appendChild(dayTitle);

  daySchedule.lessons.forEach((lesson) => {
    const lessonElement = createLessonElement(lesson);
    dayElement.appendChild(lessonElement);
  });

  container.appendChild(dayElement);
}

// Display the full schedule
function displayWeeksSchedule(scheduleData) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  scheduleData.forEach((day) => displayDaySchedule(day));
}

// Display today's schedule
function displayTodaysSchedule(scheduleData) {
  const todaySchedule = scheduleData.find((day) => day.day === today);
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  if (todaySchedule) {
    displayDaySchedule(todaySchedule);
  } else {
    const noScheduleMessage = document.createElement("p");
    noScheduleMessage.textContent = "Šodien nav stundu.";
    container.appendChild(noScheduleMessage);
  }
}

// Toggle visibility of breaks
function toggleBreaks() {
  const breaks = document.querySelectorAll(".break");
  breaks.forEach((breakElement) => breakElement.classList.toggle("hidden"));
}

// Update the current time and date
function updateTime() {
  //******************* */
  // Override "today" and "currentTime" for testing
  /* const mockDate = new Date("2024-12-11T10:10:00"); // Set to desired date and time
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
  const month = months[now.getMonth()];

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const time = `${hours}:${minutes}`;
  document.getElementById("current-time").innerHTML = time;
  document.getElementById("current-date").innerHTML = dayDate;
  document.getElementById("current-day").innerHTML = dayName;
  document.getElementById("current-month").innerHTML = month;
}

// Get the current lesson based on the current time
function getCurrentLesson(scheduleData) {
  const todaySchedule = scheduleData.find((day) => day.day === today);
  if (!todaySchedule) return null;

  return todaySchedule.lessons.find((lesson) => {
    const [start, end] = lesson.time
      .split(" - ")
      .map((t) =>
        t.split(":").reduce((h, m) => parseInt(h) * 60 + parseInt(m), 0)
      );
    return currentTime >= start && currentTime < end;
  });
}

// Highlight the current lesson in the schedule
function highlightCurrentLesson(scheduleData) {
  const currentLesson = getCurrentLesson(scheduleData);
  const scheduleContainer = document.getElementById("schedule-container");

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
    const lessonText = `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})`;
    const daySection = Array.from(
      scheduleContainer.querySelectorAll(".day")
    ).find((el) => el.querySelector("h3").textContent.includes(today));

    if (daySection) {
      const lessonElement = Array.from(daySection.querySelectorAll("p")).find(
        (el) => el.textContent.includes(lessonText)
      );
      if (lessonElement) {
        lessonElement.classList.add("highlight");
      }
    }
  }
}

// Scroll to the current day's section
function scrollToCurrentDay() {
  const currentDay = document.getElementById("current-day").textContent.trim();
  const daySection = document.querySelector(`.day[data-day="${currentDay}"]`);
  if (daySection) {
    daySection.scrollIntoView({behavior: "smooth", block: "start"});
  }
}

// Initialize the app
function init() {
  setInterval(updateTime, 1000);
  updateTime();

  fetchSchedule()
    .then((data) => {
      schedule = data;
      displayTodaysSchedule(schedule);
      setInterval(() => highlightCurrentLesson(schedule), 1000);
      highlightCurrentLesson(schedule);
    })
    .catch((error) => console.error("Error fetching schedule:", error));

  const toggleBreaksBtn = document.getElementById("toggle-breaks");
  if (toggleBreaksBtn) {
    toggleBreaksBtn.addEventListener("click", toggleBreaks);
  }

  const todaysBtn = document.getElementById("todaysBtn");
  if (todaysBtn) {
    todaysBtn.addEventListener("click", () => displayTodaysSchedule(schedule));
  }

  const thisWeekBtn = document.getElementById("thisWeekBtn");
  if (thisWeekBtn) {
    thisWeekBtn.addEventListener("click", () => displayWeeksSchedule(schedule));
  }

  const navLink = document.querySelectorAll(".sub-cat");
  navLink.forEach((nav) => {
    nav.addEventListener("click", () => {
      navLink.forEach((btn) => btn.classList.remove("active"));

      nav.classList.add("active");
    });
  });

  const currentTimeContainer = document.querySelector(
    ".current-time-container"
  );
  if (currentTimeContainer) {
    currentTimeContainer.addEventListener("click", scrollToCurrentDay);
  }

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

  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

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

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
