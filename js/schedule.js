// Vispārīga funkcija, kas fetch un attēlo grafiku
async function fetchSchedule() {
  const currentPage = window.location.pathname;


  let apiEndpoint;

  // Izvēlas pareizo API endpointu atbilstoši lapai
  if (currentPage.includes("paula")) {
    apiEndpoint = "https://scheduletracker-v1xz.onrender.com/api/paula"; // Paula API
  } else if (currentPage.includes("toms")) {
    apiEndpoint = "https://scheduletracker-v1xz.onrender.com/api/toms"; // Toms API
  } else {
    console.error("Unknown page");
    return; // Atgriežas, ja lapas nav ne Paula, ne Toms
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

// Vispārīga funkcija grafika attēlošanai
function displaySchedule(schedule) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = ""; // Clear previous content

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

// Funkcija, kas attēlo grafiku, izmantojot API galapunktu
function showSchedule(apiEndpoint) {
  fetchSchedule(apiEndpoint)
    .then((schedule) => {
      displaySchedule(schedule);
    })
    .catch((error) => {
      console.error("Error fetching or displaying schedule:", error);
    });
}

// Funkcija, kas attēlo tekošo laiku un datumu
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

// Izsauc grafikus un laiku katram atsevišķam gadījumam
document.addEventListener("DOMContentLoaded", () => {
  // Izsauc Paulas grafiku
  showSchedule("https://scheduletracker-v1xz.onrender.com/api/paula");

  // Izsauc Toma grafiku
  showSchedule("https://scheduletracker-v1xz.onrender.com/api/toms");

  // Atjaunina laiku katru sekundi
  setInterval(updateTime, 1000);
  updateTime();
});

// ***********************************

// Funkcija, lai atrastu šobrīd notiekošo stundu
function getCurrentLesson(schedule) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Laiks minūtēs
  const today = getTodayName(); // Šodienas diena, piemēram, "Trešdiena"

  // Atrod šodienas grafiku
  const todaySchedule = schedule.find((day) => day.day === today);

  if (!todaySchedule) {
    return null; // Ja šodien nav grafika, atgriež null
  }

  // Atrod pašreizējo stundu
  const currentLesson = todaySchedule.lessons.find((lesson) => {
    const [start, end] = lesson.time
      .split(" - ")
      .map((t) =>
        t.split(":").reduce((h, m) => parseInt(h) * 60 + parseInt(m), 0)
      );
    return currentTime >= start && currentTime < end; // Salīdzina laikus
  });

  return currentLesson || null; // Atgriež pašreizējo stundu vai null
}


// Funkcija, lai iegūtu šodienas nosaukumu
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

// Funkcija, lai parādītu pašreizējo stundu
function highlightCurrentLesson(schedule) {
  const container = document.getElementById("schedule-container");
  const currentLesson = getCurrentLesson(schedule);

  // Atjauno "Šobrīd notiek" tekstu
  const currentLessonText = currentLesson
    ? `${currentLesson.time} - ${currentLesson.activity} (${currentLesson.location})`
    : "Šobrīd nav neviena stunda.";
  document.querySelector(".current-lesson").textContent = currentLessonText;

  // Notīra iepriekšējos izcēlumus
  container.querySelectorAll(".highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  // Izceļ pašreizējo stundu tikai šodienas grafika ietvaros
  if (currentLesson) {
    const today = getTodayName(); // Šodienas diena
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


// Sauc funkciju regulāri
document.addEventListener("DOMContentLoaded", () => {
  fetchSchedule()
    .then((schedule) => {
      displaySchedule(schedule);

      // Pārbauda pašreizējo stundu ik pēc 1 sekundes
      setInterval(() => highlightCurrentLesson(schedule), 1000);
      highlightCurrentLesson(schedule);
    })
    .catch((error) => {
      console.error("Error fetching or displaying schedule:", error);
    });
});

/* setInterval(() => highlightCurrentLesson(schedule), 1000); // Atjauno reizi sekundē
highlightCurrentLesson(schedule); */