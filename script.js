(() => {
  const STORAGE_KEY = "todo-app.tasks.v1";

  const form = document.getElementById("add-form");
  const input = document.getElementById("new-task");
  const list = document.getElementById("task-list");
  const empty = document.getElementById("empty");
  const summary = document.getElementById("summary");
  const clearDone = document.getElementById("clear-done");
  const filterButtons = document.querySelectorAll(".filters button");

  let tasks = load();
  let filter = "all";

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* storage unavailable: app still works for this session */
    }
  }

  function visibleTasks() {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }

  function render() {
    list.textContent = "";

    for (const task of visibleTasks()) {
      const li = document.createElement("li");
      li.className = "task" + (task.done ? " done" : "");
      li.dataset.id = task.id;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = task.done;
      check.setAttribute("aria-label", `Mark "${task.text}" as done`);
      check.addEventListener("change", () => toggle(task.id));

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;
      text.title = "Double-click to edit";
      text.addEventListener("dblclick", () => startEdit(li, task));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "task-delete";
      del.textContent = "Delete";
      del.setAttribute("aria-label", `Delete "${task.text}"`);
      del.addEventListener("click", () => remove(task.id));

      li.append(check, text, del);
      list.append(li);
    }

    const remaining = tasks.filter((t) => !t.done).length;
    summary.textContent = tasks.length
      ? `${remaining} of ${tasks.length} tasks left`
      : "Nothing planned yet.";

    const none = visibleTasks().length === 0;
    empty.hidden = !none;
    if (none) {
      empty.textContent = tasks.length
        ? filter === "done" ? "No completed tasks yet." : "Everything is done."
        : "Add your first task above.";
    }

    clearDone.hidden = !tasks.some((t) => t.done);

    filterButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.filter === filter))
    );
  }

  function add(text) {
    tasks.unshift({ id: crypto.randomUUID(), text, done: false });
    save();
    render();
  }

  function toggle(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) task.done = !task.done;
    save();
    render();
  }

  function remove(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function startEdit(li, task) {
    const editor = document.createElement("input");
    editor.type = "text";
    editor.className = "task-edit";
    editor.value = task.text;
    editor.maxLength = 200;
    editor.setAttribute("aria-label", "Edit task");

    const textEl = li.querySelector(".task-text");
    textEl.replaceWith(editor);
    editor.focus();
    editor.select();

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      const value = editor.value.trim();
      if (commit && value) task.text = value;
      save();
      render();
    };

    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    editor.addEventListener("blur", () => finish(true));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    add(text);
    input.value = "";
    input.focus();
  });

  filterButtons.forEach((b) =>
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      render();
    })
  );

  clearDone.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  });

  render();
})();
