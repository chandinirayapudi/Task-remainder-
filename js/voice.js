// ======================================
// TaskFlow Pro - Voice Reminder Module
// Uses browser Web Speech API
// Supports: English, Telugu, Hindi, Mixed
//
// Pipeline:
//   1. Speech Recognition → raw transcript
//   2. Language Detection from transcript
//   3. Task Extraction (task, date, time)
//   4. User Confirmation (show what was heard)
//   5. Save (fill form + submit)
// ======================================

(function () {
    'use strict';

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var voiceSupported = !!SpeechRecognition;
    var voiceBtn = null;
    var voiceStatus = null;
    var isListening = false;
    var recognition = null;
    var detectedLang = null; // overrides getLanguage() when set from speech

    // Stored parsed data for confirmation flow
    var lastParsedData = null;
    var lastRawTranscript = null;
    var lastTranscriptConfidence = null;

    // ======================================
    // Language Data
    // ======================================

    var LANG_DATA = {
        'en-US': {
            months: {
                'january': 0, 'jan': 0,
                'february': 1, 'feb': 1,
                'march': 2, 'mar': 2,
                'april': 3, 'apr': 3,
                'may': 4,
                'june': 5, 'jun': 5,
                'july': 6, 'jul': 6,
                'august': 7, 'aug': 7,
                'september': 8, 'sep': 8, 'sept': 8,
                'october': 9, 'oct': 9,
                'november': 10, 'nov': 10,
                'december': 11, 'dec': 11
            },
            categories: [
                { category: 'Study',    keywords: ['study', 'learn', 'read', 'homework', 'exam', 'class', 'course', 'python', 'java', 'code', 'coding', 'programming', 'lecture', 'tutorial', 'revision', 'practice', 'test', 'chapter', 'book', 'notes', 'assignment'] },
                { category: 'Work',     keywords: ['meeting', 'work', 'office', 'project', 'deadline', 'report', 'presentation', 'client', 'boss', 'interview', 'resume', 'email', 'conference', 'colleague', 'task', 'submit', 'review'] },
                { category: 'Medicine', keywords: ['medicine', 'doctor', 'medication', 'pill', 'appointment', 'health', 'hospital', 'checkup', 'prescription', 'pharmacy', 'tablet', 'dose', 'dentist', 'therapy'] },
                { category: 'Shopping', keywords: ['buy', 'shop', 'grocery', 'groceries', 'purchase', 'order', 'market', 'supermarket', 'mall', 'store', 'amazon', 'delivery', 'price', 'discount', 'coupon'] },
                { category: 'Personal', keywords: ['birthday', 'call', 'visit', 'party', 'gift', 'wish', 'wedding', 'anniversary', 'date', 'dinner', 'lunch', 'movie', 'friend', 'family', 'home', 'clean', 'cook', 'wash', 'iron', 'gym', 'workout', 'exercise', 'walk', 'yoga'] },
                { category: 'Home',     keywords: ['motor', 'ac', 'cooler', 'fan', 'light', 'bulb', 'tv', 'geyser', 'mixer', 'microwave', 'fridge', 'refrigerator', 'inverter', 'pump', 'washing', 'machine', 'heater', 'exhaust', 'switch', 'turn', 'off', 'on', 'laundry', 'dishes', 'bowls', 'sweep', 'mop', 'vacuum', 'dusting', 'cleaning'] },
                { category: 'Music',    keywords: ['music', 'song', 'concert', 'guitar', 'piano', 'sing', 'band', 'album', 'listen', 'playlist'] }
            ],
            fillerPhrases: [
                /^remind me to\s+/i,
                /^remember to\s+/i,
                /^i need to\s+/i,
                /^please remind me to\s+/i,
                /^can you remind me to\s+/i,
                /^set a reminder to\s+/i,
                /^set a reminder for\s+/i,
                /^i want to be reminded to\s+/i,
                /^don'?t forget to\s+/i
            ],
            repeatPatterns: [
                { pattern: /\b(every\s+day|daily|each\s+day)\b/i, repeat: 'daily' },
                { pattern: /\b(every\s+week|weekly|each\s+week)\b/i, repeat: 'weekly' },
                { pattern: /\b(every\s+month|monthly|each\s+month)\b/i, repeat: 'monthly' },
                { pattern: /\b(every\s+year|yearly|annually|each\s+year)\b/i, repeat: 'yearly' }
            ],
            dayNames: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            relativeDates: {
                'tomorrow': 1,
                'today': 0,
                'yesterday': -1,
                'day after tomorrow': 2
            },
            timeOfDayWords: {
                'morning': 'am',
                'afternoon': 'pm',
                'evening': 'pm',
                'night': 'night'
            },
            timeWords: {
                'noon': '12:00',
                'midnight': '00:00'
            },
            timePrepositions: ['at', 'in', 'on', 'for', 'by'],
            romanDateWords: {
                'repu': 1, 'repu': 1, 'tomorrow': 1,
                'eeroju': 0, 'eroju': 0, 'today': 0,
                'monna': -1, 'ninna': -1, 'yesterday': -1
            },
            romanTimeOfDay: {
                'morning': 'am', 'afternoon': 'pm', 'evening': 'pm', 'night': 'night'
            }
        },

        'te-IN': {
            months: {
                '\u0C1C\u0C28\u0C35\u0C30\u0C3F': 0, '\u0C1C\u0C28': 0,
                '\u0C2B\u0C3F\u0C2C\u0C4D\u0C30\u0C35\u0C30\u0C3F': 1, '\u0C2B\u0C3F\u0C2C\u0C4D\u0C30': 1,
                '\u0C2E\u0C3E\u0C30\u0C4D\u0C1A\u0C3F': 2, '\u0C2E\u0C3E\u0C30\u0C4D\u0C1A': 2,
                '\u0C0F\u0C2A\u0C4D\u0C30\u0C3F\u0C32\u0C4D': 3, '\u0C0F\u0C2A\u0C4D\u0C30\u0C3F': 3,
                '\u0C2E\u0C47': 4,
                '\u0C1C\u0C42\u0C28\u0C4D': 5, '\u0C1C\u0C42\u0C28': 5,
                '\u0C1C\u0C42\u0C32\u0C3E\u0C2F\u0C4D': 6, '\u0C1C\u0C42\u0C32': 6,
                '\u0C06\u0C17\u0C38\u0C4D\u0C1F\u0C41': 7, '\u0C06\u0C17': 7,
                '\u0C38\u0C46\u0C2A\u0C4D\u0C1F\u0C46\u0C02\u0C2C\u0C30\u0C4D': 8, '\u0C38\u0C46\u0C2A\u0C4D': 8,
                '\u0C05\u0C25\u0C4D\u0C15\u0C4D\u0C1F\u0C4B\u0C2C\u0C30\u0C4D': 9, '\u0C05\u0C25\u0C4D\u0C15\u0C4D\u0C1F\u0C4B': 9,
                '\u0C28\u0C35\u0C02\u0C2C\u0C30\u0C4D': 10, '\u0C28\u0C35\u0C02': 10,
                '\u0C21\u0C3F\u0C38\u0C46\u0C02\u0C2C\u0C30\u0C4D': 11, '\u0C21\u0C3F\u0C38\u0C46': 11
            },
            categories: [
                { category: 'Study',    keywords: ['\u0C1A\u0C26\u0C41\u0C35\u0C41', '\u0C28\u0C47\u0C30\u0C4D\u0C1A\u0C41\u0C15\u0C4B', '\u0C1A\u0C26\u0C35\u0C02\u0C21\u0C3F', '\u0C39\u0C4B\u0C02\u0C35\u0C30\u0C4D\u0C15\u0C4D', '\u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37', '\u0C15\u0C4D\u0C32\u0C3E\u0C38\u0C4D', '\u0C15\u0C4B\u0C30\u0C4D\u0C38\u0C4D', '\u0C15\u0C4B\u0C21\u0C3F\u0C02\u0C17\u0C4D', '\u0C2A\u0C4D\u0C30\u0C4B\u0C17\u0C4D\u0C30\u0C3E\u0C2E\u0C3F\u0C02\u0C17\u0C4D', '\u0C32\u0C46\u0C15\u0C4D\u0C1A\u0C30\u0C4D', '\u0C1F\u0C4D\u0C2F\u0C42\u0C1F\u0C4B\u0C30\u0C3F\u0C2F\u0C32\u0C4D', '\u0C2A\u0C41\u0C38\u0C4D\u0C24\u0C15\u0C02', '\u0C28\u0C4B\u0C1F\u0C4D\u0C38\u0C4D', '\u0C05\u0C38\u0C48\u0C28\u0C4D\u0C2E\u0C46\u0C02\u0C1F\u0C4D'] },
                { category: 'Work',     keywords: ['\u0C2E\u0C40\u0C1F\u0C3F\u0C02\u0C17\u0C4D', '\u0C2A\u0C28\u0C3F', '\u0C06\u0C2B\u0C40\u0C38\u0C4D', '\u0C2A\u0C4D\u0C30\u0C3E\u0C1C\u0C46\u0C15\u0C4D\u0C1F\u0C4D', '\u0C21\u0C46\u0C21\u0C4D\u200C\u0C32\u0C48\u0C28\u0C4D', '\u0C30\u0C3F\u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C4D', '\u0C2A\u0C4D\u0C30\u0C46\u0C38\u0C46\u0C02\u0C1F\u0C47\u0C37\u0C28\u0C4D', '\u0C15\u0C4D\u0C32\u0C2F\u0C3F\u0C02\u0C1F\u0C4D', '\u0C2C\u0C3E\u0C38\u0C4D', '\u0C07\u0C02\u0C1F\u0C30\u0C4D\u0C35\u0C4D\u0C2F\u0C42', '\u0C30\u0C3F\u0C1C\u0C4D\u0C2F\u0C42\u0C2E\u0C4D', '\u0C07\u0C2E\u0C46\u0C2F\u0C3F\u0C32\u0C4D', '\u0C38\u0C2E\u0C40\u0C15\u0C4D\u0C37'] },
                { category: 'Medicine', keywords: ['\u0C2E\u0C02\u0C26\u0C41', '\u0C21\u0C3E\u0C15\u0C4D\u0C1F\u0C30\u0C4D', '\u0C2E\u0C46\u0C21\u0C3F\u0C15\u0C47\u0C37\u0C28\u0C4D', '\u0C2E\u0C3E\u0C24\u0C4D\u0C30', '\u0C05\u0C2A\u0C3E\u0C2F\u0C3F\u0C02\u0C1F\u0C4D\u200C\u0C2E\u0C46\u0C02\u0C1F\u0C4D', '\u0C06\u0C30\u0C4B\u0C17\u0C4D\u0C2F\u0C02', '\u0C39\u0C3E\u0C38\u0C4D\u0C2A\u0C3F\u0C1F\u0C32\u0C4D', '\u0C1A\u0C46\u0C15\u0C2A\u0C4D', '\u0C2A\u0C4D\u0C30\u0C3F\u0C38\u0C4D\u0C15\u0C4D\u0C30\u0C3F\u0C2A\u0C4D\u0C37\u0C28\u0C4D', '\u0C2B\u0C3E\u0C30\u0C4D\u0C2E\u0C38\u0C40', '\u0C1F\u0C3E\u0C2C\u0C4D\u0C32\u0C46\u0C1F\u0C4D', '\u0C21\u0C46\u0C02\u0C1F\u0C3F\u0C38\u0C4D\u0C1F\u0C4D'] },
                { category: 'Shopping', keywords: ['\u0C15\u0C4A\u0C28\u0C41', '\u0C37\u0C3E\u0C2A\u0C4D', '\u0C17\u0C4D\u0C30\u0C3E\u0C38\u0C30\u0C40', '\u0C15\u0C4A\u0C28\u0C02\u0C21\u0C3F', '\u0C2E\u0C3E\u0C30\u0C4D\u0C15\u0C46\u0C1F\u0C4D', '\u0C38\u0C42\u0C2A\u0C30\u0C4D\u200C\u0C2E\u0C3E\u0C30\u0C4D\u0C15\u0C46\u0C1F\u0C4D', '\u0C2E\u0C3E\u0C32\u0C4D', '\u0C38\u0C4D\u0C1F\u0C4B\u0C30\u0C4D', '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D', '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40'] },
                { category: 'Personal', keywords: ['\u0C2A\u0C41\u0C1F\u0C4D\u0C1F\u0C3F\u0C28\u0C30\u0C4B\u0C1C\u0C41', '\u0C15\u0C3E\u0C32\u0C4D', '\u0C35\u0C3F\u0C1C\u0C3F\u0C1F\u0C4D', '\u0C2A\u0C3E\u0C30\u0C4D\u0C1F\u0C40', '\u0C17\u0C3F\u0C2B\u0C4D\u0C1F\u0C4D', '\u0C2A\u0C46\u0C33\u0C4D\u0C32\u0C3F', '\u0C05\u0C28\u0C4D\u0C28\u0C3F\u0C35\u0C30\u0C4D\u0C38\u0C30\u0C40', '\u0C21\u0C3F\u0C28\u0C4D\u0C28\u0C30\u0C4D', '\u0C32\u0C02\u0C1A\u0C4D', '\u0C38\u0C3F\u0C28\u0C3F\u0C2E\u0C3E', '\u0C2B\u0C4D\u0C30\u0C46\u0C02\u0C21\u0C4D', '\u0C2B\u0C4D\u0C2F\u0C3E\u0C2E\u0C3F\u0C32\u0C40', '\u0C07\u0C32\u0C4D\u0C32\u0C41', '\u0C15\u0C4D\u0C32\u0C40\u0C28\u0C4D', '\u0C35\u0C02\u0C1F', '\u0C1C\u0C3F\u0C2E\u0C4D', '\u0C35\u0C3E\u0C15\u0C4D'] },
                { category: 'Music',    keywords: ['\u0C38\u0C02\u0C17\u0C40\u0C24\u0C02', '\u0C2A\u0C3E\u0C1F', '\u0C15\u0C1A\u0C47\u0C30\u0C40', '\u0C17\u0C3F\u0C1F\u0C3E\u0C30\u0C4D', '\u0C2A\u0C3F\u0C2F\u0C3E\u0C28\u0C4B', '\u0C2A\u0C3E\u0C21\u0C41', '\u0C2C\u0C4D\u0C2F\u0C3E\u0C02\u0C21\u0C4D', '\u0C06\u0C32\u0C4D\u0C2C\u0C2E\u0C4D', '\u0C35\u0C3F\u0C28\u0C41', '\u0C2A\u0C4D\u0C32\u0C47\u0C32\u0C3F\u0C38\u0C4D\u0C1F\u0C4D'] }
            ],
            fillerPhrases: [
                /^\u0C28\u0C3E\u0C15\u0C41 \u0C17\u0C41\u0C30\u0C4D\u0C24\u0C41\u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F\s+/i,
                /^\u0C17\u0C41\u0C30\u0C4D\u0C24\u0C41\u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F\s+/i,
                /^\u0C28\u0C3E\u0C15\u0C41\s+/i,
                /^\u0C30\u0C3F\u0C2E\u0C48\u0C02\u0C21\u0C30\u0C4D \u0C38\u0C46\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F\s+/i
            ],
            repeatPatterns: [
                { pattern: /\u0C2A\u0C4D\u0C30\u0C24\u0C3F\u0C38\u0C4D+\u0C30\u0C4B\u0C1C\u0C41|\u0C30\u0C4B\u0C1C\u0C42|\u0C2A\u0C4D\u0C30\u0C24\u0C3F\u0C30\u0C4B\u0C1C\u0C42/i, repeat: 'daily' },
                { pattern: /\u0C2A\u0C4d\u0C30\u0C24\u0C3F\u0C38\u0C4D+\u0C35\u0C3E\u0C30\u0C02|\u0C35\u0C3E\u0C30\u0C3E\u0C28\u0C3F\u0C15\u0C3F/i, repeat: 'weekly' },
                { pattern: /\u0C2A\u0C4d\u0C30\u0C24\u0C3F\u0C38\u0C4D+\u0C28\u0C46\u0C32|\u0C28\u0C46\u0C32\u0C15\u0C41/i, repeat: 'monthly' },
                { pattern: /\u0C2A\u0C4d\u0C30\u0C24\u0C3F\u0C38\u0C4D+\u0C38\u0C02\u0C35\u0C24\u0C4D\u0C38\u0C30\u0C02|\u0C38\u0C02\u0C35\u0C24\u0C4D\u0C38\u0C30\u0C3E\u0C28\u0C3F\u0C15\u0C3F/i, repeat: 'yearly' }
            ],
            dayNames: ['\u0C06\u0C26\u0C3F\u0C35\u0C3E\u0C30\u0C02', '\u0C38\u0C4B\u0C2E\u0C35\u0C3E\u0C30\u0C02', '\u0C2E\u0C02\u0C17\u0C33\u0C35\u0C3E\u0C30\u0C02', '\u0C2C\u0C41\u0C27\u0C35\u0C3E\u0C30\u0C02', '\u0C17\u0C41\u0C30\u0C41\u0C35\u0C3E\u0C30\u0C02', '\u0C36\u0C41\u0C15\u0C4D\u0C30\u0C35\u0C3E\u0C30\u0C02', '\u0C36\u0C28\u0C3F\u0C35\u0C3E\u0C30\u0C02'],
            relativeDates: {
                '\u0C30\u0C47\u0C2A\u0C41': 1,
                '\u0C0E\u0C30\u0C4D\u0C2E\u0C41\u0C35': 1,
                '\u0C07\u0C30\u0C4B\u0C1C\u0C41': 0,
                '\u0C28\u0C47\u0C21\u0C41': 0,
                '\u0C2E\u0C4A\u0C28\u0C4D\u0C28': -1
            },
            timeOfDayWords: {
                '\u0C09\u0C26\u0C2F\u0C02': 'am',
                '\u0C2E\u0C27\u0C4D\u0C2F\u0C3E\u0C39\u0C4D\u0C28\u0C02': 'pm',
                '\u0C38\u0C3E\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C02': 'pm',
                '\u0C30\u0C3E\u0C24\u0C4D\u0C30\u0C3F': 'night'
            },
            clockWord: '\u0C17\u0C02\u0C1F\u0C32\u0C15\u0C41',
            timePrepositions: ['\u0C15\u0C4B', '\u0C2F\u0C4D', '\u0C28\u0C28\u0C41', '\u0C32\u0C4B', '\u0C15\u0C3F'],
            romanRelativeDates: {
                'repu': 1, 'repu': 1,
                'eroju': 0, 'eeroju': 0,
                'ninna': -1, 'monna': -1,
                'tarvatha': 0, 'mundu': 0
            },
            romanTimeOfDay: {
                'udayam': 'am', 'morning': 'am',
                'madhyanham': 'pm', 'afternoon': 'pm',
                'sayantram': 'pm', 'evening': 'pm',
                'rathri': 'night', 'night': 'night',
                'lekapothe': null, 'later': null
            },
            romanClockWord: 'gantaku',
            romanClockWords: ['gantaku', 'gantallo', 'gantllo', 'inta', 'intaki'],
            romanFillerPhrases: [
                /^(naaku|naku)\s+/i,
                /^(gurinchi|gurunchi)\s+/i,
                /^(nenu|nen)\s+/i
            ],
            romanCategoryKeywords: {
                'Study': ['chaduvu', 'nerchukoni', 'padava', 'class', 'exam', 'lecture', 'notes', 'homework', 'assignment', 'coding', 'programming', 'python', 'java', 'book'],
                'Work': ['meeting', 'work', 'office', 'project', 'deadline', 'report', 'client', 'boss', 'email', 'submit', 'review', 'pani'],
                'Medicine': ['mandu', 'doctor', 'medicine', 'hospital', 'checkup', 'tablet', 'pill', 'prescription', 'pharmacy'],
                'Shopping': ['konu', 'shop', 'grocery', 'market', 'mall', 'store', 'order', 'amazon', 'delivery'],
                'Personal': ['call', 'visit', 'party', 'gift', 'birthday', 'wedding', 'friend', 'family', 'home', 'cook', 'wash', 'gym', 'workout', 'walk', 'velli', 'cheyali', 'cheppali', 'randi', 'randam', 'utikadam', 'utika', 'udikadam', 'thuduchukovadam', 'shubram', 'clean', 'sweep', 'mop', 'dust', 'polish', 'iron', 'fold', 'organize', 'tidy'],
                'Home': ['motor', 'ac', 'acs', 'cooker', 'fan', 'fans', 'light', 'lights', 'tv', 'geyser', 'mixie', 'mixer', 'microwave', 'fridge', 'refrigerator', 'inverter', 'pump', 'pumpu', 'washing', 'machine', 'dishwasher', 'heater', 'cooler', 'exhaust', 'water', 'power', 'switch', 'off', 'on', 'start', 'stop', 'band', 'moodu', 'oncheyu', 'offcheyu', 'startcheyu', 'stopcheyu'],
                'Music': ['song', 'music', 'concert', 'guitar', 'piano', 'sing', 'listen', 'playlist']
            }
        },

        'hi-IN': {
            months: {
                '\u091C\u0928\u0935\u0930\u0940': 0, '\u091C\u0928': 0,
                '\u092B\u0930\u0935\u0930\u0940': 1, '\u092B\u0930': 1,
                '\u092E\u093E\u0930\u094D\u091A': 2,
                '\u0905\u092A\u094D\u0930\u0948\u0932': 3,
                '\u092E\u0908': 4,
                '\u091C\u0942\u0928': 5,
                '\u091C\u0941\u0932\u093E\u0907': 6,
                '\u0905\u0917\u0938\u094D\u0924': 7, '\u0905\u0917': 7,
                '\u0938\u093F\u0924\u0902\u092C\u0930': 8, '\u0938\u093F\u0924': 8,
                '\u0905\u0915\u094D\u091F\u0942\u092C\u0930': 9, '\u0905\u0915\u094D\u091F\u0942': 9,
                '\u0928\u0935\u0902\u092C\u0930': 10, '\u0928\u0935\u0902': 10,
                '\u0926\u093F\u0938\u0902\u092C\u0930': 11, '\u0926\u093F\u0938': 11
            },
            categories: [
                { category: 'Study',    keywords: ['\u092A\u0922\u093C\u093E\u0908', '\u092A\u0922\u093C\u0928\u093E', '\u0938\u0940\u0916\u0928\u093E', '\u0939\u094B\u092E\u0935\u0930\u094D\u0915', '\u092A\u0930\u0940\u0915\u094D\u0937\u093E', '\u0915\u094D\u0932\u093E\u0938', '\u0915\u094B\u0930\u094D\u0938', '\u0915\u094B\u0921\u093F\u0902\u0917', '\u092A\u094D\u0930\u094B\u0917\u094D\u0930\u093E\u092E\u093F\u0902\u0917', '\u0932\u0947\u0915\u094D\u091A\u0930', '\u091F\u094D\u092F\u0942\u091F\u094B\u0930\u093F\u0905\u0932', '\u0915\u093F\u0924\u093E\u092C', '\u0928\u094B\u091F\u094D\u0938', '\u0905\u0938\u093E\u0907\u0928\u092E\u0947\u0902\u091F'] },
                { category: 'Work',     keywords: ['\u092E\u0940\u091F\u093F\u0902\u0917', '\u0915\u093E\u092E', '\u0911\u092B\u093F\u0938', '\u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F', '\u0921\u0947\u0921\u0932\u093E\u0907\u0928', '\u0930\u093F\u092A\u094B\u0930\u094D\u091F', '\u092A\u094D\u0930\u0947\u091C\u0947\u0902\u091F\u0947\u0936\u0928', '\u0915\u094D\u0932\u093E\u0907\u0902\u091F', '\u092C\u0949\u0938', '\u0907\u0902\u091F\u0930\u0935\u094D\u092F\u0942', '\u0930\u093F\u091C\u094D\u092F\u0942\u092E\u0947', '\u0908\u092E\u0947\u0932', '\u0938\u092E\u0940\u0915\u094D\u0937\u093E'] },
                { category: 'Medicine', keywords: ['\u0926\u0935\u093E', '\u0921\u0949\u0915\u094D\u091F\u0930', '\u092E\u0947\u0921\u093F\u0915\u0947\u0936\u0928', '\u0917\u094B\u0932\u0940', '\u0905\u092A\u0949\u0907\u0902\u091F\u092E\u0947\u0902\u091F', '\u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F', '\u0905\u0938\u094D\u092A\u0924\u093E\u0932', '\u091C\u093E\u0902\u091A', '\u092B\u093E\u0930\u094D\u092E\u0947\u0938\u0940', '\u091F\u0948\u092C\u0932\u0947\u091F', '\u0921\u0947\u0902\u091F\u093F\u0938\u094D\u091F'] },
                { category: 'Shopping', keywords: ['\u0916\u0930\u0940\u0926\u0928\u093E', '\u0936\u0949\u092A', '\u0915\u093F\u0930\u093E\u0928\u093E', '\u092C\u093E\u091C\u093E', '\u0938\u0941\u092A\u0930\u092E\u093E\u0930\u094D\u0915\u0947\u091F', '\u092E\u0949\u0932', '\u0938\u094D\u091F\u094B\u0930', '\u0911\u0930\u094D\u0921\u0930', '\u0921\u093F\u0932\u0940', '\u092E\u0902\u0917\u093E\u0928\u093E'] },
                { category: 'Personal', keywords: ['\u091C\u0928\u094D\u092E\u0926\u093F\u0928', '\u0915\u0949\u0932', '\u092E\u093F\u0932\u0928\u093E', '\u092A\u093E\u0930\u094D\u091F\u0940', '\u0917\u093F\u092B\u094D\u091F', '\u0936\u093E\u0926\u0940', '\u092A\u0930\u093F\u0935\u093E\u0930', '\u0921\u093F\u0928\u0930', '\u0932\u0902\u091A', '\u092B\u093F\u0932\u094D\u092E', '\u0926\u094B\u0938\u094D\u0924', '\u0918\u0930', '\u0938\u092B\u093E\u0908', '\u0916\u093E\u0928\u093E', '\u091C\u093F\u092E', '\u0918\u0942\u092E\u0928\u093E'] },
                { category: 'Music',    keywords: ['\u0938\u0902\u0917\u0940\u0924', '\u0917\u093E\u0928\u093E', '\u0915\u0949\u0928\u094D\u0938\u0930\u094D\u091F', '\u0917\u093F\u091F\u093E\u0930', '\u092A\u093F\u092F\u093E\u0928\u094B', '\u092C\u0948\u0902\u0921', '\u090F\u0932\u094D\u092C\u092E', '\u0938\u0941\u0928\u0928\u093E', '\u092A\u094D\u0932\u0947\u0932\u093F\u0938\u094D\u091F'] }
            ],
            fillerPhrases: [
                /^\u092E\u0941\u091C\u0947 \u092F\u093E\u0926 \u0926\u093F\u0932\u093E\u0913\s+/i,
                /^\u092F\u093E\u0926 \u0926\u093F\u0932\u093E\u0913\s+/i,
                /^\u092E\u0941\u091C\u0947\s+/i,
                /^\u0930\u093F\u092E\u093E\u0907\u0902\u0921\u0930 \u0938\u0947\u091F \u0915\u0930\u094B\s+/i,
                /^\u0930\u093F\u092E\u093E\u0907\u0902\u0921\u0930 \u0932\u0917\u093E\u0913\s+/i
            ],
            repeatPatterns: [
                { pattern: /\u0939\u0930\u0938+\u0926\u093F\u0928|\u0930\u094B\u091C\u093C\u0947|\u092A\u094D\u0930\u0924\u093F\u0926\u093F\u0928/i, repeat: 'daily' },
                { pattern: /\u0939\u0930\u0938+\u0939\u092B\u094D\u0924\u0947|\u0938\u093E\u092A\u094D\u0924\u093E\u0939\u093F\u0915/i, repeat: 'weekly' },
                { pattern: /\u0939\u0930\u0938+\u092E\u0939\u0940\u0928\u0947|\u092E\u093E\u0938\u093F\u0915/i, repeat: 'monthly' },
                { pattern: /\u0939\u0930\u0938+\u0938\u093E\u0932|\u0935\u093E\u0930\u094D\u0937\u093F\u0915/i, repeat: 'yearly' }
            ],
            dayNames: ['\u0930\u0935\u093F\u0935\u093E\u0930', '\u0938\u094B\u092E\u0935\u093E\u0930', '\u092E\u0902\u0917\u0932\u0935\u093E\u0930', '\u092C\u0941\u0927\u0935\u093E\u0930', '\u0917\u0941\u0930\u0941\u0935\u093E\u0930', '\u0936\u0941\u0915\u094D\u0930\u0935\u093E\u0930', '\u0936\u0928\u093F\u0935\u093E\u0930'],
            relativeDates: {
                '\u0915\u0932': 1,
                '\u092A\u0930\u0938\u094B\u0902': 2,
                '\u0906\u091C': 0,
                '\u0906\u091C \u0930\u093E\u0924': 0,
                '\u092A\u0930\u0938\u094B\u0902 \u0930\u093E\u0924': 2
            },
            clockWord: '\u092C\u091C\u093E',
            timeOfDayWords: {
                '\u0938\u0941\u092C\u0939': 'am',
                '\u0926\u094B\u092A\u0939\u0930': 'pm',
                '\u0936\u093E\u092E': 'pm',
                '\u0930\u093E\u0924': 'night',
                '\u0938\u093E\u092F\u0902\u0924': 'night'
            },
            timePrepositions: ['\u092E\u0947\u0902', '\u0915\u094B', '\u0928\u0939\u0940\u0902'],
            romanRelativeDates: {
                'kal': 1, 'aaj': 0, 'parson': 2, 'parson day after tomorrow': 2
            },
            romanTimeOfDay: {
                'subah': 'am', 'morning': 'am',
                'dopahar': 'pm', 'afternoon': 'pm',
                'shaam': 'pm', 'evening': 'pm',
                'raat': 'night', 'night': 'night'
            },
            romanClockWord: 'baje',
            romanClockWords: ['baje', 'baj kar', 'bajega'],
            romanFillerPhrases: [
                /^(mujhe|mujhe)\s+/i,
                /^(yaad\s+dilana|mujhe\s+yaad\s+dilana)\s+/i,
                /^(main|mein|mi)\s+/i
            ],
            romanCategoryKeywords: {
                'Study': ['padhai', 'padhna', 'padhna', 'class', 'exam', 'lecture', 'notes', 'homework', 'assignment', 'coding', 'programming', 'python', 'java', 'book', 'kitaab'],
                'Work': ['meeting', 'kaam', 'work', 'office', 'project', 'deadline', 'report', 'client', 'boss', 'email', 'submit', 'review'],
                'Medicine': ['dawa', 'davai', 'doctor', 'medicine', 'hospital', 'checkup', 'tablet', 'goli', 'prescription'],
                'Shopping': ['kharidna', 'khareedna', 'shop', 'grocery', 'bazaar', 'mall', 'store', 'order', 'amazon', 'delivery', 'lena'],
                'Personal': ['call', 'milna', 'visit', 'party', 'gift', 'birthday', 'shaadi', 'wedding', 'dost', 'friend', 'family', 'ghar', 'home', 'pakana', 'karna', 'jana', 'aana', 'challo', 'chalo', 'dhona', 'dhulai', 'saaf', 'pocha', 'safai', 'kapda', 'kapde', 'silai', 'istri'],
                'Home': ['motor', 'ac', 'cooler', 'fan', 'light', 'bulb', 'tv', 'geyser', 'mixer', 'microwave', 'fridge', 'freezer', 'inverter', 'pump', 'washing', 'machine', 'heater', 'exhaust', 'paani', 'bijli', 'switch', 'band', 'kholo', 'chalu', 'bandh'],
                'Music': ['gaana', 'song', 'music', 'concert', 'guitar', 'piano', 'gaana', 'sunna', 'listen']
            }
        }
    };

    // ======================================
    // Get current language
    // ======================================

    function getLanguage() {
        // If language was detected from speech, use that
        if (detectedLang) return detectedLang;
        var saved = localStorage.getItem('taskflow_language');
        if (!saved || saved === 'auto') {
            // Check mother tongue preference first
            var motherTongue = localStorage.getItem('taskflow_mother_tongue');
            if (motherTongue && motherTongue !== 'none') {
                return motherTongue;
            }
            // Auto-detect from navigator.languages array
            var langs = navigator.languages || [];
            for (var i = 0; i < langs.length; i++) {
                var lang = langs[i].toLowerCase();
                if (lang.startsWith('hi')) return 'hi-IN';
                if (lang.startsWith('te')) return 'te-IN';
            }
            // Fallback to navigator.language
            var primary = (navigator.language || navigator.userLanguage || 'en-US').toLowerCase();
            if (primary.startsWith('hi')) return 'hi-IN';
            if (primary.startsWith('te')) return 'te-IN';
            return 'en-US';
        }
        return saved;
    }

    function getLangData() {
        var lang = getLanguage();
        return LANG_DATA[lang] || LANG_DATA['en-US'];
    }

    // ======================================
    // Detect language from spoken text
    // ======================================
    function detectLanguageFromText(text) {
        // Check for Telugu script characters (Unicode 0C00-0C7F)
        if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
        // Check for Devanagari/Hindi script characters (Unicode 0900-097F)
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
        
        // Check for Roman Telugu words
        var lower = text.toLowerCase();
        var romanTeluguWords = ['repu', 'eroju', 'eeroju', 'ninna', 'monna', 'cheyali', 'cheyali', 'velli', 'randi', 'randam', 'gantaku', 'udayam', 'sayantram', 'madhyanham', 'rathri', 'naaku', 'naku', 'nen', 'nenu', 'gurinchi', 'gurunchi', 'konu', 'kaavali', 'undali', 'cheyalsindi', 'chestha', 'cheddam', 'pedda', 'chinna', 'manchi', 'baga', 'thondaraga', 'lepuna', 'بعد'];
        var teCount = 0;
        for (var i = 0; i < romanTeluguWords.length; i++) {
            if (lower.indexOf(romanTeluguWords[i]) !== -1) teCount++;
        }
        
        // Check for Roman Hindi words
        var romanHindiWords = ['kal', 'aaj', 'parson', 'baje', 'subah', 'dopahar', 'shaam', 'raat', 'karna', 'karna hai', 'karna hoga', 'mujhe', 'yaad', 'dilana', 'hai', 'hoga', 'thik', 'bhi', 'abhi', 'phir', 'lekin', 'acha', 'chalo', 'challo', 'karo', 'kijiye', 'bolo', 'jana', 'aana', 'lena', 'dena', 'padhai', 'padhna', 'kaam', 'kharidna', 'dawa', 'davai', 'gaana', 'sunna'];
        var hiCount = 0;
        for (var j = 0; j < romanHindiWords.length; j++) {
            if (lower.indexOf(romanHindiWords[j]) !== -1) hiCount++;
        }
        
        // If more Telugu matches, use Telugu
        if (teCount > hiCount && teCount >= 1) return 'te-IN';
        // If more Hindi matches, use Hindi
        if (hiCount > teCount && hiCount >= 1) return 'hi-IN';
        
        // Default to English
        return 'en-US';
    }

    // ======================================
    // Regex helpers (avoid escaping issues)
    // ======================================

    function buildWordBoundaryPattern(wordList) {
        // Escapes special regex chars in each word, then joins with |
        // NOTE: \b does NOT work with Telugu/Hindi Unicode characters,
        // so we use whitespace-based matching (^|\s) and (\s|$) in the callers.
        return wordList.map(function (w) {
            return w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }).join('|');
    }

    // Custom word boundary that works with all scripts (Telugu, Hindi, etc.)
    // Uses (?:^|\s)WORD(?:\s|$) instead of \bWORD\b
    function makeSafeWordRegex(word) {
        var escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp('(?:^|\\s)' + escaped + '(?:\\s|$)', 'i');
    }

    function makeMonthDayPattern1(monthPattern) {
        return new RegExp(
            '(?:^|\\s)(' + monthPattern + ')(?:\\s+)(\\d{1,2})(?:st|nd|rd|th)?(?:\\s|$)',
            'i'
        );
    }

    function makeMonthDayPattern2(monthPattern) {
        return new RegExp(
            '(?:^|\\s)(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+)(' + monthPattern + ')(?:\\s|$)',
            'i'
        );
    }

    function makeDayOfWeekPattern(dayPattern) {
        return new RegExp(
            '(?:^|\\s)(?:next\\s+)?(' + dayPattern + ')(?:\\s|$)',
            'i'
        );
    }

    // ======================================
    // DOM ready
    // ======================================

    document.addEventListener('DOMContentLoaded', function () {
        voiceBtn = document.getElementById('voiceReminderBtn');
        voiceStatus = document.getElementById('voiceStatus');

        var topbarVoiceBtn = document.getElementById('topbarVoiceBtn');
        if (topbarVoiceBtn) {
            topbarVoiceBtn.addEventListener('click', function () {
                if (typeof openReminderModal === 'function') {
                    openReminderModal();
                }
                setTimeout(function () {
                    if (voiceBtn && voiceSupported) {
                        toggleVoice();
                    }
                }, 300);
            });
        }

        if (!voiceBtn) return;

        if (!voiceSupported) {
            voiceBtn.style.display = 'none';
            showVoiceStatus('Voice input is not supported in this browser.', 'info');
            return;
        }

        voiceBtn.addEventListener('click', toggleVoice);

        // Setup confirmation overlay buttons
        setupConfirmationOverlay();
    });

    // ======================================
    // Voice control
    // ======================================

    function toggleVoice() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    function startListening() {
        if (isListening) return;

        var lang = getLanguage();

        recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = function () {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.setAttribute('aria-label', 'Listening\u2026 tap to stop');
            voiceBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            showVoiceStatus('Listening\u2026', 'listening');
        };

        recognition.onresult = function (event) {
            try {
                var result = event.results[0][0];
                var transcript = result.transcript.trim();
                var confidence = result.confidence;


                showVoiceStatus('Voice captured', 'success');

                lastRawTranscript = transcript;
                lastTranscriptConfidence = confidence;

                var savedLang = localStorage.getItem('taskflow_language');
                if (!savedLang || savedLang === 'auto') {
                    detectedLang = detectLanguageFromText(transcript);
                } else {
                    detectedLang = null;
                }

                lastParsedData = extractTaskData(transcript);


                showConfirmationOverlay(transcript, lastParsedData, confidence);

                detectedLang = null;
            } catch (e) {
                showVoiceStatus('Error processing speech: ' + e.message, 'error');
            }
        };

        recognition.onerror = function (event) {

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                showVoiceStatus('Microphone permission denied', 'error');
            } else if (event.error === 'no-speech') {
                showVoiceStatus('No speech detected. Please try again.', 'warning');
            } else {
                showVoiceStatus('Speech recognition error: ' + event.error, 'error');
            }
            resetListeningState();
        };

        recognition.onend = function () {

            resetListeningState();
        };

        try {

            recognition.start();
        } catch (e) {

            showVoiceStatus('Could not start speech recognition.', 'error');
            resetListeningState();
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
        }
    }

    function resetListeningState() {
        isListening = false;
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
            voiceBtn.setAttribute('aria-label', 'Voice Reminder \u2014 tap to speak');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    }

    function showVoiceStatus(message, type) {
        if (!voiceStatus) return;
        voiceStatus.textContent = message;
        voiceStatus.className = 'voice-status voice-status--' + (type || 'info');
        voiceStatus.style.display = 'block';
        if (type !== 'listening') {
            setTimeout(function () {
                voiceStatus.style.display = 'none';
            }, 4000);
        }
    }

    // ======================================
    // Confirmation Overlay
    // ======================================

    function setupConfirmationOverlay() {
        var overlay = document.getElementById('voiceConfirmOverlay');

        if (!overlay) return;

        var closeBtn = document.getElementById('voiceConfirmClose');
        var cancelBtn = document.getElementById('voiceConfirmCancel');
        var editBtn = document.getElementById('voiceConfirmEdit');
        var saveBtn = document.getElementById('voiceConfirmSave');

        if (closeBtn) closeBtn.addEventListener('click', hideConfirmationOverlay);
        if (cancelBtn) cancelBtn.addEventListener('click', hideConfirmationOverlay);

        if (editBtn) {
            editBtn.addEventListener('click', function () {
                // Fill the form with extracted data for manual editing
                fillFormFromParsedData(lastParsedData);
                hideConfirmationOverlay();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                // Fill the form AND auto-submit (save directly)
                fillFormFromParsedData(lastParsedData);

                // Close the confirmation overlay
                hideConfirmationOverlay();

                // Auto-submit the form
                var form = document.getElementById('reminderForm');
                if (form) {
                    // Small delay to ensure form fields are filled
                    setTimeout(function () {
                        var saveBtnEl = document.getElementById('saveBtn');
                        if (saveBtnEl) saveBtnEl.click();
                    }, 100);
                }
            });
        }

        // Click outside to close
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                hideConfirmationOverlay();
            }
        });
    }

    function showConfirmationOverlay(transcript, parsedData, confidence) {
        var overlay = document.getElementById('voiceConfirmOverlay');

        if (!overlay) {

            fillFormFromParsedData(parsedData);
            return;
        }

        // Check confidence - if too low, show warning
        var lowConfDiv = document.getElementById('voiceConfirmLowConfidence');
        if (lowConfDiv) {
            if (confidence !== undefined && confidence < 0.5) {
                lowConfDiv.style.display = 'block';
                // Hide save button, only show edit
                var saveBtnEl = document.getElementById('voiceConfirmSave');
                if (saveBtnEl) saveBtnEl.style.display = 'none';
            } else {
                lowConfDiv.style.display = 'none';
                var saveBtnEl2 = document.getElementById('voiceConfirmSave');
                if (saveBtnEl2) saveBtnEl2.style.display = '';
            }
        }

        // Fill in the confirmation details
        var heardEl = document.getElementById('voiceConfirmHeard');
        var taskEl = document.getElementById('voiceConfirmTask');
        var dateEl = document.getElementById('voiceConfirmDate');
        var timeEl = document.getElementById('voiceConfirmTime');

        if (heardEl) heardEl.textContent = transcript;
        if (taskEl) taskEl.textContent = parsedData.taskName || transcript;
        if (dateEl) dateEl.textContent = parsedData.date || 'Not specified';
        if (timeEl) timeEl.textContent = parsedData.time || 'Not specified';

        // Show the overlay
        overlay.classList.add('active');
    }

    function hideConfirmationOverlay() {
        var overlay = document.getElementById('voiceConfirmOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        lastParsedData = null;
        lastRawTranscript = null;
        lastTranscriptConfidence = null;
    }

    function fillFormFromParsedData(parsedData) {
        if (!parsedData) return;

        // Fill Task Name
        var taskInput = document.getElementById('taskName');
        if (taskInput) taskInput.value = parsedData.taskName;

        // Fill Date
        if (parsedData.date) {
            var dateInput = document.getElementById('taskDate');
            if (dateInput) dateInput.value = parsedData.date;
        }

        // Fill Time
        if (parsedData.time) {
            var timeInput = document.getElementById('taskTime');
            if (timeInput) timeInput.value = parsedData.time;
        }

        // Fill Repeat
        var repeatSelect = document.getElementById('repeatOption');
        if (repeatSelect && parsedData.repeat && parsedData.repeat !== 'none') {
            repeatSelect.value = parsedData.repeat;
        }

        // Fill Category
        if (parsedData.category) {
            var categoryInput = document.getElementById('category');
            if (categoryInput) categoryInput.value = parsedData.category;
        }

        // Open form for review (in case user wants to check before saving)
        var modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay && !modalOverlay.classList.contains('active')) {
            modalOverlay.classList.add('active');
        }
    }

    // ======================================
    // STAGE 3: Extract task data from transcript
    // This is the core parsing stage.
    // Preserves original language in task name.
    // ======================================

    function extractTaskData(text) {
        var result = {
            taskName: text,
            date: null,
            time: null,
            repeat: 'none',
            category: null
        };

        // Auto-detect language from the transcript
        var savedLang = localStorage.getItem('taskflow_language');
        if (!savedLang || savedLang === 'auto') {
            detectedLang = detectLanguageFromText(text);
        }

        // Also try parsing with ALL languages to handle mixed speech
        // (e.g., Telugu + English, Hindi + English)
        var allLangKeys = Object.keys(LANG_DATA);
        var originalDetectedLang = detectedLang;

        var cleaned = removeFillerPhrases(text);

        // 1. Extract repeat pattern (try detected language first, then all)
        var repeatResult = parseRepeat(cleaned);
        if (repeatResult.repeat === 'none') {
            // Try all languages for repeat patterns
            for (var rl = 0; rl < allLangKeys.length; rl++) {
                detectedLang = allLangKeys[rl];
                var altRepeatResult = parseRepeat(cleaned);
                if (altRepeatResult.repeat !== 'none') {
                    repeatResult = altRepeatResult;
                    break;
                }
            }
        }
        result.repeat = repeatResult.repeat;
        cleaned = repeatResult.cleaned;

        // 2. Parse date and time (try detected language first, then all)
        var parsed = parseDateAndTime(cleaned);
        if (!parsed.date && !parsed.time) {
            // Try all languages for date/time patterns
            for (var dtl = 0; dtl < allLangKeys.length; dtl++) {
                detectedLang = allLangKeys[dtl];
                var altParsed = parseDateAndTime(cleaned);
                if (altParsed.date || altParsed.time) {
                    parsed = altParsed;
                    break;
                }
            }
        }
        result.taskName = parsed.taskName;
        result.date = parsed.date;
        result.time = parsed.time;

        // 3. Auto-detect Category (try all languages)
        result.category = detectCategory(text);

        // Restore original detected language
        detectedLang = originalDetectedLang;

        return result;
    }

    // ======================================
    // Remove filler phrases (language-aware)
    // ======================================

    function removeFillerPhrases(text) {
        var langData = getLangData();
        var result = text;
        // Apply script-specific filler phrases
        for (var i = 0; i < langData.fillerPhrases.length; i++) {
            result = result.replace(langData.fillerPhrases[i], '');
        }
        // Apply Roman Telugu/Hindi filler phrases
        if (langData.romanFillerPhrases) {
            for (var j = 0; j < langData.romanFillerPhrases.length; j++) {
                result = result.replace(langData.romanFillerPhrases[j], '');
            }
        }
        return result.trim();
    }

    // ======================================
    // Parse Repeat pattern (language-aware)
    // ======================================

    function parseRepeat(text) {
        var langData = getLangData();
        var lower = text.toLowerCase();

        // First try language-specific repeat patterns
        for (var i = 0; i < langData.repeatPatterns.length; i++) {
            var rp = langData.repeatPatterns[i];
            if (rp.pattern.test(lower)) {
                return {
                    repeat: rp.repeat,
                    cleaned: text.replace(rp.pattern, '').trim()
                };
            }
        }

        // Fallback: English repeat patterns (\b works for Latin)
        var engRepeats = [
            { pattern: /\b(every\s+day|daily|each\s+day)\b/i, repeat: 'daily' },
            { pattern: /\b(every\s+week|weekly|each\s+week)\b/i, repeat: 'weekly' },
            { pattern: /\b(every\s+month|monthly|each\s+month)\b/i, repeat: 'monthly' },
            { pattern: /\b(every\s+year|yearly|annually|each\s+year)\b/i, repeat: 'yearly' }
        ];
        for (var j = 0; j < engRepeats.length; j++) {
            if (engRepeats[j].pattern.test(lower)) {
                return {
                    repeat: engRepeats[j].repeat,
                    cleaned: text.replace(engRepeats[j].pattern, '').trim()
                };
            }
        }

        return { repeat: 'none', cleaned: text };
    }

    // ======================================
    // Auto-detect Category (language-aware)
    // ======================================

    function detectCategory(text) {
        var langData = getLangData();
        var lower = text.toLowerCase();
        // Check script-specific keywords
        for (var i = 0; i < langData.categories.length; i++) {
            var rule = langData.categories[i];
            for (var j = 0; j < rule.keywords.length; j++) {
                if (lower.indexOf(rule.keywords[j]) !== -1) {
                    return rule.category;
                }
            }
        }
        // Check Roman Telugu/Hindi category keywords
        if (langData.romanCategoryKeywords) {
            var romanCats = Object.keys(langData.romanCategoryKeywords);
            for (var k = 0; k < romanCats.length; k++) {
                var catName = romanCats[k];
                var keywords = langData.romanCategoryKeywords[catName];
                for (var m = 0; m < keywords.length; m++) {
                    if (lower.indexOf(keywords[m]) !== -1) {
                        return catName;
                    }
                }
            }
        }
        // Also check English keywords (fallback for mixed language)
        var enData = LANG_DATA['en-US'];
        for (var p = 0; p < enData.categories.length; p++) {
            var enRule = enData.categories[p];
            for (var q = 0; q < enRule.keywords.length; q++) {
                if (lower.indexOf(enRule.keywords[q]) !== -1) {
                    return enRule.category;
                }
            }
        }
        return null;
    }

    // ======================================
    // Parse Month + Day (language-aware)
    // ======================================

    function parseMonthDay(text) {
        var langData = getLangData();
        var months = langData.months;
        var now = new Date();
        var year = now.getFullYear();

        var monthKeys = Object.keys(months);
        var monthPattern = buildWordBoundaryPattern(monthKeys);

        // Pattern 1: "Month Day" e.g. "జనవరి 5" or "January 2nd"
        var p1 = makeMonthDayPattern1(monthPattern);
        var match1 = text.match(p1);
        if (match1) {
            var monthName = match1[1].toLowerCase();
            var day = parseInt(match1[2], 10);
            var monthIdx = months[monthName];
            if (monthIdx !== undefined && day >= 1 && day <= 31) {
                var target = new Date(year, monthIdx, day);
                if (target < now) target = new Date(year + 1, monthIdx, day);
                return { date: formatDateISO(target), remaining: text.replace(match1[0], ' ').trim() };
            }
        }

        // Pattern 2: "Day Month" e.g. "5 జనవరి" or "2nd December"
        var p2 = makeMonthDayPattern2(monthPattern);
        var match2 = text.match(p2);
        if (match2) {
            var day2 = parseInt(match2[1], 10);
            var monthIdx2 = months[match2[2].toLowerCase()];
            if (monthIdx2 !== undefined && day2 >= 1 && day2 <= 31) {
                var target2 = new Date(year, monthIdx2, day2);
                if (target2 < now) target2 = new Date(year + 1, monthIdx2, day2);
                return { date: formatDateISO(target2), remaining: text.replace(match2[0], ' ').trim() };
            }
        }

        return null;
    }

    // ======================================
    // Parse Date + Time from cleaned text
    // ======================================

    function parseDateAndTime(text) {
        var result = { taskName: text, date: null, time: null };
        var now = new Date();
        var langData = getLangData();

        // --- Parse Date ---

        // 1. Check language-specific relative dates (e.g. రేపు=tomorrow, कल=tomorrow)
        if (langData.relativeDates) {
            var relKeys = Object.keys(langData.relativeDates);
            for (var ri = 0; ri < relKeys.length; ri++) {
                var relWord = relKeys[ri];
                var offset = langData.relativeDates[relWord];
                var relRegex = makeSafeWordRegex(relWord);
                if (relRegex.test(text)) {
                    var relDate = new Date(now);
                    relDate.setDate(relDate.getDate() + offset);
                    result.date = formatDateISO(relDate);
                    text = text.replace(relRegex, ' ').trim();
                    break;
                }
            }
        }

        // 1b. Check Roman Telugu/Hindi relative dates
        if (!result.date && langData.romanRelativeDates) {
            var romanRelKeys = Object.keys(langData.romanRelativeDates);
            for (var rri = 0; rri < romanRelKeys.length; rri++) {
                var romanRelWord = romanRelKeys[rri];
                var romanOffset = langData.romanRelativeDates[romanRelWord];
                var romanRelRegex = makeSafeWordRegex(romanRelWord);
                if (romanRelRegex.test(text)) {
                    var romanRelDate = new Date(now);
                    romanRelDate.setDate(romanRelDate.getDate() + romanOffset);
                    result.date = formatDateISO(romanRelDate);
                    text = text.replace(romanRelRegex, ' ').trim();
                    break;
                }
            }
        }

        // 2. English relative days (also check all languages)
        if (!result.date) {
            // Check all languages for relative dates
            var allLangKeys = Object.keys(LANG_DATA);
            for (var al = 0; al < allLangKeys.length; al++) {
                var allRelDates = LANG_DATA[allLangKeys[al]].relativeDates;
                if (allRelDates) {
                    var allRelKeys = Object.keys(allRelDates);
                    for (var ari = 0; ari < allRelKeys.length; ari++) {
                        var aWord = allRelKeys[ari];
                        var aOffset = allRelDates[aWord];
                        var aRegex = makeSafeWordRegex(aWord);
                        if (aRegex.test(text)) {
                            var aDate = new Date(now);
                            aDate.setDate(aDate.getDate() + aOffset);
                            result.date = formatDateISO(aDate);
                            text = text.replace(aRegex, ' ').trim();
                            break;
                        }
                    }
                    if (result.date) break;
                }
            }
            // Also check Roman relative dates from all languages
            if (!result.date) {
                for (var al2 = 0; al2 < allLangKeys.length; al2++) {
                    var allRomanRel = LANG_DATA[allLangKeys[al2]].romanRelativeDates;
                    if (allRomanRel) {
                        var allRomanKeys = Object.keys(allRomanRel);
                        for (var arri = 0; arri < allRomanKeys.length; arri++) {
                            var arWord = allRomanKeys[arri];
                            var arOffset = allRomanRel[arWord];
                            var arRegex = makeSafeWordRegex(arWord);
                            if (arRegex.test(text)) {
                                var arDate = new Date(now);
                                arDate.setDate(arDate.getDate() + arOffset);
                                result.date = formatDateISO(arDate);
                                text = text.replace(arRegex, ' ').trim();
                                break;
                            }
                        }
                        if (result.date) break;
                    }
                }
            }
            // Check day of week names in all languages
            if (!result.date) {
                for (var dl = 0; dl < allLangKeys.length; dl++) {
                    var dayNames = LANG_DATA[allLangKeys[dl]].dayNames;
                    if (dayNames) {
                        for (var di = 0; di < dayNames.length; di++) {
                            var dayRegex2 = makeSafeWordRegex(dayNames[di]);
                            if (dayRegex2.test(text)) {
                                var currentDay = now.getDay();
                                var diff = di - currentDay;
                                if (diff <= 0) diff += 7;
                                var targetDate = new Date(now);
                                targetDate.setDate(targetDate.getDate() + diff);
                                result.date = formatDateISO(targetDate);
                                text = text.replace(dayRegex2, ' ').trim();
                                break;
                            }
                        }
                        if (result.date) break;
                    }
                }
            }
        }

        // 3. Day of week (language-aware)
        if (!result.date) {
            var dayPattern = buildWordBoundaryPattern(langData.dayNames);
            var dayRegex = makeDayOfWeekPattern(dayPattern);
            var dayMatch = text.match(dayRegex);
            if (dayMatch) {
                var dayName = dayMatch[1].toLowerCase();
                var targetDay = langData.dayNames.indexOf(dayName);
                if (targetDay !== -1) {
                    var currentDay = now.getDay();
                    var diff = targetDay - currentDay;
                    if (diff <= 0) diff += 7;
                    var targetDate = new Date(now);
                    targetDate.setDate(targetDate.getDate() + diff);
                    result.date = formatDateISO(targetDate);
                    text = text.replace(dayMatch[0], ' ').trim();
                }
            }
        }

        // 4. Month + Day (language-aware)
        if (!result.date) {
            var monthDayResult = parseMonthDay(text);
            if (monthDayResult) {
                result.date = monthDayResult.date;
                text = monthDayResult.remaining;
            }
        }

        // --- Parse Time ---
        var timeResult = parseTime(text);
        if (timeResult.time) {
            result.time = timeResult.time;
            text = timeResult.remaining;
        }

        // --- Clean up time-of-day words from remaining text ---
        var allTimeOfDayClean = {};
        var langKeys = Object.keys(LANG_DATA);
        for (var li = 0; li < langKeys.length; li++) {
            var td = LANG_DATA[langKeys[li]].timeOfDayWords;
            if (td) {
                var tdKeys = Object.keys(td);
                for (var tdi = 0; tdi < tdKeys.length; tdi++) {
                    allTimeOfDayClean[tdKeys[tdi]] = true;
                }
            }
        }
        // Also clean clock words
        for (var li2 = 0; li2 < langKeys.length; li2++) {
            var cw = LANG_DATA[langKeys[li2]].clockWord;
            if (cw) allTimeOfDayClean[cw] = true;
        }
        var todCleanWords = Object.keys(allTimeOfDayClean);
        for (var tc = 0; tc < todCleanWords.length; tc++) {
            text = text.replace(makeSafeWordRegex(todCleanWords[tc]), ' ');
        }
        // Clean trailing/inleading prepositions and commas
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/,\s*$/, '');

        // Remove prepositions that directly follow time patterns (e.g. "7:30 ki" -> "7:30")
        // But keep prepositions that are part of the task meaning (e.g. "Amma ki call" -> keep)
        // Only remove if preceded by a digit/time pattern
        text = text.replace(/(\d{1,2}:\d{2})\s+(ki|ko|pe|par|me|lo)\b/gi, '$1');
        text = text.replace(/(\d{1,2})\s+(baj(?:e|ega|kar))\s+(ki|ko|pe|par|me|lo)\b/gi, '$1 $2');
        text = text.replace(/\s+/g, ' ').trim();

        if (text.length > 0) {
            result.taskName = text;
        } else {
            result.taskName = removeFillerPhrases(text) || text;
        }

        return result;
    }

    // ======================================
    // Time Parsing (language-aware)
    // ======================================

    function parseTime(text) {
        var langData = getLangData();
        var time = null;
        var remaining = text;

        // Check language-specific time words first (standalone: noon, midnight, etc.)
        var timeWordKeys = langData.timeWords ? Object.keys(langData.timeWords) : [];
        for (var tw = 0; tw < timeWordKeys.length; tw++) {
            var word = timeWordKeys[tw];
            if (text.toLowerCase().indexOf(word) !== -1) {
                time = langData.timeWords[word];
                remaining = text.replace(new RegExp(buildWordBoundaryPattern([word]), 'gi'), ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Collect all time-of-day words from ALL languages
        var allTimeOfDay = {};
        var langKeys = Object.keys(LANG_DATA);
        for (var li = 0; li < langKeys.length; li++) {
            var todWords = LANG_DATA[langKeys[li]].timeOfDayWords;
            if (todWords) {
                var todKeys = Object.keys(todWords);
                for (var ti = 0; ti < todKeys.length; ti++) {
                    allTimeOfDay[todKeys[ti]] = todWords[todKeys[ti]];
                }
            }
        }

        // Telugu clock pattern: "9 గంటలకు" or "9:30 గంటలకు"
        var clockWord = langData.clockWord || null;
        // Also try Roman clock words (e.g. "7 gantaku", "7 baje")
        var romanClockWords = langData.romanClockWords || [];
        if (clockWord || romanClockWords.length > 0) {
            // Try Roman clock words first (they're more common in mixed language)
            for (var rcw = 0; rcw < romanClockWords.length; rcw++) {
                var rcWord = romanClockWords[rcw];
                var rcEscaped = rcWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                // "7:30 gantaku" or "7 gantaku"
                var rcRegex = new RegExp('(\\d{1,2})(?::(\\d{2}))?\\s+' + rcEscaped + '(?:\\s|$)', 'i');
                var mRC = text.match(rcRegex);
                if (mRC) {
                    var rcH = parseInt(mRC[1], 10);
                    var rcMin = mRC[2] ? parseInt(mRC[2], 10) : 0;
                    // Check for time-of-day in context
                    var rcCtxLow = text.toLowerCase();
                    var rcAmpm = null;
                    var rcTodKeys = Object.keys(allTimeOfDay);
                    for (var rctd = 0; rctd < rcTodKeys.length; rctd++) {
                        if (rcCtxLow.indexOf(rcTodKeys[rctd]) !== -1) {
                            rcAmpm = allTimeOfDay[rcTodKeys[rctd]];
                            break;
                        }
                    }
                    if (rcAmpm === 'am' && rcH >= 1 && rcH <= 11) { /* keep */ }
                    else if (rcAmpm === 'pm' && rcH >= 1 && rcH <= 11) rcH += 12;
                    else if (rcAmpm === 'night' && rcH >= 1 && rcH <= 11) rcH += 12;
                    else if (!rcAmpm && rcH >= 1 && rcH <= 6) rcH += 12;
                    if (rcH >= 0 && rcH <= 23 && rcMin >= 0 && rcMin <= 59) {
                        time = padZero(rcH) + ':' + padZero(rcMin);
                        remaining = text.replace(mRC[0], ' ').trim();
                        return { time: time, remaining: remaining };
                    }
                }
            }
        }

        // Script-specific clock pattern (Telugu: "9 గంటలకు", Hindi: "9 बजे")
        if (clockWord) {
            // "9:30 గంటలకు ఉదయం" or "9 గంటలకు ఉదయం"
            var clockRe = buildWordBoundaryPattern([clockWord]);
            var allTodRe = '(?:' + buildWordBoundaryPattern(Object.keys(allTimeOfDay)) + ')';
            var mClockTod = text.match(
                new RegExp('(\\d{1,2}):(\\d{2})\\s+' + clockRe + '(?:\\s+' + allTodRe + ')?', 'i')
            );
            if (mClockTod) {
                var h = parseInt(mClockTod[1], 10);
                var min = parseInt(mClockTod[2], 10);
                var matchText = mClockTod[0].toLowerCase();
                var ampmVal = null;
                var todEntries = Object.keys(allTimeOfDay);
                for (var td = 0; td < todEntries.length; td++) {
                    if (matchText.indexOf(todEntries[td]) !== -1) {
                        ampmVal = allTimeOfDay[todEntries[td]];
                        break;
                    }
                }
                if (ampmVal === 'am' && h >= 1 && h <= 11) { /* AM, keep as-is */ }
                else if (ampmVal === 'pm' && h >= 1 && h <= 11) h += 12;
                else if (ampmVal === 'night' && h >= 1 && h <= 11) h += 12;
                else if (!ampmVal && h >= 1 && h <= 6) h += 12;
                if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
                    time = padZero(h) + ':' + padZero(min);
                    remaining = text.replace(mClockTod[0], ' ').trim();
                    return { time: time, remaining: remaining };
                }
            }

            // "9 గంటలకు" (no time-of-day) - use indexOf for reliability
            var clockEscaped = clockWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var allTodEscaped = buildWordBoundaryPattern(Object.keys(allTimeOfDay));
            // Match: <number> <clockWord> [optional <todWord>]
            var clockFullRegex = new RegExp('(\\d{1,2})\\s+' + clockEscaped + '(?:\\s+(?:' + allTodEscaped + '))?', 'i');
            var mClockFull = text.match(clockFullRegex);
            if (mClockFull) {
                var h2 = parseInt(mClockFull[1], 10);
                // Check for time-of-day in the matched text
                var clockMatchText = mClockFull[0].toLowerCase();
                var ampmClock = null;
                var clockTodKeys = Object.keys(allTimeOfDay);
                for (var ctk = 0; ctk < clockTodKeys.length; ctk++) {
                    if (clockMatchText.indexOf(clockTodKeys[ctk]) !== -1) {
                        ampmClock = allTimeOfDay[clockTodKeys[ctk]];
                        break;
                    }
                }
                if (ampmClock === 'am' && h2 >= 1 && h2 <= 11) { /* keep */ }
                else if (ampmClock === 'pm' && h2 >= 1 && h2 <= 11) h2 += 12;
                else if (ampmClock === 'night' && h2 >= 1 && h2 <= 11) h2 += 12;
                else if (!ampmClock && h2 >= 1 && h2 <= 6) h2 += 12;
                if (h2 >= 0 && h2 <= 23) {
                    time = padZero(h2) + ':00';
                    remaining = text.replace(clockFullRegex, ' ').trim();
                    return { time: time, remaining: remaining };
                }
            }
        }

        // Number + time-of-day word (all languages): "9 ఉదయం", "9 सुबह", "3:30 సాయంత్రం"
        var todEntries = Object.keys(allTimeOfDay);
        for (var td2 = 0; td2 < todEntries.length; td2++) {
            var todWord = todEntries[td2];
            var todVal = allTimeOfDay[todWord];
            var todEsc = todWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // "9:30 <tod>" - use indexOf for reliability with Unicode
            var todIdx = text.toLowerCase().indexOf(todWord.toLowerCase());
            if (todIdx !== -1) {
                var beforeTod = text.substring(0, todIdx).trim();
                var hmMatch = beforeTod.match(/(\d{1,2}):(\d{2})\s*$/);
                if (hmMatch) {
                    var h3 = parseInt(hmMatch[1], 10);
                    var min3 = parseInt(hmMatch[2], 10);
                    if (todVal === 'am' && h3 >= 1 && h3 <= 11) { /* keep */ }
                    else if (todVal === 'pm' && h3 >= 1 && h3 <= 11) h3 += 12;
                    else if (todVal === 'night' && h3 >= 1 && h3 <= 11) h3 += 12;
                    else if (!todVal && h3 >= 1 && h3 <= 6) h3 += 12;
                    if (h3 >= 0 && h3 <= 23 && min3 >= 0 && min3 <= 59) {
                        time = padZero(h3) + ':' + padZero(min3);
                        // hmMatch.index is relative to beforeTod, which starts at position 0 in text
                        var removeStart = hmMatch.index;
                        var removeEnd = todIdx + todWord.length;
                        remaining = text.substring(0, removeStart) + text.substring(removeEnd);
                        remaining = remaining.replace(/\s+/g, ' ').trim();
                        return { time: time, remaining: remaining };
                    }
                }
                // "9 <tod>" (no colon)
                var numMatch = beforeTod.match(/(\d{1,2})\s*$/);
                if (numMatch) {
                    var h4 = parseInt(numMatch[1], 10);
                    if (todVal === 'am' && h4 >= 1 && h4 <= 11) { /* keep */ }
                    else if (todVal === 'pm' && h4 >= 1 && h4 <= 11) h4 += 12;
                    else if (todVal === 'night' && h4 >= 1 && h4 <= 11) h4 += 12;
                    else if (!todVal && h4 >= 1 && h4 <= 6) h4 += 12;
                    if (h4 >= 0 && h4 <= 23) {
                        time = padZero(h4) + ':00';
                        var removeStart2 = numMatch.index;
                        var removeEnd2 = todIdx + todWord.length;
                        remaining = text.substring(0, removeStart2) + text.substring(removeEnd2);
                        remaining = remaining.replace(/\s+/g, ' ').trim();
                        return { time: time, remaining: remaining };
                    }
                }
            }
            // "9 <tod>" via regex (works for Latin scripts)
            var mNumTod = text.match(
                new RegExp('(\\d{1,2})\\s+' + todEsc + '(?:\\s|$)', 'i')
            );
            if (mNumTod) {
                var h4 = parseInt(mNumTod[1], 10);
                var matchLow2 = mNumTod[0].toLowerCase();
                var ampm4 = null;
                var todKeys3 = Object.keys(allTimeOfDay);
                for (var td3 = 0; td3 < todKeys3.length; td3++) {
                    if (matchLow2.indexOf(todKeys3[td3]) !== -1) {
                        ampm4 = allTimeOfDay[todKeys3[td3]];
                        break;
                    }
                }
                if (ampm4 === 'am' && h4 >= 1 && h4 <= 11) { /* keep */ }
                else if (ampm4 === 'pm' && h4 >= 1 && h4 <= 11) h4 += 12;
                else if (ampm4 === 'night' && h4 >= 1 && h4 <= 11) h4 += 12;
                else if (!ampm4 && h4 >= 1 && h4 <= 6) h4 += 12;
                if (h4 >= 0 && h4 <= 23) {
                    time = padZero(h4) + ':00';
                    remaining = text.replace(mNumTod[0], ' ').trim();
                    return { time: time, remaining: remaining };
                }
            }
        } // close for loop

        // Pattern 1: HH:MM with optional AM/PM
        var m1 = text.match(
            /(?:^|\s)(\d{1,2}):(\d{2})(?:\s+(am|pm|a\.m\.|p\.m\.|morning|afternoon|evening|night))?\s*(?:$|\s)/i
        );
        if (m1) {
            var hour = parseInt(m1[1], 10);
            var minute = parseInt(m1[2], 10);
            var ampm = m1[3] ? m1[3].toLowerCase().replace(/\./g, '') : null;
            if (ampm === 'morning') ampm = 'am';
            else if (ampm === 'afternoon' || ampm === 'evening' || ampm === 'night') ampm = 'pm';
            if (ampm === 'pm' && hour >= 1 && hour <= 11) hour += 12;
            else if (ampm === 'am' && hour === 12) hour = 0;
            else if (!ampm && hour >= 1 && hour <= 6) hour += 12;
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                time = padZero(hour) + ':' + padZero(minute);
                remaining = text.replace(m1[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 2: "7pm", "7 pm"
        var m2 = text.match(/\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/i);
        if (m2) {
            var hour2 = parseInt(m2[1], 10);
            var ampm2 = m2[2].toLowerCase().replace(/\./g, '');
            if (ampm2 === 'pm' && hour2 >= 1 && hour2 <= 11) hour2 += 12;
            else if (ampm2 === 'am' && hour2 === 12) hour2 = 0;
            if (hour2 >= 0 && hour2 <= 23) {
                time = padZero(hour2) + ':00';
                remaining = text.replace(m2[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 2b: "7 baje" (Hindi for 7 o'clock)
        var m2b = text.match(/\b(\d{1,2})(?::(\d{2}))?\s+baj(?:e|ega|kar)\b/i);
        if (m2b) {
            var hour2b = parseInt(m2b[1], 10);
            var min2b = m2b[2] ? parseInt(m2b[2], 10) : 0;
            // Apply time-of-day from context
            var contextLower = text.toLowerCase();
            if (contextLower.indexOf('subah') !== -1 || contextLower.indexOf('morning') !== -1) {
                // AM - keep as is
            } else if (contextLower.indexOf('dopahar') !== -1 || contextLower.indexOf('shaam') !== -1 || contextLower.indexOf('afternoon') !== -1 || contextLower.indexOf('evening') !== -1) {
                if (hour2b >= 1 && hour2b <= 11) hour2b += 12;
            } else if (contextLower.indexOf('raat') !== -1 || contextLower.indexOf('night') !== -1) {
                if (hour2b >= 1 && hour2b <= 11) hour2b += 12;
            } else if (hour2b >= 1 && hour2b <= 6) {
                hour2b += 12; // assume PM for 1-6 without context
            }
            if (hour2b >= 0 && hour2b <= 23 && min2b >= 0 && min2b <= 59) {
                time = padZero(hour2b) + ':' + padZero(min2b);
                remaining = text.replace(m2b[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 2c: "3:30 ki" or "3:30 pe" (Telugu/Hindi time postposition)
        var m2c = text.match(/\b(\d{1,2}):(\d{2})\s+(?:ki|ko|pe|par|me|lo)\b/i);
        if (m2c) {
            var hour2c = parseInt(m2c[1], 10);
            var min2c = parseInt(m2c[2], 10);
            // Apply time-of-day from context
            var ctxLow = text.toLowerCase();
            if (ctxLow.indexOf('udayam') !== -1 || ctxLow.indexOf('subah') !== -1 || ctxLow.indexOf('morning') !== -1) {
                // AM
            } else if (ctxLow.indexOf('madhyanham') !== -1 || ctxLow.indexOf('sayantram') !== -1 || ctxLow.indexOf('dopahar') !== -1 || ctxLow.indexOf('shaam') !== -1 || ctxLow.indexOf('afternoon') !== -1 || ctxLow.indexOf('evening') !== -1) {
                if (hour2c >= 1 && hour2c <= 11) hour2c += 12;
            } else if (ctxLow.indexOf('rathri') !== -1 || ctxLow.indexOf('raat') !== -1 || ctxLow.indexOf('night') !== -1) {
                if (hour2c >= 1 && hour2c <= 11) hour2c += 12;
            } else if (hour2c >= 1 && hour2c <= 6) {
                hour2c += 12;
            }
            if (hour2c >= 0 && hour2c <= 23 && min2c >= 0 && min2c <= 59) {
                time = padZero(hour2c) + ':' + padZero(min2c);
                remaining = text.replace(m2c[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 3: "7 in the evening" (English)
        var m3 = text.match(/\b(\d{1,2})\s+in\s+the\s+(morning|afternoon|evening|night)\b/i);
        if (m3) {
            var hour3 = parseInt(m3[1], 10);
            var tod3 = m3[2].toLowerCase();
            if (tod3 === 'morning') { if (hour3 === 12) hour3 = 0; }
            else if (tod3 === 'afternoon') { if (hour3 >= 1 && hour3 <= 11) hour3 += 12; }
            else if (tod3 === 'evening' || tod3 === 'night') { if (hour3 >= 1 && hour3 <= 11) hour3 += 12; }
            if (hour3 >= 0 && hour3 <= 23) {
                time = padZero(hour3) + ':00';
                remaining = text.replace(m3[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 4: noon
        if (/\bnoon\b/i.test(text)) {
            return { time: '12:00', remaining: text.replace(/\bnoon\b/gi, ' ').trim() };
        }

        // Pattern 5: midnight
        if (/\bmidnight\b/i.test(text)) {
            return { time: '00:00', remaining: text.replace(/\bmidnight\b/gi, ' ').trim() };
        }

        return { time: null, remaining: text };
    }

    function padZero(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function formatDateISO(date) {
        var y = date.getFullYear();
        var m = padZero(date.getMonth() + 1);
        var d = padZero(date.getDate());
        return y + '-' + m + '-' + d;
    }

})();
