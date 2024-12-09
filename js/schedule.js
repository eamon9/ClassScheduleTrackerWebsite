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
  const currentPage = $(location).attr("pathname");
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
  const $lessonElement = $("<p></p>");
  $lessonElement.text(
    `${lesson.time} - ${lesson.activity} (${lesson.location})`
  );

  if (lesson.note) {
    $lessonElement.append(` [${lesson.note}]`);
  }

  const breakActivities = ["starpbrīdis", "došanās", "brīvais"];
  const isBreak = breakActivities.some((activity) =>
    lesson.activity.toLowerCase().includes(activity)
  );

  if (isBreak) {
    $lessonElement.addClass("break hidden");
  } else if (lesson.activity.toLowerCase().includes("pusdienas")) {
    $lessonElement.addClass("lunch-break");
  }

  return $lessonElement;
}

// Display schedule for specific day
function displayDaySchedule(daySchedule) {
  const $container = $("#schedule-container");
  const $dayElement = $("<div></div>")
    .addClass("day")
    .attr("data-day", daySchedule.day);

  const $dayTitle = $("<h3></h3>").text(daySchedule.day);
  $dayElement.append($dayTitle);

  daySchedule.lessons.forEach((lesson) => {
    const $lessonElement = createLessonElement(lesson);
    $dayElement.append($lessonElement);
  });

  $container.append($dayElement);
}

// Display the full schedule
function displayWeeksSchedule(scheduleData) {
  const $container = $("#schedule-container");
  $container.empty();

  scheduleData.forEach((day) => displayDaySchedule(day));
}

// Display today's schedule
function displayTodaysSchedule(scheduleData) {
  const $todaySchedule = scheduleData.find((day) => day.day === today);
  const $container = $("#schedule-container");
  $container.empty();

  if ($todaySchedule) {
    displayDaySchedule($todaySchedule);
  } else {
    $("<p>Šodien nav stundu.</p>").appendTo($container);
  }
}

// Toggle visibility of breaks
function toggleBreaks() {
  $(".break").toggleClass("hidden");
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

  const time = `${hours}:${minutes}`;
  $("#current-time").html(time);
  $("#current-date").html(dayDate);
  $("#current-day").html(dayName);
  $("#current-month").html(month);
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
  const $scheduleContainer = $("#schedule-container");

  const currentLessonText = currentLesson
    ? `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})` +
      (currentLesson.note ? ` [${currentLesson.note}]` : "")
    : "Šobrīd stundas nenotiek.";

  $(".current-lesson").text(currentLessonText);

  $scheduleContainer.find(".highlight").removeClass("highlight");

  if (currentLesson) {
    const lessonText = `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})`;
    const $daySection = $scheduleContainer
      .find(".day")
      .filter((_, el) => $(el).find("h3").text().includes(today));

    if ($daySection.length) {
      const $lessonElement = $daySection
        .find("p")
        .filter((_, el) => $(el).text().includes(lessonText));
      $lessonElement.addClass("highlight");
    }
  }
}

// Scroll to the current day's section
function scrollToCurrentDay() {
  const currentDay = $("#current-day").text().trim();
  const $daySection = $(`.day[data-day="${currentDay}"]`);
  if ($daySection.length) {
    $daySection[0].scrollIntoView({behavior: "smooth", block: "start"});
  }
}

const canvas = $("<canvas></canvas>").attr({width: 32, height: 32})[0];
const ctx = canvas.getContext("2d");

let frame = 0;

function drawFavicon() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, 2 * Math.PI);
  ctx.fillStyle = `hsl(${(frame * 20) % 360}, 100%, 50%)`;
  ctx.fill();

  $("#favicon").attr(
    "href",
    canvas.toDataURL("assets/images/animatedSchedule.gif")
  );

  frame++;
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
      setInterval(drawFavicon, 5000);
      highlightCurrentLesson(schedule);
    })
    .catch((error) => console.error("Error fetching schedule:", error));

  $("#toggle-breaks").on("click", toggleBreaks);
  $("#todaysBtn").on("click", () => displayTodaysSchedule(schedule));
  $("#thisWeekBtn").on("click", () => displayWeeksSchedule(schedule));

  $(".sub-cat").on("click", function () {
    $(".sub-cat").removeClass("active");
    $(this).addClass("active");
  });

  $(".current-time-container").on("click", scrollToCurrentDay);

  $(".current-lesson").on("click", function () {
    const lessonText = $(this).text().trim();
    if (lessonText === "Šobrīd stundas nenotiek.") {
      console.log(
        "Šobrīd stundas nenotiek., skipojam tīšanu uz neeksistējošu vietu."
      );
      return;
    }

    const currentDay = $("#current-day").text().trim();
    const $daySection = $("#schedule-container .day").filter((_, el) =>
      $(el).find("h3").text().includes(currentDay)
    );

    if ($daySection.length) {
      $daySection[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      console.log(`No schedule found for ${currentDay}`);
    }
  });

  const $scrollToTopBtn = $("#scrollToTopBtn");

  $(window).on("scroll", () => {
    if ($(window).scrollTop() > 100) {
      $scrollToTopBtn.show();
    } else {
      $scrollToTopBtn.hide();
    }
  });

  $scrollToTopBtn.on("click", () => {
    $("html, body").animate({scrollTop: 0}, "smooth");
  });
}

$(function () {
  init();
});
