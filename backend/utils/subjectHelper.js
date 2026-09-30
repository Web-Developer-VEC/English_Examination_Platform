/**
 * Resolves Subject Code and Subject Name based on the semester.
 * 
 * Sem 1 (Odd):  23EN102L - COMMUNICATIVE ENGLISH LABORATORY
 * Sem 2 (Even): 23EN104L - TECHNICAL ENGLISH LABORATORY
 */
const getSubjectDetails = (semester) => {
  const semStr = String(semester || "").trim().toLowerCase();

  if (
    semStr === "odd" ||
    semStr === "1" ||
    semStr === "sem1" ||
    semStr === "sem 1" ||
    semStr === "semester 1" ||
    semStr === "semester1" ||
    semStr === "i"
  ) {
    return {
      subjectCode: "23EN102L",
      subjectName: "COMMUNICATIVE ENGLISH LABORATORY",
      semesterTitle: "Semester 1",
    };
  }

  return {
    subjectCode: "23EN104L",
    subjectName: "TECHNICAL ENGLISH LABORATORY",
    semesterTitle: "Semester 2",
  };
};

module.exports = {
  getSubjectDetails,
};
