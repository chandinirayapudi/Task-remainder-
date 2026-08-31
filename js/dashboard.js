// ======================================
// TaskFlow Pro - Dashboard Navigation
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const remindersBtn = document.getElementById("sidebarRemindersBtn");
    const settingsBtn = document.getElementById("sidebarSettingsBtn");
    const analyticsBtn = document.getElementById("sidebarAnalyticsBtn");
    const locationBtn = document.getElementById("sidebarLocationBtn");
    const dashboardBtn = document.getElementById("sidebarDashboardBtn");

    function goTo(selector) {
        const section = document.querySelector(selector);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    // Dashboard
    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", function (event) {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // Reminders
    if (remindersBtn) {
        remindersBtn.addEventListener("click", function (event) {
            event.preventDefault();
            goTo(".reminder-section");
        });
    }

    // Analytics
    if (analyticsBtn) {
        analyticsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            goTo(".analytics-section");
        });
    }

    // Location
    if (locationBtn) {
        locationBtn.addEventListener("click", function (event) {
            event.preventDefault();
            goTo(".location-section");
        });
    }

    // Settings
    if (settingsBtn) {
        settingsBtn.addEventListener("click", function (event) {
            event.preventDefault();

            if (typeof openSettings === "function") {
                openSettings();
            }
        });
    }

});
