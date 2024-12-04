import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

// Apkalpo statiskos failus no galvenās mapes
const __dirname = new URL(".", import.meta.url).pathname;
app.use(express.static(path.join(__dirname, '../')));

// Kalpo HTML failu
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));  // Pārliecinies, ka ceļš uz index.html ir pareizs
});

function parseSchedule(rawData) {
  const lines = rawData.split("\n");
  const schedule = [];
  let currentDay = null;
  let currentDayLessons = [];

  lines.forEach((line) => {
    line = line.trim();

    if (/^Pirmdiena|Otrdiena|Trešdiena|Ceturtdiena|Piektdiena$/i.test(line)) {
      if (currentDay) {
        schedule.push({
          day: currentDay,
          lessons: currentDayLessons,
        });
      }

      currentDay = line;
      currentDayLessons = [];
    } else if (line) {
      const match = line.match(
        /^(\d{2}:\d{2} - \d{2}:\d{2})\s+"([^"]+)"\s+"([^"]+)"$/
      );
      if (match) {
        const [, time, activity, location] = match;
        currentDayLessons.push({
          time,
          activity,
          location,
          note: "",
        });
      }
    }
  });

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
  const filePath = "./txtSchedules/toms.txt"; // Toms grafika fails

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({error: "File toms.txt not found."});
  }

  try {
    const rawData = fs.readFileSync(filePath, "utf-8"); // Nolasa Toms grafiku
    const schedule = parseSchedule(rawData); // Parsē grafiku
    res.json(schedule); // Nosūta JSON atbildi
  } catch (error) {
    console.error("Error reading or parsing file:", error.message);
    res.status(500).json({error: "Failed to read Toms schedule file."});
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
