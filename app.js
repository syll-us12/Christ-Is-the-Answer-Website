
const API_URL = "http://localhost:5000/presentations";

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

let presentations = [];
let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-KE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function mapFromApi(row) {
    return {
        id: row.id,
        date: row.presentation_date,
        name: row.presenter_name,
        whatsapp: row.whatsapp || "",
        book: row.bible_book,
        verses: row.verses,
        topic: row.topic,
        notes: row.notes || "",
        lessons: row.lessons || "",
        createdAt: row.created_at
    };
}

async function loadPresentations() {
    saturdayGrid.innerHTML = "<p>Loading Saturday calendar...</p>";
    recordsList.innerHTML = "<p>Loading Bible study records...</p>";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const rows = await response.json();
        presentations = rows.map(mapFromApi);

        renderCalendar();
        renderRecords();
    } catch (error) {
        console.error("Could not load presentations:", error);

        saturdayGrid.innerHTML = `
            <div class="empty-state">
                <h3>Could not connect to the server</h3>
                <p>Check that your backend is running on port 5000, then refresh this page.</p>
            </div>`;

        recordsList.innerHTML = `
            <div class="empty-state">
                <h3>Records are temporarily unavailable</h3>
                <p>Please check your connection to the backend and refresh.</p>
            </div>`;
    }
}

function addCalendarStyles() {
    if (document.getElementById("calendarStyles")) return;

    const style = document.createElement("style");
    style.id = "calendarStyles";

    style.textContent = `
        .calendar-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 18px 0;
            flex-wrap: wrap;
        }
        .calendar-toolbar button {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            cursor: pointer;
        }
        .calendar-toolbar h3 {
            margin: 0;
            text-align: center;
        }
        .calendar-weekdays, .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 7px;
        }
        .calendar-weekdays {
            margin-bottom: 8px;
            text-align: center;
            font-weight: 700;
        }
        .calendar-day {
            min-height: 76px;
            padding: 8px 3px;
            border: 1px solid #e1e5e9;
            border-radius: 9px;
            background: #fff;
            text-align: center;
            overflow-wrap: anywhere;
        }
        button.calendar-day {
            cursor: pointer;
        }
        button.calendar-day:hover {
            border-color: #1c7550;
            background: #edf8f1;
        }
        .calendar-day .day-number {
            display: block;
            font-size: 1.05rem;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .calendar-day .day-status {
            font-size: 0.7rem;
            line-height: 1.2;
        }
        .calendar-day.available {
            border-color: #9bd2b1;
            background: #f0fbf4;
        }
        .calendar-day.reserved {
            border-color: #e9b0aa;
            background: #fff0ee;
            color: #9c342a;
        }
        .calendar-day.past {
            background: #f2f3f5;
            color: #858b91;
        }
        .calendar-day.empty {
            border-color: transparent;
            background: transparent;
        }
        .calendar-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            margin: 14px 0;
            font-size: 0.85rem;
        }
        .legend-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .calendar-error {
            padding: 14px;
            background: #fff5e8;
            border-radius: 8px;
        }
        .record-card {
            padding: 18px;
            margin-bottom: 16px;
            border: 1px solid #e2e7e4;
            border-radius: 12px;
            background: white;
        }
        .record-card h3 {
            margin-top: 8px;
        }
        .record-card p {
            overflow-wrap: anywhere;
        }
        .record-date {
            color: #28744f;
            font-weight: 700;
        }
        .record-card button {
            padding: 9px 14px;
            border: 0;
            border-radius: 7px;
            background: #167b50;
            color: white;
            cursor: pointer;
        }
        @media (max-width: 520px) {
            .calendar-weekdays, .calendar-days {
                gap: 3px;
            }
            .calendar-day {
                min-height: 62px;
                padding: 6px 1px;
            }
            .calendar-day .day-status {
                font-size: 0.6rem;
            }
            .calendar-toolbar {
                justify-content: center;
            }
        }
    `;

    document.head.appendChild(style);
}

function setupCalendarControls() {
    const currentYear = new Date().getFullYear();

    yearSelect.innerHTML = "";

    for (let year = currentYear; year <= 2100; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    yearSelect.value = displayedYear;

    yearSelect.addEventListener("change", () => {
        displayedYear = Number(yearSelect.value);
        renderCalendar();
    });

    addCalendarStyles();
    renderCalendar();
}

function changeMonth(amount) {
    displayedMonth += amount;

    if (displayedMonth < 0) {
        displayedMonth = 11;
        displayedYear--;
    } else if (displayedMonth > 11) {
        displayedMonth = 0;
        displayedYear++;
    }

    const currentYear = new Date().getFullYear();

    if (displayedYear < currentYear) {
        displayedYear = currentYear;
        displayedMonth = new Date().getMonth();
    }

    while (
        Number(yearSelect.value) < displayedYear
    ) {
        const option = document.createElement("option");
        option.value = Number(yearSelect.value) + 1;
        option.textContent = option.value;
        yearSelect.appendChild(option);
    }

    yearSelect.value = displayedYear;
    renderCalendar();
}

function renderCalendar() {
    if (!saturdayGrid) return;

    const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();

    let html = `
        <div class="calendar-toolbar">
            <button type="button" id="previousMonth">← Previous</button>
            <h3>${new Date(displayedYear, displayedMonth, 1).toLocaleDateString("en-KE", {
                month: "long",
                year: "numeric"
            })}</h3>
            <button type="button" id="nextMonth">Next →</button>
        </div>

        <div class="calendar-legend">
            <span><span class="legend-dot" style="background:#9bd2b1"></span>Available</span>
            <span><span class="legend-dot" style="background:#e9b0aa"></span>Reserved</span>
            <span><span class="legend-dot" style="background:#d9dde1"></span>Past date</span>
        </div>

        <div class="calendar-weekdays">
            <span>Sun</span><span>Mon</span><span>Tue</span>
            <span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="calendar-days">`;

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const key = dateKey(displayedYear, displayedMonth, day);
        const date = new Date(displayedYear, displayedMonth, day);
        const isSaturday = date.getDay() === 6;

        if (!isSaturday) {
            html += `<div class="calendar-day"><span class="day-number">${day}</span></div>`;
            continue;
        }

        const booking = presentations.find(item => item.date === key);
        const isPast = date < today;

        let className = "calendar-day";
        let status = "Available";
        let disabled = "";

        if (booking) {
            className += " reserved";
            status = "Reserved";
            disabled = "disabled";
        } else if (isPast) {
            className += " past";
            status = "Past";
            disabled = "disabled";
        } else {
            className += " available";
        }

        html += `
            <button type="button" class="${className}"
                data-date="${key}" ${disabled}
                aria-label="${key}: ${status}">
                <span class="day-number">${day}</span>
                <span class="day-status">${status}</span>
            </button>`;
    }

    html += "</div>";
    saturdayGrid.innerHTML = html;

    document.getElementById("previousMonth")
        .addEventListener("click", () => changeMonth(-1));

    document.getElementById("nextMonth")
        .addEventListener("click", () => changeMonth(1));

    saturdayGrid.querySelectorAll("button[data-date]:not(:disabled)")
        .forEach(button => {
            button.addEventListener("click", () => {
                openPresentationForm(button.dataset.date);
            });
        });
}

function openPresentationForm(date) {
    if (presentations.some(item => item.date === date)) {
        alert("This Saturday is already reserved.");
        return;
    }

    presentationForm.reset();
    presentationDate.value = date;
    chosenDate.textContent = formatDate(date);
    formMessage.textContent = "";
    presentationPanel.hidden = false;
    presentationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closePresentationForm() {
    presentationPanel.hidden = true;
    presentationForm.reset();
    formMessage.textContent = "";
}

presentationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const date = presentationDate.value;

    const presentation = {
        presentation_date: date,
        presenter_name: document.getElementById("memberName").value.trim(),
        whatsapp: document.getElementById("whatsapp").value.trim(),
        bible_book: document.getElementById("book").value.trim(),
        verses: document.getElementById("verses").value.trim(),
        topic: document.getElementById("topic").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        lessons: document.getElementById("lessons").value.trim()
    };

    if (!date) {
        formMessage.textContent = "Please choose a Saturday first.";
        return;
    }

    if (presentations.some(item => item.date === date)) {
        formMessage.textContent = "This Saturday is already reserved.";
        renderCalendar();
        return;
    }

    const submitButton = presentationForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
    formMessage.textContent = "Saving your presentation to the database...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(presentation)
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                await loadPresentations();
            }
            throw new Error(result.error || "The presentation could not be saved.");
        }

        await loadPresentations();

        formMessage.textContent = "Presentation saved successfully!";
        closePresentationForm();

        document.getElementById("records").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Save failed:", error);
        formMessage.textContent = error.message ||
            "Could not connect to the server. Please try again.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save Presentation";
    }
});

document.getElementById("cancelButton").addEventListener("click", closePresentationForm);

function renderRecords() {
    const searchTerm = searchRecords.value.trim().toLowerCase();

    const filtered = presentations
        .filter(item => [
            item.name, item.book, item.verses, item.topic,
            item.notes, item.lessons, item.date
        ].some(value => String(value || "").toLowerCase().includes(searchTerm)))
        .sort((a, b) => b.date.localeCompare(a.date));

    recordCount.textContent = presentations.length;

    const scriptures = new Set(
        presentations.map(item =>
            `${item.book.toLowerCase()} ${item.verses.toLowerCase()}`
        )
    );

    scriptureCount.textContent = scriptures.size;

    if (filtered.length === 0) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <span>📖</span>
                <h3>${presentations.length ? "No matching records found" : "Our journey through the Word starts here"}</h3>
                <p>${presentations.length ? "Try another search term." : "Saved presentations will appear here."}</p>
            </div>`;
        return;
    }

    recordsList.innerHTML = filtered.map(item => `
        <article class="record-card">
            <div class="record-date">${escapeHTML(formatDate(item.date))}</div>
            <h3>${escapeHTML(item.topic)}</h3>
            <p><strong>Scripture:</strong> ${escapeHTML(item.book)} ${escapeHTML(item.verses)}</p>
            <p><strong>Presenter:</strong> ${escapeHTML(item.name)}</p>
            <p><strong>Short notes:</strong><br>${escapeHTML(item.notes).replace(/\n/g, "<br>")}</p>
            <p><strong>Lessons learnt:</strong><br>${escapeHTML(item.lessons).replace(/\n/g, "<br>")}</p>
            <button type="button" class="share-button"
                data-id="${escapeHTML(item.id)}">Share on WhatsApp</button>
        </article>
    `).join("");

    recordsList.querySelectorAll(".share-button").forEach(button => {
        button.addEventListener("click", () => {
            const item = presentations.find(
                record => String(record.id) === button.dataset.id
            );

            if (item) shareOnWhatsApp(item);
        });
    });
}

function shareOnWhatsApp(item) {
    const message = [
        "✝ CHRIST IS THE ANSWER GROUP",
        "Saturday Word Sharing",
        "",
        `Date: ${formatDate(item.date)}`,
        `Presenter: ${item.name}`,
        `Scripture: ${item.book} ${item.verses}`,
        `Topic: ${item.topic}`,
        "",
        `Short notes: ${item.notes}`,
        "",
        `Lessons learnt: ${item.lessons}`
    ].join("\n");

    window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
    );
}

searchRecords.addEventListener("input", renderRecords);

setupCalendarControls();
loadPresentations();
