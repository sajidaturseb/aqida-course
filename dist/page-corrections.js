// Align both language versions with the textbook pages used by their questions.
(() => {
  const course = window.AQIDA_QUIZ_DATA?.courses?.find((item) => item.id === 2);
  const modules = window.AQIDA_COURSE?.courses?.find((item) => item.id === 2)?.modules;
  if (!course) return;
  const pages = {
    4: "6–7, 9", 5: "10–12", 6: "13–16", 8: "18–20, 22",
    9: "23–25", 10: "26–28", 12: "31–35", 14: "38–40",
    15: "41–49", 16: "50, 52–55", 17: "56–63", 18: "51, 64–69",
    19: "71–76", 24: "71–73, 87–89",
    25: "2–6, 11, 15, 17–18, 25–26, 29, 32, 36, 39, 42, 51–55, 57, 71, 76, 81, 83, 85, 88"
  };
  for (const [number, range] of Object.entries(pages)) {
    const lesson = course.lessons.find(item => item.id === Number(number));
    if (lesson) lesson.bookPages = range;
  }
  // Agreed corrections to the Tatar source; the Russian version uses these same answer keys.
  const lesson19 = course.lessons.find(item => item.id === 19);
  if (lesson19) {
    for (const question of lesson19.questions) {
      for (const option of question.options) {
        if (option.text === "Әл-Мәлук") option.text = "Әл-Мәлик";
      }
    }
  }
  const lesson22 = course.lessons.find(item => item.id === 22);
  if (lesson22?.questions[2]) {
    lesson22.questions[2].text = "«Аллаһы Тәгалә — Хак, Аның барлыгы хакыйкый.» Бу аңлатма кайсы исемгә туры килә?";
  }
  if (modules) {
    ["2–7, 9", "10–35", "36, 38–69", "71–89", pages[25]].forEach((range, index) => {
      if (modules[index]) modules[index].bookPages = range;
    });
  }
})();
