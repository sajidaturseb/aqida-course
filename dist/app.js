(function () {
  "use strict";

  const catalog = window.AQIDA_QUIZ_DATA;
  const program = window.AQIDA_COURSE;
  const app = document.getElementById("app");
  const homeButton = document.getElementById("homeButton");
  const bestScore = document.getElementById("bestScore");
  const languageSwitch = document.getElementById("languageSwitch");
  const params = new URLSearchParams(window.location.search);
  const requestedCourseId = Number(params.get("course")) || 2;
  const requestedLessonId = Number(params.get("lesson"));
  let currentLang = params.get("lang") === "ru" && requestedCourseId === 2 ? "ru" : "tt";
  const russianLessons = window.AQIDA_COURSE_2_RU || {};
  const resultsEndpoint = window.AQIDA_RESULTS_ENDPOINT || "";
  let activeCourseId = catalog.courses.some((item) => item.id === requestedCourseId) ? requestedCourseId : 2;
  const assignedGroup = allowedGroups(activeCourseId).has(params.get("group")) ? params.get("group") : "";
  let lockedLesson = requestedLessonId ? findLesson(activeCourseId, requestedLessonId) : null;
  let state = { lesson: null, index: 0, answers: [], student: null, startedAt: null, attemptId: null };

  const ruUi = new Map([
    ["Гакыйдә курсы", "Курс акыды"],
    ["Уку юлы", "Порядок обучения"],
    ["5 бүлек • 25 дәрес", "5 разделов • 25 уроков"],
    ["Дәреслекнең күрсәтелгән битләрен укыгыз, аннары тестны үтәгез.", "Прочитайте указанные страницы учебника, затем пройдите тест."],
    ["Гакыйдә нигезләре", "Основы акыды"],
    ["Гакыйдә фәне, чыганаклар, гаклый һәм нәкъли дәлилләр.", "Наука об акыде, её источники, акли и накли далиль."],
    ["Ислам һәм иман", "Ислам и иман"],
    ["Аллаһы Тәгаләгә иман", "Вера во Всевышнего Аллаха"],
    ["Күркәм Исемнәр", "Прекрасные имена Аллаха"],
    ["Кабатлау һәм арадаш зачет", "Повторение и промежуточный зачёт"],
    ["Ислам, иман, мисак, фитри иман, көферлек һәм иманны камилләштерү.", "Ислам, иман, мисак, врождённая вера, неверие и укрепление веры."],
    ["Ихсан, Аллаһы Тәгаләне танып белү һәм Аның барлыгына дәлилләр.", "Ихсан, пути познания Аллаха и доводы Его существования."],
    ["Аллаһы Тәгаләнең Күркәм Исемнәрен дөрес әйтү, аңлау һәм ныгыту.", "Произношение, понимание и повторение Прекрасных имён Аллаха."],
    ["Икенче курсның төп темаларын берләштереп кабатлау.", "Общее повторение основных тем второго курса."],
    ["Гакыйдәне өйрәнүнең беренче елы", "Первый год изучения акыды"],
    ["Гакыйдәне өйрәнүнең икенче елы", "Второй год изучения акыды"],
    ["Укытучы өчен", "Для преподавателя"],
    ["Дәрес сылтамасы", "Ссылка на урок"],
    ["Укучы бу сылтамада башка дәресләрне күрмәячәк.", "По этой ссылке ученику будет открыт только выбранный урок."],
    ["Дәрес", "Урок"],
    ["Сылтаманы күчерергә", "Скопировать ссылку"],
    ["Укытучы журналын ачарга", "Открыть журнал преподавателя"],
    ["Теманы укыгыз", "Изучите тему"],
    ["Кабатлау", "Повторение"],
    ["Тест", "Тест"],
    ["Дәрес тесты", "Тест урока"],
    ["Дәреслекнең күрсәтелгән битләре белән эшләдем", "Я изучила указанные страницы учебника"],
    ["Исем һәм фамилия", "Имя и фамилия"],
    ["Тестны башларга", "Начать тест"],
    ["Беренче дәресне ачарга", "Открыть первый урок"],
    ["Дәвам итәргә", "Продолжить"],
    ["Тесттан чыгу", "Выйти из теста"],
    ["Артка", "Назад"],
    ["Алга", "Далее"],
    ["Нәтиҗәне күрсәтергә", "Показать результат"],
    ["Тест тәмамланды", "Тест завершён"],
    ["Дәрес башына", "К началу урока"],
    ["Башка дәрес", "Другой урок"],
    ["Тагын бер тапкыр", "Пройти ещё раз"],
    ["Нәтиҗә", "Результат"],
    ["Нәтиҗә җибәрелә…", "Результат отправляется…"],
    ["Нәтиҗә, исем һәм группа укытучы журналына җибәрелә.", "Результат, имя и группа отправляются в журнал преподавателя."]
  ]);
  function ruActive() { return currentLang === "ru" && activeCourseId === 2; }
  function questionCountRu(count) {
    const lastTwo = count % 100;
    const last = count % 10;
    return `${count} ${lastTwo >= 11 && lastTwo <= 14 ? "вопросов" : last === 1 ? "вопрос" : last >= 2 && last <= 4 ? "вопроса" : "вопросов"}`;
  }
  function bookTitle() { return ruActive() ? "Акыда. Просто о сложном" : program.bookTitle; }
  function localizeLesson(lesson) {
    const translated = ruActive() && lesson.course === 2 && russianLessons[lesson.id];
    if (!translated) return lesson;
    if (translated.questions.length !== lesson.questions.length) throw new Error(`Incomplete translation for lesson ${lesson.id}`);
    return {
      ...lesson, ...translated,
      questions: lesson.questions.map((question, index) => {
        const questionRu = translated.questions[index];
        if (questionRu.options.length !== question.options.length) throw new Error(`Incomplete options for lesson ${lesson.id}, question ${index + 1}`);
        return {...question, text: questionRu.text, options: question.options.map((option, optionIndex) => ({...option, text: questionRu.options[optionIndex]}))};
      })
    };
  }
  function translateUiTree(root) {
    if (!ruActive()) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = node.nodeValue;
      const trimmed = original.trim();
      let translated = ruUi.get(trimmed);
      if (!translated) translated = trimmed.replace(/^(\d+) нче курс$/, "Курс $1").replace(/^(\d+) нче дәрес$/, "Урок $1").replace(/^(\d+) нче сорау$/, "Вопрос $1").replace(/^(\d+) сорау$/, (_, count) => questionCountRu(Number(count))).replace(/^([\d, –-]+) нче бит$/, "стр. $1");
      if (translated !== trimmed) node.nodeValue = original.replace(trimmed, translated);
    }
  }
  function updateChrome() {
    languageSwitch.hidden = activeCourseId !== 2;
    languageSwitch.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lang === currentLang)));
    document.documentElement.lang = ruActive() ? "ru" : "tt";
    document.getElementById("brandName").textContent = ruActive() ? "Курс акыды" : "Гакыйдә курсы";
    homeButton.setAttribute("aria-label", ruActive() ? "Вернуться к началу" : "Баш биткә кайту");
    document.getElementById("pageFooter").textContent = ruActive() ? "Онлайн-курс по учебнику «Акыда. Просто о сложном»" : "«Гакыйдә. Җиңел юл белән аңлау һәм өйрәнү» дәреслеге буенча онлайн курс";
    document.title = ruActive() ? "Курс акыды — русский вариант" : "Гакыйдә курсы";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }
  function groupSections(courseId) {
    return [
      { label: `${courseId} курс`, count: 8 },
      { label: `Онлайн ${courseId} курс`, count: 10 }
    ];
  }
  function allowedGroups(courseId) {
    return new Set(groupSections(courseId).flatMap(({ label, count }) =>
      Array.from({ length: count }, (_, index) => `${label} — ${index + 1} группа`)));
  }
  function groupOptions(courseId, placeholder) {
    return `<option value="">${escapeHtml(placeholder)}</option>` + groupSections(courseId).map(({ label, count }) =>
      `<optgroup label="${escapeHtml(label)}">${Array.from({ length: count }, (_, index) => {
        const value = `${label} — ${index + 1} группа`;
        return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
      }).join("")}</optgroup>`).join("");
  }
  function courseData(courseId = activeCourseId) { return catalog.courses.find((item) => item.id === courseId); }
  function courseProgram(courseId = activeCourseId) { return program.courses.find((item) => item.id === courseId); }
  function findLesson(courseId, lessonId) {
    const selected = catalog.courses.find((item) => item.id === courseId);
    const lesson = selected ? selected.lessons.find((item) => item.id === lessonId) || null : null;
    return lesson ? localizeLesson(lesson) : null;
  }
  function getModule(lesson) {
    const selected = courseProgram(lesson.course);
    return selected ? selected.modules.find((module) => module.lessonIds.includes(lesson.id)) : null;
  }
  function storageKey(kind) { return `aqida-${kind}-${activeCourseId}`; }
  function getBest() { try { return JSON.parse(localStorage.getItem("aqida-best") || "null"); } catch (_) { return null; } }
  function getCompleted() { try { return JSON.parse(localStorage.getItem(storageKey("completed")) || "{}"); } catch (_) { return {}; } }
  function markCompleted(lessonId, percent) {
    const completed = getCompleted();
    completed[lessonId] = Math.max(Number(completed[lessonId]) || 0, percent);
    localStorage.setItem(storageKey("completed"), JSON.stringify(completed));
  }
  function setBest(score, total) {
    const current = getBest();
    const ratio = score / total;
    if (!current || ratio > current.ratio) localStorage.setItem("aqida-best", JSON.stringify({ score, total, ratio }));
    renderBest();
  }
  function renderBest() {
    const best = getBest();
    bestScore.textContent = best ? (ruActive() ? `Лучший результат: ${Math.round(best.ratio * 100)}%` : `Иң яхшы нәтиҗә: ${Math.round(best.ratio * 100)}%`) : "";
  }
  function focusMain() {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function lessonUrl(courseId, lessonId, group) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("course", courseId);
    if (lessonId) url.searchParams.set("lesson", lessonId);
    if (currentLang === "ru" && courseId === 2) url.searchParams.set("lang", "ru");
    if (group) url.searchParams.set("group", group);
    return url.toString();
  }
  function selectCourse(courseId) {
    activeCourseId = courseId;
    if (courseId !== 2) currentLang = "tt";
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("course", courseId);
    if (ruActive()) url.searchParams.set("lang", "ru");
    history.replaceState(null, "", url);
    renderHome();
  }
  function renderLessonCards(module, completed) {
    return module.lessonIds.map((lessonId) => {
      const lesson = findLesson(activeCourseId, lessonId);
      const score = completed[lessonId];
      const stateClass = score >= 70 ? " completed" : (score !== undefined ? " attempted" : "");
      const status = score !== undefined ? `<span class="lesson-score">${score}%</span>` : '<span class="lesson-arrow" aria-hidden="true">→</span>';
      const translated = ruActive() && Boolean(russianLessons[lessonId]);
      const pageLabel = translated ? `Учебник: стр. ${escapeHtml(lesson.bookPages)}` : `Дәреслек: ${escapeHtml(lesson.bookPages)} нче бит`;
      const pendingLabel = ruActive() && !translated ? " • перевод готовится" : "";
      return `<a class="course-lesson${stateClass}" href="${escapeHtml(lessonUrl(activeCourseId, lessonId))}"><span class="lesson-index">${lessonId}</span><span class="lesson-name">${escapeHtml(lesson.title)}<small>${pageLabel}${pendingLabel}</small></span>${status}</a>`;
    }).join("");
  }
  async function copyLessonLink(lessonId) {
    const groupField = document.getElementById("shareGroup");
    const group = groupField && allowedGroups(activeCourseId).has(groupField.value) ? groupField.value : "";
    const link = lessonUrl(activeCourseId, lessonId, group);
    try { await navigator.clipboard.writeText(link); }
    catch (_) {
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    const status = document.getElementById("shareStatus");
    if (status) status.textContent = ruActive() ? "Ссылка скопирована" : "Сылтама күчерелде";
  }

  function renderLockedHome() {
    const lesson = lockedLesson;
    const module = getModule(lesson);
    const pageWord = /[–,-]/.test(lesson.bookPages) ? "битләрен" : "битен";
    app.innerHTML = `<section class="lesson-workspace"><div class="lesson-study">
      <nav class="lesson-breadcrumb" aria-label="Курс юлы"><span>${lesson.course} нче курс</span><span>•</span><span>${module ? escapeHtml(module.title) : "Йомгаклау"}</span></nav>
      <p class="eyebrow">${ruActive() ? `Курс ${lesson.course} • урок ${lesson.id}` : `${lesson.course} нче курс • ${lesson.id} нче дәрес`}</p><h1>${escapeHtml(lesson.title)}</h1>
      <p class="lead">${ruActive() ? `Урок основан на указанных страницах учебника «${escapeHtml(bookTitle())}».` : `Дәрес «${escapeHtml(bookTitle())}» дәреслегенең күрсәтелгән битләренә нигезләнгән.`}</p>
      <div class="study-steps"><article class="study-step"><span>1</span><div><h2>Теманы укыгыз</h2><p>${escapeHtml(lesson.summary || lesson.title)}</p></div></article>
      <article class="study-step book-step"><span>2</span><div><h2>«${escapeHtml(bookTitle())}»</h2><p>${ruActive() ? `Прочитайте страницы ${escapeHtml(lesson.bookPages)}.` : `${escapeHtml(lesson.bookPages)} нче ${pageWord} укыгыз.`}</p><strong>${ruActive() ? `Стр. ${escapeHtml(lesson.bookPages)}` : `${escapeHtml(lesson.bookPages)} нче бит`}</strong></div></article>
      <article class="study-step"><span>3</span><div><h2>Кабатлау</h2><p>${escapeHtml(lesson.practice || "Теманы кабатлагыз.")}</p></div></article>
      <article class="study-step"><span>4</span><div><h2>Тест</h2><p>${ruActive() ? `Ответьте на ${questionCountRu(lesson.questions.length)}.` : `${lesson.questions.length} сорауга җавап бирегез.`}</p></div></article></div></div>
      <div class="panel lesson-panel"><p class="eyebrow">Дәрес тесты</p><h2>${lesson.questions.length} сорау</h2><p class="panel-note">${ruActive() ? "Прочитайте указанные страницы учебника и начните тест." : "Дәреслекнең күрсәтелгән битләрен укыгыз һәм тестны башлагыз."}</p>
      <form id="studentForm"><label for="studentName">Исем һәм фамилия</label><input id="studentName" maxlength="80" autocomplete="name" required>
      ${assignedGroup ? `<p class="assigned-group"><span>Группа</span><strong>${escapeHtml(assignedGroup)}</strong></p>` : `<label for="studentGroup">Группа</label><select id="studentGroup" required>${groupOptions(activeCourseId, "Выберите группу")}</select>`}
      <label class="book-check"><input id="bookReady" type="checkbox" required><span>Дәреслекнең күрсәтелгән битләре белән эшләдем</span></label>
      <p class="privacy-note">Нәтиҗә, исем һәм группа укытучы журналына җибәрелә.</p><button class="primary" type="submit">Тестны башларга</button></form></div></section>`;
    updateChrome();
    translateUiTree(app);
    document.getElementById("studentForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("studentName").value.trim();
      const groupInput = document.getElementById("studentGroup");
      const group = assignedGroup || (groupInput ? groupInput.value : "");
      if (name && allowedGroups(activeCourseId).has(group)) startQuiz(lesson, { name, group });
    });
    focusMain();
  }

  function renderHome() {
    if (lockedLesson) return renderLockedHome();
    const selected = courseData();
    const selectedProgram = courseProgram();
    const completed = getCompleted();
    const completedCount = selected.lessons.filter((lesson) => completed[lesson.id] >= 70).length;
    const progress = Math.round(completedCount / selected.lessons.length * 100);
    const nextLesson = selected.lessons.find((lesson) => completed[lesson.id] < 70 || completed[lesson.id] === undefined) || selected.lessons[0];
    const tabs = catalog.courses.map((item) => `<button class="course-tab${item.id === activeCourseId ? " active" : ""}" type="button" data-course="${item.id}" aria-pressed="${item.id === activeCourseId}">${escapeHtml(item.title)}<small>${escapeHtml(item.yearLabel)}</small></button>`).join("");
    const modules = selectedProgram.modules.map((module, index) => {
      const done = module.lessonIds.filter((lessonId) => completed[lessonId] >= 70).length;
      const reviewModule = module.lessonIds.length === 1 && module.lessonIds[0] === 25;
      const pagesLabel = reviewModule ? (ruActive() ? "уроки 1–24" : "1–24 нче дәресләр") : (ruActive() ? `стр. ${escapeHtml(module.bookPages)}` : `${escapeHtml(module.bookPages)} нче бит`);
      return `<details class="course-module" ${index === 0 ? "open" : ""}><summary><span class="module-number">${module.number}</span><span class="module-copy"><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.description)}</small></span><span class="module-meta">${done}/${module.lessonIds.length}<small>${pagesLabel}</small></span></summary><div class="module-lessons">${renderLessonCards(module, completed)}</div></details>`;
    }).join("");
    const lessonOptions = selected.lessons.map((source) => { const lesson = findLesson(activeCourseId, source.id); return `<option value="${lesson.id}">${ruActive() ? `Урок ${lesson.id}` : `${lesson.id} нче дәрес`} — ${escapeHtml(lesson.title)}</option>`; }).join("");
    app.innerHTML = `<section class="course-home">
      <div class="course-intro"><div><p class="eyebrow">${ruActive() ? `По учебнику «${escapeHtml(bookTitle())}»` : `«${escapeHtml(bookTitle())}» буенча`}</p><h1>Гакыйдә курсы</h1><p class="lead">${ruActive() ? "Все 25 уроков второго курса доступны на русском языке. Третий курс пока остаётся на татарском." : "2 нче һәм 3 нче курслар. Һәр дәрестә дәреслек битләре һәм автоматик тикшерелә торган тест."}</p></div>
      <aside class="progress-card"><span class="progress-label">${ruActive() ? "Курс 2: пройдено" : `${escapeHtml(selected.title)}: алга китеш`}</span><strong>${completedCount} / ${selected.lessons.length}</strong><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-bar" style="width:${progress}%"></div></div><p>${ruActive() ? `${progress}% завершено` : `${progress}% тәмамланган`}</p><a class="primary button-link" href="${escapeHtml(lessonUrl(activeCourseId, nextLesson.id))}">${completedCount ? "Дәвам итәргә" : "Беренче дәресне ачарга"}</a></aside></div>
      <div class="course-tabs" aria-label="Курсны сайлау">${tabs}</div>
      <div class="course-layout"><div class="curriculum"><div class="section-heading"><div><p class="eyebrow">Уку юлы</p><h2>5 бүлек • 25 дәрес</h2></div><p>Дәреслекнең күрсәтелгән битләрен укыгыз, аннары тестны үтәгез.</p></div><div class="module-list">${modules}</div></div>
      <aside class="panel quick-panel"><p class="eyebrow">Укытучы өчен</p><h2>Дәрес сылтамасы</h2><p class="panel-note">Укучы бу сылтамада башка дәресләрне күрмәячәк.</p><label for="lessonSelect">Дәрес</label><select id="lessonSelect">${lessonOptions}</select><p class="lesson-meta" id="lessonMeta"></p><label class="share-group-label" for="shareGroup">Группа</label><select id="shareGroup">${groupOptions(activeCourseId, "Группу выберет ученик")}</select><button class="primary share-button" id="shareButton" type="button">Сылтаманы күчерергә</button><p class="share-status" id="shareStatus" aria-live="polite"></p><a class="teacher-link" href="teacher.html">Укытучы журналын ачарга</a></aside></div></section>`;
    app.querySelectorAll(".course-tab").forEach((button) => button.addEventListener("click", () => selectCourse(Number(button.dataset.course))));
    const select = document.getElementById("lessonSelect");
    const meta = document.getElementById("lessonMeta");
    const updateMeta = () => { const lesson = findLesson(activeCourseId, Number(select.value)); meta.textContent = ruActive() ? `${questionCountRu(lesson.questions.length)} • стр. ${lesson.bookPages}` : `${lesson.questions.length} сорау • ${lesson.bookPages} нче бит`; };
    select.addEventListener("change", updateMeta);
    document.getElementById("shareButton").addEventListener("click", () => copyLessonLink(Number(select.value)));
    updateMeta();
    updateChrome();
    translateUiTree(app);
    focusMain();
  }

  function startQuiz(lesson, student) {
    state = { lesson, index: 0, answers: [], student: student || null, startedAt: Date.now(), attemptId: self.crypto && self.crypto.randomUUID ? self.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}` };
    renderQuestion();
  }

  function renderQuestion() {
    const question = state.lesson.questions[state.index];
    const selected = state.answers[state.index] || "";
    const progress = (state.index + 1) / state.lesson.questions.length * 100;
    const options = question.options.map((option) => `<button class="option ${selected === option.key ? "selected" : ""}" type="button" data-key="${option.key}" aria-pressed="${selected === option.key}"><span class="option-key">${option.key}</span><span>${escapeHtml(option.text)}</span></button>`).join("");
    app.innerHTML = `<section class="quiz-wrap"><div class="quiz-head"><div class="quiz-head-row"><span class="quiz-title">${ruActive() ? `Курс ${state.lesson.course} • урок ${state.lesson.id}` : `${state.lesson.course} нче курс • ${state.lesson.id} нче дәрес`}</span><span>${state.index + 1} / ${state.lesson.questions.length}</span></div><div class="progress-track" role="progressbar" aria-valuemax="${state.lesson.questions.length}" aria-valuenow="${state.index + 1}"><div class="progress-bar" style="width:${progress}%"></div></div></div><div class="quiz-card"><p class="question-number">${state.index + 1} нче сорау</p><h2 class="question-text">${escapeHtml(question.text)}</h2><div class="options">${options}</div><div class="quiz-actions"><button class="secondary" id="backButton" type="button">${state.index === 0 ? "Тесттан чыгу" : "Артка"}</button><button class="primary" id="nextButton" type="button" ${selected ? "" : "disabled"}>${state.index === state.lesson.questions.length - 1 ? "Нәтиҗәне күрсәтергә" : "Алга"}</button></div></div></section>`;
    updateChrome();
    translateUiTree(app);
    app.querySelectorAll(".option").forEach((button) => button.addEventListener("click", () => { state.answers[state.index] = button.dataset.key; renderQuestion(); }));
    document.getElementById("backButton").addEventListener("click", () => { if (state.index === 0) renderHome(); else { state.index -= 1; renderQuestion(); } });
    document.getElementById("nextButton").addEventListener("click", () => { if (!state.answers[state.index]) return; if (state.index === state.lesson.questions.length - 1) renderResults(); else { state.index += 1; renderQuestion(); } });
    focusMain();
  }

  function renderResults() {
    const total = state.lesson.questions.length;
    const score = state.lesson.questions.reduce((sum, question, index) => sum + (state.answers[index] === question.answer ? 1 : 0), 0);
    const percent = Math.round(score / total * 100);
    setBest(score, total);
    markCompleted(state.lesson.id, percent);
    const mistakes = state.lesson.questions.map((question, index) => ({ question, answer: state.answers[index] })).filter((item) => item.answer !== item.question.answer);
    const review = mistakes.length ? mistakes.map((item) => {
      const chosen = item.question.options.find((option) => option.key === item.answer);
      const correct = item.question.options.find((option) => option.key === item.question.answer);
      return `<div class="review-item"><strong>${escapeHtml(item.question.text)}</strong><br>${ruActive() ? "Ваш ответ" : "Сезнең җавап"}: ${escapeHtml(chosen ? chosen.text : (ruActive() ? "нет ответа" : "җавап юк"))}<span>${ruActive() ? "Правильный ответ" : "Дөрес җавап"}: ${escapeHtml(correct.text)}</span></div>`;
    }).join("") : `<p class="perfect">${ruActive() ? "Все ответы верны. Отлично!" : "Барлык җаваплар да дөрес. Афәрин!"}</p>`;
    const message = ruActive()
      ? (percent >= 90 ? "Отличный результат!" : percent >= 70 ? "Хороший результат. Просмотрите ошибки." : "Рекомендуем ещё раз повторить тему.")
      : (percent >= 90 ? "Бик яхшы нәтиҗә. Белемнәрегез нык!" : percent >= 70 ? "Яхшы нәтиҗә. Хаталарны карап чыгыгыз." : "Теманы тагын бер кабатларга киңәш итәбез.");
    app.innerHTML = `<section class="result-card"><div class="result-top"><div class="score-ring" style="--score:${percent * 3.6}deg"><strong>${percent}%</strong></div><div><p class="eyebrow">Тест тәмамланды</p><h2>${ruActive() ? `${score} / ${total} правильных ответов` : `${score} / ${total} дөрес`}</h2><p class="result-summary">${message}</p></div></div><div class="result-actions"><button class="secondary" id="homeResult" type="button">${lockedLesson ? "Дәрес башына" : "Башка дәрес"}</button><button class="primary" id="retryButton" type="button">Тагын бер тапкыр</button></div>${lockedLesson ? '<p class="submission-status" id="submissionStatus" aria-live="polite">Нәтиҗә җибәрелә…</p>' : ""}<div class="review"><h3>${mistakes.length ? (ruActive() ? `Разбор ошибок (${mistakes.length})` : `Хаталар өстендә эш (${mistakes.length})`) : "Нәтиҗә"}</h3><div class="review-list">${review}</div></div></section>`;
    updateChrome();
    translateUiTree(app);
    document.getElementById("homeResult").addEventListener("click", renderHome);
    document.getElementById("retryButton").addEventListener("click", () => startQuiz(state.lesson, state.student));
    if (lockedLesson && state.student) submitResult(score, total, percent);
    focusMain();
  }

  async function submitResult(score, total, percent) {
    const status = document.getElementById("submissionStatus");
    if (!resultsEndpoint) {
      if (status) status.textContent = ruActive() ? "Отправка результатов временно не настроена." : "Нәтиҗәләрне җибәрү вакытлыча көйләнмәгән.";
      return;
    }
    const payload = {
      studentName: state.student.name,
      group: state.student.group,
      courseId: state.lesson.course,
      lessonId: state.lesson.id,
      lessonTitle: catalog.courses.find((course) => course.id === state.lesson.course).lessons.find((item) => item.id === state.lesson.id).title,
      score, total, percent,
      durationSeconds: Math.max(1, Math.round((Date.now() - state.startedAt) / 1000)),
      attemptId: state.attemptId,
      answers: state.lesson.questions.map((question, index) => ({ number: question.number, selected: state.answers[index] || "", correct: question.answer, isCorrect: state.answers[index] === question.answer }))
    };
    try {
      const response = await fetch(resultsEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "request_failed");
      if (status) status.textContent = ruActive() ? "Результат отправлен преподавателю." : "Нәтиҗә укытучыга җибәрелде.";
    } catch (_) {
      if (status) status.textContent = ruActive() ? "Не удалось отправить результат. Проверьте соединение и попробуйте ещё раз." : "Нәтиҗәне җибәреп булмады. Интернетны тикшереп, кабатлап карагыз.";
    }
  }

  homeButton.addEventListener("click", renderHome);
  languageSwitch.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    if (activeCourseId !== 2 || currentLang === button.dataset.lang) return;
    currentLang = button.dataset.lang;
    const url = new URL(window.location.href);
    if (ruActive()) url.searchParams.set("lang", "ru");
    else url.searchParams.delete("lang");
    history.replaceState(null, "", url);
    lockedLesson = requestedLessonId ? findLesson(activeCourseId, requestedLessonId) : null;
    renderBest();
    renderHome();
  }));
  renderBest();
  renderHome();
})();
