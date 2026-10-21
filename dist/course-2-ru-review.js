// The final review reuses exactly the questions from lessons 1–24, with options
// rearranged in the canonical Tatar data. Reuse their reviewed Russian wording.
(() => {
  const original = window.AQIDA_QUIZ_DATA.courses.find(item => item.id === 2).lessons;
  const russian = window.AQIDA_COURSE_2_RU;
  const prior = original.slice(0, 24).flatMap(lesson => lesson.questions.map((question, index) => ({ lesson, question, index })));
  const review = original.find(lesson => lesson.id === 25);
  const questions = review.questions.map((question) => {
    const match = prior.find(item => item.question.text === question.text);
    if (!match) throw new Error(`Review question is missing from source lessons: ${question.text}`);
    const translation = russian[match.lesson.id]?.questions[match.index];
    if (!translation) throw new Error(`Russian review source is missing: lesson ${match.lesson.id}`);
    const optionMap = new Map(match.question.options.map((option, index) => [option.text, translation.options[index]]));
    return {
      text: translation.text,
      options: question.options.map(option => {
        const translated = optionMap.get(option.text);
        if (!translated) throw new Error(`Review option is missing: ${option.text}`);
        return translated;
      })
    };
  });
  russian[25] = {
    title: "Повторение второго курса и промежуточный зачёт",
    summary: "Основы акыды, иман, вера во Всевышнего Аллаха и Его Прекрасные имена.",
    practice: "Повторите все темы перед зачётом.",
    outcome: "Системно знает материал второго курса.",
    bookPages: review.bookPages,
    questions
  };
})();
