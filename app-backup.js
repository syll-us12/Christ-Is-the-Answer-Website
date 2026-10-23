
const yearSelect = document.getElementById("yearSelect");
const saturdayGrid = document.getElementById("saturdayGrid");
const presentationPanel = document.getElementById("presentationPanel");
const presentationForm = document.getElementById("presentationForm");
const presentationDate = document.getElementById("presentationDate");
const chosenDate = document.getElementById("chosenDate");
const recordsList = document.getElementById("recordsList");
const searchRecords = document.getElementById("searchRecords");
const recordCount = document.getElementById("recordCount");
const scriptureCount = document.getElementById("scriptureCount");
const formMessage = document.getElementById("formMessage");

const STORAGE_KEY = "christIsTheAnswerPresentations";
let presentations = loadPresentations();
const today = new Date();
today.setHours(0, 0, 0, 0);

let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function loadPresentations() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function savePresentations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations));
}

function formatDate(dateString) {
    return new Date(dateString + "T12:00:00").toLocaleDateString(
        "en-KE",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addCalendarStyles() {
    if (document.getElementById("calendarStyles")) return;

    const style = document.createElement("style");
    style.id = "calendarStyles";
    style.textContent = `
        .calendar-controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 20px 0;
        }

        .calendar-controls select,
        .calendar-controls button {
            padding: 10px 14px;
            border: 1px solid #d8e2da;
            border-radius: 9px;
            font: inherit;
            background: white;
            cursor: pointer;
        }

        .calendar-controls .month-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #173f35;
            flex: 1;
            text-align: center;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 6px;
            margin-top: 16px;
        }

        .calendar-weekday {
            text-align: center;
            padding: 10px 0;
            font-weight: 700;
            color: #173f35;
        }

        .calendar-day {
            min-height: 76px;
            padding: 8px 3px;
            border: 1px solid #e0e7e1;
            border-radius: 9px;
            background: #fff;
            color: #173f35;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 5px;
            font: inherit;
        }

        button.calendar-day {
            cursor: pointer;
        }

        button.calendar-day.available {
            background: #e8f1eb;
            border-color: #b9d1c0;
        }

        button.calendar-day.available:hover {
            background: #d4e7d9;
            border-color: #173f35;
        }

        .calendar-day .day-number {
            font-weight: 700;
        }

        .calendar-day .day-status {
            font-size: 0.68rem;
            text-align: center;
            overflow-wrap: anywhere;
        }

        .calendar-day.booked {
            background: #f6edd9;
            color: #75551d;
        }

        .calendar-day.past {
            background: #f4f4f4;
            color: #999;
        }

        .calendar-day.empty {
            border-color: transparent;
            background: transparent;
        }

        .calendar-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 16px;
            font-size: 0.9rem;
        }

        .calendar-legend span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .calendar-dot {
            width: 11px;
            height: 11px;
            display: inline-block;
            border-radius: 3px;
        }

        @media (max-width: 520px) {
            .calendar-grid {
                gap: 3px;
            }

            .calendar-day {
                min-height: 55px;
                padding: 5px 1px;
                border-radius: 5px;
            }

            .calendar-day .day-status {
                font-size: 0.58rem;
            }

            .calendar-weekday {
                font-size: 0.75rem;
            }

            .calendar-controls .month-title {
                flex-basis: 100%;
                order: -1;
            }
        }
    `;
    document.head.append(style);
}

function setupCalendarControls() {
    addCalendarStyles();

    yearSelect.innerHTML = "";

    // The calendar supports future years through 2100.
    for (let year = today.getFullYear(); year <= 2100; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.append(option);
    }

    yearSelect.value = displayedMonth.getFullYear();

    const yearBar = yearSelect.closest(".year-bar");
    const monthLabel = yearBar.querySelector("label");
    if (monthLabel) monthLabel.textContent = "Jump to year";

    const controls = document.createElement("div");
    controls.className = "calendar-controls";

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "← Previous";

    const title = document.createElement("div");
    title.className = "month-title";
    title.id = "calendarMonthTitle";

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next →";

    controls.append(previous, title, next);

    yearBar.insertAdjacentElement("afterend", controls);

    previous.addEventListener("click", () => changeMonth(-1));
    next.addEventListener("click", () => changeMonth(1));

    yearSelect.addEventListener("change", () => {
        displayedMonth.setFullYear(Number(yearSelect.value));
        renderCalendar();
    });

    renderCalendar();
}

function changeMonth(amount) {
    displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + amount,
        1
    );

    if (displayedMonth.getFullYear() < today.getFullYear()) {
        displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    if (displayedMonth.getFullYear() > 2100) {
        displayedMonth = new Date(2100, 11, 1);
    }

    yearSelect.value = displayedMonth.getFullYear();
    renderCalendar();
}

function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    document.getElementById("calendarMonthTitle").textContent =
        displayedMonth.toLocaleDateString("en-KE", {
            month: "long",
            year: "numeric"
        });

    saturdayGrid.replaceChildren();
    saturdayGrid.classList.add("calendar-grid");

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    weekdays.forEach(day => {
        const heading = document.createElement("div");
        heading.className = "calendar-weekday";
        heading.textContent = day;
        saturdayGrid.append(heading);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let blank = 0; blank < firstDay; blank++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        saturdayGrid.append(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = dateKey(year, month, day);
        const date = new Date(year, month, day);
        const isSaturday = date.getDay() === 6;
        const isPast = date < today;
        const booking = presentations.find(item => item.date === key);

        const cell = document.createElement(
            isSaturday && !isPast && !booking ? "button" : "div"
        );

        cell.className = "calendar-day";

        if (isSaturday && !isPast && !booking) {
            cell.classList.add("available");
            cell.type = "button";
            cell.setAttribute("aria-label", `Choose Saturday ${formatDate(key)}`);
            cell.addEventListener("click", () => openPresentationForm(key));
        }

        if (booking) cell.classList.add("booked");
        if (isPast) cell.classList.add("past");

        const number = document.createElement("span");
        number.className = "day-number";
        number.textContent = day;
        cell.append(number);

        if (isSaturday) {
            const status = document.createElement("span");
            status.className = "day-status";

            if (booking) {
                status.textContent = "Reserved";
            } else if (isPast) {
                status.textContent = "Past";
            } else {
                status.textContent = "Available";
            }

            cell.append(status);
        }

        saturdayGrid.append(cell);
    }
}

function openPresentationForm(date) {
    if (presentations.some(item => item.date === date)) {
        alert("This Saturday has already been reserved.");
        return;
    }

    presentationForm.reset();
    presentationDate.value = date;
    chosenDate.textContent = formatDate(date);
    formMessage.textContent = "";
    presentationPanel.hidden = false;
    presentationPanel.scrollIntoView({ behavior: "smooth" });
}

function closePresentationForm() {
    presentationPanel.hidden = true;
    presentationForm.reset();
    formMessage.textContent = "";
}

presentationForm.addEventListener("submit", event => {
    event.preventDefault();

    const date = presentationDate.value;

    if (presentations.some(item => item.date === date)) {
        formMessage.textContent = "Sorry, this Saturday has already been reserved.";
        return;
    }

    const presentation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date,
        name: document.getElementById("memberName").value.trim(),
        whatsapp: document.getElementById("whatsapp").value.trim(),
        book: document.getElementById("book").value.trim(),
        verses: document.getElementById("verses").value.trim(),
        topic: document.getElementById("topic").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        lessons: document.getElementById("lessons").value.trim(),
        createdAt: new Date().toISOString()
    };

    if (!presentation.name || !presentation.book || !presentation.verses ||
        !presentation.topic || !presentation.notes || !presentation.lessons) {
        formMessage.textContent = "Please complete all required fields.";
        return;
    }

    presentations.push(presentation);

    try {
        savePresentations();
    } catch {
        presentations.pop();
        formMessage.textContent = "Could not save this presentation in your browser.";
        return;
    }

    formMessage.textContent = "Presentation saved successfully!";
    renderCalendar();
    renderRecords();
    presentationForm.reset();

    setTimeout(() => {
        presentationPanel.hidden = true;
        document.getElementById("records").scrollIntoView({ behavior: "smooth" });
    }, 900);
});

document.getElementById("cancelButton").addEventListener("click", closePresentationForm);
searchRecords.addEventListener("input", renderRecords);

function renderRecords() {
    const query = searchRecords.value.trim().toLowerCase();

    const filtered = presentations
        .filter(item => {
            const searchable = [
                item.name, item.book, item.verses,
                item.topic, item.notes, item.lessons, item.date
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    recordsList.replaceChildren();
    recordCount.textContent = presentations.length;

    const scriptures = new Set(
        presentations.map(item =>
            `${item.book.toLowerCase()} ${item.verses.toLowerCase()}`
        )
    );
    scriptureCount.textContent = scriptures.size;

    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const title = document.createElement("h3");
        title.textContent = "No presentations found";

        const message = document.createElement("p");
        message.textContent = presentations.length
            ? "Try a different search."
            : "Saved presentations will appear here.";

        empty.append(title, message);
        recordsList.append(empty);
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("article");
        card.className = "record-card";

        const date = document.createElement("p");
        date.className = "record-date";
        date.textContent = formatDate(item.date);

        const title = document.createElement("h3");
        title.textContent = item.topic;

        const scripture = document.createElement("p");
        scripture.textContent = `${item.book} ${item.verses}`;

        const presenter = document.createElement("p");
        presenter.textContent = `Presented by: ${item.name}`;

        const notes = document.createElement("p");
        notes.textContent = `Notes: ${item.notes}`;

        const lessons = document.createElement("p");
        lessons.textContent = `Lessons learnt: ${item.lessons}`;

        card.append(date, title, scripture, presenter, notes, lessons);

        const share = document.createElement("button");
        share.type = "button";
        share.className = "secondary-button";
        share.textContent = "Share on WhatsApp";

        share.addEventListener("click", () => {
            const message = [
                "Christ Is the Answer Group — Saturday Word Sharing",
                `Date: ${formatDate(item.date)}`,
                `Presenter: ${item.name}`,
                `Scripture: ${item.book} ${item.verses}`,
                `Topic: ${item.topic}`,
                `Notes: ${item.notes}`,
                `Lessons learnt: ${item.lessons}`
            ].join("\n");

            window.open(
                `https://wa.me/?text=${encodeURIComponent(message)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });

        card.append(share);
        recordsList.append(card);
    });
}

setupCalendarControls();
renderRecords();
