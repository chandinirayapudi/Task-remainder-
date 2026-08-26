// ======================================
// TaskFlow Pro
// Calendar Module
// ======================================

// Elements

const calendarOverlay = document.getElementById("calendarOverlay");
const openCalendarBtn = document.getElementById("quickCalendarBtn");
const closeCalendarBtn = document.getElementById("closeCalendar");

const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");

let currentDate = new Date();

// ==============================
// Open Calendar
// ==============================

function openCalendar(){

    calendarOverlay.classList.add("active");

    generateCalendar();

}

// ==============================
// Close Calendar
// ==============================

function closeCalendar(){

    calendarOverlay.classList.remove("active");

}

// ==============================
// Generate Calendar
// ==============================

function generateCalendar(){

    calendarDays.innerHTML = "";

    const year = currentDate.getFullYear();

    const month = currentDate.getMonth();

    const firstDay =
    new Date(year, month, 1).getDay();

    const lastDate =
    new Date(year, month + 1, 0).getDate();

    const monthNames = [

        "January","February","March","April",

        "May","June","July","August",

        "September","October","November","December"

    ];

    monthYear.textContent =
    `${monthNames[month]} ${year}`;

    // Empty boxes

    for(let i=0;i<firstDay;i++){

        calendarDays.innerHTML +=
        `<div></div>`;

    }

    // Dates
    const reminders = getReminders();
for(let day=1; day<=lastDate; day++){

    const today = new Date();

    const isToday =

        day === today.getDate() &&

        month === today.getMonth() &&

        year === today.getFullYear();

    

    const hasReminder = reminders.some(function(reminder){

        return reminder.taskDate ===
        `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    });

    calendarDays.innerHTML +=

`<div class="calendar-day
${isToday ? "today" : ""}
${hasReminder ? "has-reminder" : ""}"

onclick="showDayReminders('${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}')">

    ${day}

</div>`;
}
    


}

// ==============================
// Previous Month
// ==============================

document.getElementById("prevMonth")
.addEventListener("click",function(){

    currentDate.setMonth(
        currentDate.getMonth()-1
    );

    generateCalendar();

});

// ==============================
// Next Month
// ==============================

document.getElementById("nextMonth")
.addEventListener("click",function(){

    currentDate.setMonth(
        currentDate.getMonth()+1
    );

    generateCalendar();

});

// ==============================
// Events
// ==============================

if(openCalendarBtn){

    openCalendarBtn.addEventListener(

        "click",

        openCalendar

    );

}

if(closeCalendarBtn){

    closeCalendarBtn.addEventListener(

        "click",

        closeCalendar

    );

}

calendarOverlay.addEventListener(

    "click",

    function(event){

        if(event.target===calendarOverlay){

            closeCalendar();

        }

    }

);
// ======================================
// Show Reminders for Selected Date
// ======================================

function showDayReminders(selectedDate){

    const reminders = getReminders().filter(function(reminder){

        return reminder.taskDate === selectedDate;

    });

    if(reminders.length === 0){

        showNotification(

            "No Reminders",

            "No reminders found for this date.",

            "info"

        );

        return;

    }

    let message = "";

    reminders.forEach(function(reminder){

        message +=

`${reminder.taskName}
🕒 ${reminder.taskTime}

`;

    });

    alert(message);

}
const sidebarCalendarBtn =
document.getElementById("sidebarCalendarBtn");

if (sidebarCalendarBtn) {

    sidebarCalendarBtn.addEventListener("click", function(event) {

        event.preventDefault();

        openCalendar();

    });

}