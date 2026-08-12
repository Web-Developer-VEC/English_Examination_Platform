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

module.exports = { toIST };