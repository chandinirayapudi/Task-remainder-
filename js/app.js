// ======================================
// TaskFlow Pro
// app.js
// Sprint 1
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    updateGreeting();
    displayCurrentDate();

});

// ======================================
// Greeting
// ======================================

function updateGreeting() {

    const heading = document.querySelector(".welcome-card h2");

    const hour = new Date().getHours();

    let greeting = "";

    if (hour < 12) {

        greeting = "🌅 Good Morning";

    }

    else if (hour < 17) {

        greeting = "☀️ Good Afternoon";

    }

    else {

        greeting = "🌙 Good Evening";

    }

    heading.textContent = greeting + " 👋";

}

// ======================================
// Current Date
// ======================================

function displayCurrentDate() {

    const welcomeCard = document.querySelector(".welcome-card");

    const date = new Date();

    const options = {

        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"

    };

    const formattedDate = date.toLocaleDateString("en-US", options);

    const dateElement = document.createElement("p");

    dateElement.style.marginTop = "10px";

    dateElement.style.opacity = "0.9";

    dateElement.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${formattedDate}`;

    welcomeCard.appendChild(dateElement);

}
// Quick Actions


const quickToday =
document.getElementById("quickToday'sBtn");

if (quickToday) {

    quickToday.addEventListener("click", () => {

        const today =
            new Date().toISOString().split("T")[0];

        const cards =
            document.querySelectorAll(".reminder-card");

        cards.forEach(function(card) {

            const dateText =
                card.querySelector("p:nth-of-type(3)");

            if (!dateText) return;

            const taskDate =
                dateText.textContent.replace("📅 ", "").trim();

            if (taskDate === today) {

                card.style.display = "flex";

            } else {

                card.style.display = "none";

            }

        });

        document.querySelector(".reminder-section")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

}
 // ======================================
// Quick Actions
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const quickToday =
        document.getElementById("quickToday'sBtn");

    if (quickToday) {

        quickToday.addEventListener("click", function () {

            const today =
                new Date().toISOString().split("T")[0];

            const cards =
                document.querySelectorAll(".reminder-card");

            cards.forEach(function (card) {

                const dateText =
                    card.querySelector("p:nth-of-type(3)");

                if (!dateText) return;

                const taskDate =
                    dateText.textContent
                        .replace("📅", "")
                        .trim();

                card.style.display =
                    taskDate === today ? "flex" : "none";

            });

            const reminderSection =
                document.querySelector(".reminder-section");

            if (reminderSection) {

                reminderSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    }

});
