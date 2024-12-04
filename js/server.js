import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 3000;

const app = express();

let apiUrl;

if (PORT !== 3000) {
  apiUrl = "https://scheduletracker-v1xz.onrender.com";
  app.use(
    cors({
      origin: `${apiUrl}`,
      methods: ["GET", "POST"],
    })
  );
} else {
  apiUrl = `http://localhost:${PORT}`;
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST"],
    })
  );
}

console.log(`API URL is set to: ${apiUrl} with PORT: ${PORT}`);

const __dirname = new URL(".", import.meta.url).pathname;
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

function parseSchedule(rawData) {
  const lines = rawData.split("\n");
  const schedule = [];
  let currentDay = null;
  let currentDayLessons = [];

  lines.forEach((line) => {
    line = line.trim();
    // Check if the line is a day name
    if (
      /^Pirmdiena|Otrdiena|Trešdiena|Ceturtdiena|Piektdiena|Sestdiena$/i.test(
        line
      )
    ) {
      if (currentDay) {
        schedule.push({
          day: currentDay,
          lessons: currentDayLessons,
        });
      }

      // Start a new day
      currentDay = line;
      currentDayLessons = [];
    } else if (line) {
      // Match the lesson details
      const match = line.match(
        /^(\d{2}:\d{2} - \d{2}:\d{2})\s+"([^"]+)"\s+"([^"]+)"\s*(?:#(.+))?$/
      );
      if (match) {
        const [, time, activity, location, note] = match;
        currentDayLessons.push({
          time,
          activity,
          location,
          note: note || "", // Default to an empty string if no note is provided
        });
      } else {
        console.log(`No match for line: "${line}"`); // Debugging
      }
    }
  });

  // Push the last day's lessons to the schedule
  if (currentDay) {
    schedule.push({
      day: currentDay,
      lessons: currentDayLessons,
    });
  }
  return schedule;
}

app.get("/api/paula", (req, res) => {
  const filePath = "./txtSchedules/paula.txt";
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({error: "File paula.txt not found."});
  }
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const schedule = parseSchedule(rawData);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({error: "Failed to read schedule file."});
  }
});

app.get("/api/toms", (req, res) => {
  const filePath = "./txtSchedules/toms.txt";

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({error: "File toms.txt not found."});
  }

  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const schedule = parseSchedule(rawData);
    res.json(schedule);
  } catch (error) {
    console.error("Error reading or parsing file:", error.message);
    res.status(500).json({error: "Failed to read Toms schedule file."});
  }
});

app.listen(PORT, () => {
  console.log(`Server is runninggg on http://localhost:${PORT}`);
});
