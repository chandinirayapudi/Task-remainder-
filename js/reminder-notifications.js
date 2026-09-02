// ======================================
// TaskFlow Pro - Reminder Notifications
// Sound alerts + spoken reminders + browser notifications + LOCAL NOTIFICATIONS
// ======================================

(function () {
    'use strict';

    var notifiedReminders = {};
    var CHECK_INTERVAL = 30000;
    var localNotificationsAvailable = false;

    // ======================================
    // Check if Local Notifications are available
    // ======================================

    function isLocalNotificationsAvailable() {
        return window.Capacitor && 
               window.Capacitor.Plugins && 
               window.Capacitor.Plugins.LocalNotifications;
    }

    // ======================================
    // Request Local Notifications permission
    // ======================================

    async function requestLocalNotificationsPermission() {
        if (!isLocalNotificationsAvailable()) {
            console.log('Local Notifications not available');
            return false;
        }

        try {
            var LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            var permission = await LocalNotifications.requestPermissions();
            console.log('Local Notifications permission:', permission);
            localNotificationsAvailable = permission.display === 'granted';
            return localNotificationsAvailable;
        } catch (e) {
            console.error('Local Notifications permission error:', e);
            return false;
        }
    }

    // ======================================
    // Schedule a local notification
    // ======================================

    async function scheduleLocalNotification(title, body, scheduleTime) {
        if (!localNotificationsAvailable || !isLocalNotificationsAvailable()) {
            return false;
        }

        try {
            var LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            
            var notification = {
                title: title,
                body: body,
                id: Math.floor(Date.now() / 1000) % 2147483647,
                schedule: { at: scheduleTime },
                smallIcon: 'ic_launcher',
                largeIcon: 'ic_launcher',
                iconColor: '#4F46E5'
            };

            var result = await LocalNotifications.schedule({
                notifications: [notification]
            });
            
            console.log('Local notification scheduled:', result);
            return true;
        } catch (e) {
            console.error('Local notification schedule error:', e);
            return false;
        }
    }

    // ======================================
    // Cancel all scheduled local notifications
    // ======================================

    async function cancelAllLocalNotifications() {
        if (!localNotificationsAvailable || !isLocalNotificationsAvailable()) {
            return;
        }

        try {
            var LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            var pending = await LocalNotifications.getPending();
            
            if (pending.notifications && pending.notifications.length > 0) {
                var ids = pending.notifications.map(function(n) { return n.id; });
                await LocalNotifications.cancel({ notifications: ids.map(function(id) { return { id: id }; }) });
                console.log('Cancelled all local notifications:', ids.length);
            }
        } catch (e) {
            console.error('Cancel local notifications error:', e);
        }
    }

    // ======================================
    // Schedule all upcoming reminders as local notifications
    // ======================================

    async function scheduleAllReminders() {
        if (!localNotificationsAvailable) return;

        // First cancel all existing scheduled notifications
        await cancelAllLocalNotifications();

        if (typeof getReminders !== 'function') return;

        var reminders = getReminders();
        var now = new Date();

        reminders.forEach(function (reminder) {
            if (reminder.completed) return;

            var reminderTime = new Date(reminder.taskDate + 'T' + reminder.taskTime);
            
            // Only schedule future reminders (within next 24 hours)
            var diffMs = reminderTime.getTime() - now.getTime();
            var diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours > 0 && diffHours <= 24) {
                scheduleLocalNotification(
                    '⏰ Reminder: ' + reminder.taskName,
                    'Category: ' + (reminder.category || 'Personal') + ' | Time: ' + reminder.taskTime,
                    reminderTime
                );
            }
        });
    }

    // ======================================
    // Generate alert sound using Web Audio API
    // ======================================

    function playAlertSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Three-tone beep pattern
            var frequencies = [800, 1000, 800];
            var now = ctx.currentTime;

            frequencies.forEach(function (freq, i) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.4, now + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.18);
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.2);
            });
        } catch (e) {
            // Audio not available
        }
    }

    // ======================================
    // Spoken reminder using SpeechSynthesis
    // ======================================

    function speakReminder(text) {
        if (!('speechSynthesis' in window)) return;
        try {
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        } catch (e) {
            // Speech not available
        }
    }

    // ======================================
    // Request browser notification permission
    // ======================================

    function requestNotificationPermission(callback) {
        if (!('Notification' in window)) {
            if (callback) callback('not-supported');
            return;
        }
        if (Notification.permission === 'granted') {
            if (callback) callback('granted');
            return;
        }
        if (Notification.permission === 'denied') {
            if (callback) callback('denied');
            return;
        }
        Notification.requestPermission().then(function (permission) {
            if (callback) callback(permission);
        }).catch(function () {
            if (callback) callback('error');
        });
    }

    // ======================================
    // Show browser notification
    // ======================================

    function showBrowserNotification(title, body) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
            var notification = new Notification(title, {
                body: body,
                icon: 'favicon.ico',
                badge: 'favicon.ico',
                tag: 'taskflow-reminder',
                requireInteraction: true,
                silent: true  // We handle sound ourselves
            });
            notification.onclick = function () {
                window.focus();
                notification.close();
            };
            setTimeout(function () { notification.close(); }, 15000);
        } catch (e) {
            // Fallback
        }
    }

    // ======================================
    // Full alert: sound + speech + browser notification + toast
    // ======================================

    function fireAlert(title, body, speakText) {
        // 1. Play sound
        playAlertSound();

        // 2. Browser notification
        showBrowserNotification(title, body);

        // 3. Spoken reminder
        if (speakText) {
            speakReminder(speakText);
        }

        // 4. In-app toast
        if (typeof showNotification === 'function') {
            showNotification(title, body, 'warning');
        }
    }

    // ======================================
    // Check for due reminders (foreground check)
    // ======================================

    function checkDueReminders() {
        var notificationsEnabled = localStorage.getItem('taskflow_notifications');
        if (notificationsEnabled === 'false') return;
        if (typeof getReminders !== 'function') return;

        var reminders = getReminders();
        var now = new Date();

        reminders.forEach(function (reminder) {
            if (reminder.completed) return;

            var reminderTime = new Date(reminder.taskDate + 'T' + reminder.taskTime);
            var reminderId = reminder.id || (reminder.taskDate + '-' + reminder.taskTime);

            if (notifiedReminders[reminderId]) return;

            var diffMs = reminderTime.getTime() - now.getTime();
            var diffMin = diffMs / (1000 * 60);

            // Due now (within -1.5 to +1.5 minutes)
            if (diffMin >= -1.5 && diffMin <= 1.5) {
                fireAlert(
                    '⏰ Reminder: ' + reminder.taskName,
                    'Category: ' + reminder.category + ' | Priority: ' + reminder.priority,
                    'Reminder! ' + reminder.taskName
                );
                notifiedReminders[reminderId] = true;
            }

            // 5 minutes before
            if (diffMin >= 4 && diffMin <= 6 && !notifiedReminders[reminderId + '-5min']) {
                fireAlert(
                    '📋 Upcoming in 5 min: ' + reminder.taskName,
                    'Scheduled for ' + reminder.taskTime,
                    'Upcoming in 5 minutes: ' + reminder.taskName
                );
                notifiedReminders[reminderId + '-5min'] = true;
            }
        });
    }

    // ======================================
    // Initialize
    // ======================================

    document.addEventListener('DOMContentLoaded', async function () {
        // Request permission on first user click (Edge requirement)
        var userClicked = false;
        function onFirstUserClick() {
            if (userClicked) return;
            userClicked = true;
            requestNotificationPermission(function (status) {
                console.log('Browser notification permission:', status);
            });
            document.removeEventListener('click', onFirstUserClick);
        }
        document.addEventListener('click', onFirstUserClick);

        // Request Local Notifications permission (for Android)
        await requestLocalNotificationsPermission();

        // Schedule all reminders as local notifications (background support)
        await scheduleAllReminders();

        // Foreground check every 30 seconds
        checkDueReminders();
        setInterval(checkDueReminders, CHECK_INTERVAL);

        // Re-schedule local notifications every hour
        setInterval(scheduleAllReminders, 60 * 60 * 1000);
    });

    // ======================================
    // Expose functions globally
    // ======================================

    window.requestTaskFlowNotifications = requestNotificationPermission;
    window.scheduleAllReminders = scheduleAllReminders;
    window.cancelAllLocalNotifications = cancelAllLocalNotifications;

})();
