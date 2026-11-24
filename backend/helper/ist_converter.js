const toIST = (date) => {
  const d = new Date(date);

  const ist = new Date(
    d.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    }),
  );

  const pad = (n) => String(n).padStart(2, "0");

  return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}+05:30`;
};

// 8:30 AM in minutes from midnight = 8 * 60 + 30 = 510
const EXAM_START_MINUTES_IST = 510;

// 5:00 PM in minutes from midnight = 17 * 60 = 1020
const EXAM_END_MINUTES_IST = 1020;

const getISTDate = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const getISTMinutes = (date = new Date()) => {
  const ist = getISTDate(date);
  return ist.getHours() * 60 + ist.getMinutes();
};

const isWithinExamHoursIST = (date = new Date()) => {
  const minutes = getISTMinutes(date);
  return minutes >= EXAM_START_MINUTES_IST && minutes < EXAM_END_MINUTES_IST;
};

module.exports = {
  toIST,
  getISTDate,
  getISTMinutes,
  isWithinExamHoursIST,
  EXAM_START_MINUTES_IST,
  EXAM_END_MINUTES_IST,
};