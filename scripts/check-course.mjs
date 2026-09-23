import fs from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
for (const file of ["dist/questions.js", "dist/course.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const data = context.window.AQIDA_QUIZ_DATA;
const course = context.window.AQIDA_COURSE;
if (!data || !course) throw new Error("Course data was not loaded");
if (data.courses.length !== 2) throw new Error("Expected two courses");

let lessons = 0;
let questions = 0;
for (const item of data.courses) {
  if (![2, 3].includes(item.id) || item.lessons.length !== 25) throw new Error(`Invalid course ${item.id}`);
  lessons += item.lessons.length;
  for (const lesson of item.lessons) {
    if (!lesson.title || !lesson.bookPages || !lesson.questions.length) throw new Error(`Incomplete lesson ${item.id}-${lesson.id}`);
    for (const question of lesson.questions) {
      if (!question.text || question.options.length < 2 || !question.options.some((option) => option.key === question.answer)) {
        throw new Error(`Invalid question ${item.id}-${lesson.id}-${question.number}`);
      }
      questions += 1;
    }
  }
}
if (lessons !== 50 || questions !== 528) throw new Error(`Unexpected totals: ${lessons} lessons, ${questions} questions`);
console.log(`Validated ${lessons} lessons and ${questions} automatic questions.`);
