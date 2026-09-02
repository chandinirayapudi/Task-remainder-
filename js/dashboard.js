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

    // Helper: restore main dashboard sections (undo location.js hiding)
    function restoreDashboardSections() {
        var selectors = ['.welcome-card', '.cards', '.reminder-section', '.analytics-section', '.upcoming'];
        selectors.forEach(function(sel) {
            var el = document.querySelector(sel);
            if (el) el.style.display = '';
        });
        var locSection = document.querySelector('.location-section');
        if (locSection) locSection.style.display = 'none';
        document.querySelectorAll('nav a').forEach(function(link) { link.classList.remove('active'); });
    }

    // Dashboard
    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", function (event) {
            event.preventDefault();
            restoreDashboardSections();
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
            restoreDashboardSections();
            goTo(".reminder-section");
        });
    }

    // Analytics
    if (analyticsBtn) {
        analyticsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            restoreDashboardSections();
            goTo(".analytics-section");
        });
    }

    // Location
    if (locationBtn) {
        locationBtn.addEventListener("click", function (event) {
            event.preventDefault();
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
