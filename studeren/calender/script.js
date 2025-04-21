document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("openModal");
  const closeModalBtn = document.getElementById("closeModal");
  const addTaskBtn = document.getElementById("addTask");
  const taskInput = document.getElementById("taskInput");
  const taskDescription = document.getElementById("taskDescription");

  const manualModal = document.getElementById("manualModal");
  const manualTitle = document.getElementById("manualTitle");
  const manualDesc = document.getElementById("manualDesc");
  const manualStart = document.getElementById("manualStart");
  const manualEnd = document.getElementById("manualEnd");
  const confirmManualTask = document.getElementById("confirmManualTask");
  const closeManualModal = document.getElementById("closeManualModal");

  const taskModal = document.getElementById("taskModal");
  const taskEditTitle = document.getElementById("taskEditTitle");
  const taskEditDesc = document.getElementById("taskEditDesc");
  const taskColor = document.getElementById("taskColor");
  const saveTaskChanges = document.getElementById("saveTaskChanges");
  const markCompleteBtn = document.getElementById("markCompleteBtn");
  const deleteTaskBtn = document.getElementById("deleteTaskBtn");

  (async function () {
    try {
      const res = await fetch('https://api.froje.be/user', { credentials: 'include' });
      if (!res.ok) throw new Error();

      const user = await res.json();
      if (user.id !== "VZc7vn2XK5b7ubR2titjnGmBRJtUfQR8") throw new Error();

      // ✅ Auth passed, show page and restore anchor jump
      // Fix for anchor links not scrolling correctly after delayed display
      if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    } catch (e) {
      const fullPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem("loginRedirect", fullPath);
      window.location.href = '/login?redirect=' + encodeURIComponent(fullPath);
    }
  })();
  
let activeTaskId = null;

  const openList = document.getElementById("open-task-list");
  const completedList = document.getElementById("completed-task-list");

  function openModal() {
    modal.classList.remove("hidden");
    taskInput.value = "";
    taskDescription.value = "";
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  function toLocalISO(date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
  
  function openManualModal(dateStr, endStr = null, isAllDay = false) {
    const start = new Date(dateStr);
    manualStart.value = toLocalISO(start);
  
    let end;
    if (endStr) {
      end = new Date(endStr);
  
      if (isAllDay) {
        // Subtract 1 minute from midnight on the end day to represent the last minute of the previous day
        end = new Date(end.getTime() - 60 * 1000);
      }
    } else {
      end = new Date(start);
      end.setHours(end.getHours() + 1);
    }
  
    manualEnd.value = toLocalISO(end);
    manualTitle.value = "";
    manualDesc.value = "";
    manualModal.classList.remove("hidden");
  }
  
  

  function closeManual() {
    manualModal.classList.add("hidden");
  }

  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    firstDay: 1,
    locale: "nl",
    droppable: true,
    dropAccept: ".template-item",
    eventReceive: function(info) {
      const title = info.event.title;
      const color = info.draggedEl.style.backgroundColor || "#ff69b4";
      const dropDate = new Date(info.event.start);
      const viewType = calendar.view.type;
    
      let start = new Date(dropDate);
      let end;
    
      if (viewType === "dayGridMonth") {
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 0, 0);
      } else {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
    
      manualTitle.value = title;
      manualDesc.value = "";
      manualStart.value = toLocalISO(start);
      manualEnd.value = toLocalISO(end);
      document.getElementById("taskColor").value = color;
    
      // Clear all existing selected swatches
      colorSwatches.forEach(s => s.classList.remove("selected"));
    
      // Check if the dragged-in color already exists
      let found = false;
      colorSwatches.forEach(s => {
        if (s.dataset.color === color) {
          s.classList.add("selected");
          found = true;
        }
      });
    
      // If not found, create a new swatch dynamically
      if (!found) {
        const dynamicSwatch = document.createElement("div");
        dynamicSwatch.className = "color-swatch selected";
        dynamicSwatch.style.background = color;
        dynamicSwatch.dataset.color = color;
    
        dynamicSwatch.addEventListener("click", () => {
          colorSwatches.forEach(s => s.classList.remove("selected"));
          dynamicSwatch.classList.add("selected");
          const colorInput = document.getElementById("taskColor");
          colorInput.value = color;
        });
    
        document.getElementById("colorOptions").appendChild(dynamicSwatch);
      }
    
      info.event.remove(); // Remove calendar preview
      manualModal.classList.remove("hidden");
    },    
    
    datesSet: () => {
      calendar.refetchEvents();
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    buttonText: {
      today: "Vandaag",
      month: "Maand",
      week: "Week",
      day: "Dag",
      list: "Lijst",
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    slotLabelContent: function(arg) {
      const hour = arg.date.getHours().toString().padStart(2, '0');
      const minute = arg.date.getMinutes().toString().padStart(2, '0');
      return `${hour}.${minute}u`;
    },
    allDayText: "Hele dag",
    nowIndicator: true,
    selectable: true,
    editable: true,
    selectable: true,
    select: (info) => {
      const isAllDay = info.allDay;
      const viewType = calendar.view.type;
    
      let adjustedStart = new Date(info.startStr);
      let adjustedEndStr = info.endStr;
    
      if (isAllDay && viewType === "dayGridMonth") {
        // Only modify start time to 00:00 and preserve your adjusted end logic
        adjustedStart.setHours(0, 0, 0, 0);
        
        const adjustedEnd = new Date(info.end);
        adjustedEnd.setDate(adjustedEnd.getDate());
        adjustedEndStr = adjustedEnd.toISOString();
      }
    
      openManualModal(adjustedStart.toISOString(), adjustedEndStr, isAllDay);
    },
    eventClick: handleEventClick,
    events: fetchEvents,
    eventDidMount: (info) => {
      const subjectCodes = ["INF", "WIS", "AAR", "SEP", "GOD", "NED", "LIO", "ENG", "FRA", "FIL", "KUB", "CHE", "FYS", "BIO", "GES"];
      const title = info.event.title || "";
      const containsSubjectCode = subjectCodes.some(code => title.toUpperCase().includes(code));
    
      if (!info.event.extendedProps.isCompleted && !containsSubjectCode) {
        const titleEl = info.el.querySelector(".fc-event-title");
        if (titleEl) {
          const btn = document.createElement("button");
          btn.textContent = "✓";
          btn.classList.add("calendar-complete-btn");
    
          btn.onclick = (event) => {
            event.stopPropagation(); // 🛑 Prevent opening the edit modal
            markTaskCompleted(info.event.id);
          };
    
          titleEl.appendChild(btn);
        }
      }
    
      // Description logic remains the same
      if (info.event.extendedProps.description) {
        const viewType = info.view.type;
        const showDesc = viewType !== "dayGridMonth";
    
        if (showDesc) {
          const el = info.el.querySelector('.fc-event-title, .fc-list-event-title');
          if (el) {
            const desc = document.createElement('div');
            desc.innerText = info.event.extendedProps.description;
            desc.style.fontSize = '0.75em';
            desc.style.marginTop = '2px';
            desc.style.whiteSpace = 'normal';
            el.appendChild(desc);
          }
        }
      }
    }
    
    
  });

  calendar.render();

  new FullCalendar.Draggable(document.getElementById("template-list"), {
    itemSelector: ".template-item",
    eventData: function(eventEl) {
      return {
        title: eventEl.dataset.title,
        color: eventEl.dataset.color,
      };
    }
  });

  const predefinedTemplates = [
    { title: "📗 Nederlands", color: "#81c784" },
    { title: "🧠 Sociologie & Psychologie", color: "#4fc3f7" },
    { title: "📜 Filosofie", color: "#ba68c8" },
    { title: "🧮 Wiskunde", color: "#ffd54f" },
    { title: "🎨 Kunstbeschouwing", color: "#f06292" },
    { title: "🇫🇷 Frans", color: "#64b5f6" },
    { title: "🌍 Aardrijkskunde", color: "#aed581" },
    { title: "🇬🇧 Engels", color: "#90caf9" },
    { title: "🏰 Geschiedenis", color: "#a1887f" },
    { title: "🧬 Biologie", color: "#81d4fa" },
    { title: "⚡ Fysica", color: "#ffb74d" },
    { title: "🧪 Chemie", color: "#7986cb" },
    { title: "✝️ Godsdienst", color: "#ce93d8" },
    { title: "📝 Toets", color: "#f44336" },
    { title: "📝 Taak", color: "#fbc02d" },
  ];
  
  const templateList = document.getElementById("template-list");
  
  predefinedTemplates.forEach((tpl) => {
    const div = document.createElement("div");
    div.className = "template-item";
    div.textContent = tpl.title;
    div.style.backgroundColor = tpl.color;
    div.setAttribute("draggable", true);
    div.dataset.title = tpl.title;
    div.dataset.color = tpl.color;
  
    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({
        title: tpl.title,
        color: tpl.color,
      }));
    });
  
    templateList.appendChild(div);
  });
  

  openModalBtn.onclick = openModal;
  closeModalBtn.onclick = closeModal;
  addTaskBtn.onclick = handleAddTask;
  closeManualModal.onclick = closeManual;

  confirmManualTask.onclick = async () => {
    const start = new Date(manualStart.value);
    const end = new Date(manualEnd.value);
    
    // Check if it's 00:00 to 23:59 on the same day
    const isAllDay = (
      start.getHours() === 0 && start.getMinutes() === 0 &&
      end.getHours() === 0 && end.getMinutes() === 0 &&
      end.getTime() - start.getTime() === 24 * 60 * 60 * 1000
    );
    
    const payload = {
      title: manualTitle.value.trim() || "Taak",
      description: manualDesc.value.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: isAllDay,
      color: document.getElementById("taskColor").value || "#ff69b4", // ← use the actual input DOM reference
    };
    await axios.post("https://api.froje.be/events", payload);
    closeManual();
    calendar.refetchEvents();
  };

  async function handleAddTask() {
    const input = taskInput.value.trim();
    const desc = taskDescription.value.trim();

    const { title, start, end } = parseDutchDate(input);
    const payload = { title, start, end, description: desc };

    await axios.post("https://api.froje.be/events", payload);
    closeModal();
    calendar.refetchEvents();
  }

  async function fetchEvents(fetchInfo, successCallback, failureCallback) {
    try {
      const res = await axios.get("https://api.froje.be/events");
  
      const viewType = calendar.view?.type?.toLowerCase?.() ?? "default";
      console.log("Active calendar view:", viewType);
  
      const visibleEvents = res.data
      .filter(event => !event.isCompleted)
      .map(event => {
        const start = new Date(event.start);
        const end = new Date(event.end || event.start);
    
        const isSameDay = start.toDateString() === end.toDateString();
        const isFullDayRange = start.getHours() === 0 && start.getMinutes() === 0 &&
                               end.getHours() === 23 && end.getMinutes() === 59;
        
        const shouldForceAllDay = 
          ((isFullDayRange && isSameDay) || (end - start >= 24 * 60 * 60 * 1000)) &&
          (viewType === "timegridweek" || viewType === "timegridday");
    
        return {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: shouldForceAllDay,
          extendedProps: {
            isCompleted: event.isCompleted,
            description: event.description,
            source: event.source 
          },
          backgroundColor: event.color || "#FFB6C1",
        };
      });
  
      successCallback(visibleEvents);

  
      renderTaskLists();
    } catch (err) {
      failureCallback(err);
    }
  }
  
  
  function closeTaskModal() {
    taskModal.classList.add("hidden");
    activeTaskId = null;
  }
  window.closeTaskModal = closeTaskModal;

  const colorSwatches = document.querySelectorAll(".color-swatch");

  colorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      colorSwatches.forEach(s => s.classList.remove("selected"));
      swatch.classList.add("selected");
      taskColor.value = swatch.dataset.color;
    });
  });

  saveTaskChanges.onclick = async () => {
    if (!activeTaskId) return;
  
    await axios.patch(`https://api.froje.be/events/${activeTaskId}`, {
      title: taskEditTitle.value,
      description: taskEditDesc.value,
      color: taskColor.value,
    });
  
    calendar.refetchEvents();
    closeTaskModal();
  };
  
  
  deleteTaskBtn.onclick = async () => {
    if (!activeTaskId) return;
  
    await axios.delete(`https://api.froje.be/events/${activeTaskId}`);
    calendar.refetchEvents();
    closeTaskModal();
  };

  
  
  function handleEventClick(info) {
    const subjectCodes = ["INF", "WIS", "AAR", "SEP", "GOD", "NED", "LIO", "ENG", "FRA", "FIL", "KUB", "CHE", "FYS", "BIO", "GES"];
    const title = info.event.title || "";
    const containsSubjectCode = subjectCodes.some(code => title.toUpperCase().includes(code));
  
    if (containsSubjectCode) {
      return; // 🚫 Don't open modal for these events
    }
  
    const task = info.event;
    activeTaskId = task.id;
  
    taskEditTitle.value = task.title;
    taskEditDesc.value = task.extendedProps.description || "";
    taskColor.value = task.extendedProps.color || "#ff69b4";
  
    colorSwatches.forEach(swatch => {
      if (swatch.dataset.color === taskColor.value) {
        swatch.classList.add("selected");
      } else {
        swatch.classList.remove("selected");
      }
    });
  
    taskModal.classList.remove("hidden");
  }

  function renderTaskLists() {
    axios.get("https://api.froje.be/events").then((res) => {
      // Only handle non-Smartschool events
      const nonSmartschoolTasks = res.data.filter((t) => t.source !== 'smartschool');
      const openTasks = res.data.filter((t) => !t.isCompleted && !t.isLesson);
      const doneTasks = res.data.filter((t) => t.isCompleted && !t.isLesson);
  
      const allDayTasks = openTasks.filter((t) => {
        const start = new Date(t.start);
        const end = t.end ? new Date(t.end) : null;
        const isSameDay = end && start.toDateString() === end.toDateString();
        const isFullDay =
          end &&
          start.getUTCHours() === 0 && start.getUTCMinutes() === 0 &&
          end.getUTCHours() === 23 && end.getUTCMinutes() === 59;
  
        return (isFullDay && isSameDay);
      });
  
      const timedTasks = openTasks.filter((t) => !allDayTasks.includes(t));
  
      openList.innerHTML = "";
      completedList.innerHTML = "";
  
      [...allDayTasks, ...timedTasks].forEach((task) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${task.title}
          <div>
            <button onclick="markTaskCompleted(${task.id})">✓</button>
            <button onclick="deleteTask(${task.id})">🗑️</button>
          </div>`;
        openList.appendChild(li);
      });
  
      if (doneTasks.length) {
        const removeAllBtn = document.createElement("button");
        removeAllBtn.textContent = "🧹 Verwijder alle voltooide taken";
        removeAllBtn.onclick = async () => {
          for (let task of doneTasks) {
            await axios.delete(`https://api.froje.be/events/${task.id}`);
          }
          calendar.refetchEvents();
        };
        completedList.appendChild(removeAllBtn);
      }
  
      doneTasks.forEach((task) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${task.title}
          <div>
            <button onclick="undoTask(${task.id})">↩</button>
            <button onclick="deleteTask(${task.id})">🗑️</button>
          </div>`;
        completedList.appendChild(li);
      });
    });
  }  
  
  window.markTaskCompleted = async function (id) {
    await axios.patch(`https://api.froje.be/events/${id}/complete`, {
      isCompleted: true,
    });
    calendar.refetchEvents();
  };

  window.undoTask = async function (id) {
    await axios.patch(`https://api.froje.be/events/${id}/complete`, {
      isCompleted: false,
    });
    calendar.refetchEvents();
  };

  window.deleteTask = async function (id) {
    await axios.delete(`https://api.froje.be/events/${id}`);
    calendar.refetchEvents();
  };

  function parseDutchDate(input) {
    const now = new Date();
    let date = new Date();
    let start = null;
    let end = null;
    let original = input;
  
    // Clean lowercase working copy
    let working = input.toLowerCase();
  
    // Map of Dutch month names to month numbers
    const months = {
      januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5,
      juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11
    };
  
    // Handle relative days
    if (working.includes("overmorgen")) {
      date.setDate(now.getDate() + 2);
      working = working.replace("overmorgen", "").trim();
    } else if (working.includes("morgen")) {
      date.setDate(now.getDate() + 1);
      working = working.replace("morgen", "").trim();
    } else if (working.includes("vandaag")) {
      working = working.replace("vandaag", "").trim();
    }
  
    // Handle "volgende week maandag"
    const dayMap = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
    const weekDayMatch = working.match(/volgende week\s+(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)/i);
    if (weekDayMatch) {
      const targetIndex = dayMap.indexOf(weekDayMatch[1].toLowerCase());
      const todayIndex = now.getDay();
      const daysUntil = 7 - todayIndex + targetIndex;
      date.setDate(now.getDate() + daysUntil);
      working = working.replace(weekDayMatch[0], "").trim();
    }
  
    // Handle full dates: maandag 13 mei
    const fullDateMatch = working.match(/\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i);
    if (fullDateMatch) {
      const [, , day, month] = fullDateMatch;
      date = new Date(now.getFullYear(), months[month.toLowerCase()], parseInt(day));
      working = working.replace(fullDateMatch[0], "").trim();
    }
  
    // Parse time: van 8u tot 16u30
    const timeRange = working.match(/van\s*(\d{1,2}(?:(?:u|:)\d{1,2})?)\s*(?:tot|-)\s*(\d{1,2}(?:(?:u|:)\d{1,2})?)/i);
    if (timeRange) {
      start = parseTime(date, timeRange[1]);
      end = parseTime(date, timeRange[2]);
      working = working.replace(timeRange[0], "").trim();
    }
  
    // Parse single time: "14u" or "14:30"
    if (!start) {
      const single = working.match(/(\d{1,2})(?:u|:)?(\d{0,2})?/);
      if (single) {
        start = parseTime(date, `${single[1]}${single[2] ? ':' + single[2] : ''}`);
        end = new Date(start.getTime() + 60 * 60 * 1000);
        working = working.replace(single[0], "").trim();
      }
    }
  
    // If no time found, mark as all-day
    if (!start) {
      start = new Date(date.setHours(0, 0, 0, 0));
      end = new Date(date.setHours(23, 59, 0, 0));
    }
  
    // Final cleanup: remove leftover prepositions
    working = working.replace(/\b(van|tot|om|u|uur|:)\b/gi, "").trim();
  
    return {
      title: working.length ? working : original.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
  
  function parseTime(baseDate, timeStr) {
    const cleaned = timeStr.replace('u', ':');
    const [h, m = 0] = cleaned.split(":").map(Number);
    const dt = new Date(baseDate);
    dt.setHours(h, m, 0, 0);
    return dt;
  }

  let smartschoolCookies = null;

  async function fetchSmartschoolLessons() {
    const response = await fetch("https://api.froje.be/smartschool/fetch-lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  
    if (!response.ok) {
      if (response.status === 401) {
        await promptSmartschoolCookies(); // Shows the dialog
        return fetchSmartschoolLessons();
      } else {
        throw new Error("Smartschool fetch failed.");
      }
    }
  
    return await response.text();
  }
  

  function promptSmartschoolCookies() {
    return new Promise((resolve, reject) => {
      const dialog = document.getElementById("cookie-dialog");
      const phpInput = document.getElementById("cookie-php");
      const pidInput = document.getElementById("cookie-pid");
      const smscndcInput = document.getElementById("cookie-smscndc");
      const saveBtn = document.getElementById("save-cookies");
  
      // Reset any previous values
      phpInput.value = "";
      pidInput.value = "";
      smscndcInput.value = "";
      dialog.classList.remove("dialog-hidden");
  
      const handleSave = async () => {
        const php = phpInput.value.trim();
        const pid = pidInput.value.trim();
        const smscndc = smscndcInput.value.trim();
  
        if (!php || !pid || !smscndc) {
          alert("⚠️ Alle cookies zijn verplicht.");
          return;
        }
  
        const cookies = `PHPSESSID=${php}; pid=${pid}; smscndc=${smscndc}`;
  
        try {
          await fetch("https://api.froje.be/smartschool/set-cookies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cookies }),
          });
  
          dialog.classList.add("dialog-hidden");
          saveBtn.removeEventListener("click", handleSave);
          resolve();
        } catch (err) {
          alert("❌ Fout bij opslaan van cookies.");
          reject(err);
        }
      };
  
      saveBtn.addEventListener("click", handleSave);
    });
  }
  
  


  async function syncSmartschoolEvents() {
    try {
      const response = await fetch("https://api.froje.be/smartschool/fetch-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          await promptSmartschoolCookies();
          return syncSmartschoolEvents(); // retry
        } else {
          throw new Error("Smartschool fetch failed.");
        }
      }
  
      const result = await response.json();
      alert(` ${result.status} (${result.count} lessen uit smartschool gehaald)`);
      calendar.refetchEvents();
    } catch (err) {
      alert("❌ Er is een fout opgetreden bij het synchroniseren met Smartschool.");
    }
  }

document.getElementById('desyncSmartschool').addEventListener('click', async () => {
  const confirmDelete = confirm("Weet je zeker dat je alle taken uit de kalender wilt verwijderen?");
  if (!confirmDelete) return;

  const response = await fetch('https://api.froje.be/events', { method: 'DELETE' });
  if (response.ok) {
    alert("Alle taken zijn verwijderd.");
    calendar.refetchEvents();
  } else {
    alert("Er is iets misgegaan bij het verwijderen.");
  }
});

  document.getElementById("syncSmartschool").onclick = syncSmartschoolEvents;
});
