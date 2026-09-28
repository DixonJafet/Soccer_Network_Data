const gameSelect = document.getElementById('gameSelect');
const content = document.getElementById('content');
const timelineEvents = document.getElementById('timelineEvents');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const timeline = document.querySelector('.timeline');
const timelineLeft = document.getElementById('timelineLeft');
const timelineRight = document.getElementById('timelineRight');

const imageTeam1Label = document.getElementById('imageTeam1Label');
const imageTeam2Label = document.getElementById('imageTeam2Label');
const imageTeam1 = document.getElementById('imageTeam1');
const imageTeam2 = document.getElementById('imageTeam2');
const timelineContent = document.getElementById('timelineContent');

let currentData = null;
let currentSectionId = null;

// Base URL for GitHub raw content
const BASE_URL = 'https://raw.githubusercontent.com/DixonJafet/Soccer_Network_Data/main/';

timelineLeft.addEventListener('click', () => {
    timeline.scrollBy({ left: -timeline.clientWidth * 0.8, behavior: 'smooth' });
});

timelineRight.addEventListener('click', () => {
    timeline.scrollBy({ left: timeline.clientWidth * 0.8, behavior: 'smooth' });
});

timeline.addEventListener('scroll', updateTimelineNavigation);
window.addEventListener('resize', updateTimelineNavigation);

gameSelect.addEventListener('change', async (e) => {
    if (!e.target.value) {
        content.classList.add('content-hidden');
        timelineEvents.classList.add('content-hidden');
        errorMessage.style.display = 'none';
        return;
    }

    loadingMessage.style.display = 'block';
    content.classList.add('content-hidden');
    timelineEvents.classList.add('content-hidden');
    errorMessage.style.display = 'none';

    try {
        const response = await fetch(BASE_URL + e.target.value);
        if (!response.ok) throw new Error('Failed to load match data');
        
        currentData = await response.json();
        displayMatch(currentData);
        
        loadingMessage.style.display = 'none';
        content.classList.remove('content-hidden');
        timelineEvents.classList.remove('content-hidden');
        updateTimelineNavigation();
        
        // Load the first event by default
        if (currentData.events.length > 0) {
            loadSection(currentData.events[0].section_id);
        }
    } catch (error) {
        console.error('Error loading match:', error);
        loadingMessage.style.display = 'none';
        errorMessage.textContent = 'Error loading match data. Please try again.';
        errorMessage.style.display = 'block';
    }
});

function displayMatch(data) {

    imageTeam1Label.textContent = data.Team1;
    imageTeam2Label.textContent = data.Team2;

    timelineContent.innerHTML = '';

    // Get unique section IDs to avoid duplicate event rendering for same time
    const processedSections = new Set();
    const eventsBySection = {};

    // Group events by section_id
    data.events.forEach((event) => {
        if (!eventsBySection[event.section_id]) {
            eventsBySection[event.section_id] = [];
        }
        eventsBySection[event.section_id].push(event);
    });

    // Render timeline with grouped events
    Object.keys(eventsBySection).sort((a, b) => parseInt(a) - parseInt(b)).forEach((sectionId) => {
        const eventsInSection = eventsBySection[sectionId];
        const firstEvent = eventsInSection[0];
        const minute = firstEvent.minute;

        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-event';
        eventElement.onclick = () => loadSection(sectionId);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'event-time';
        timeDiv.textContent = `${minute}'`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'event-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'event-title';
        titleDiv.textContent = formatEventTitle(eventsInSection);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'event-details';
        
        const detailsHTML = eventsInSection
            .map(event => formatEventDetails(event))
            .join('<br>');
        
        detailsDiv.innerHTML = detailsHTML;

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(detailsDiv);
        eventElement.appendChild(timeDiv);
        eventElement.appendChild(contentDiv);

        timelineContent.appendChild(eventElement);
    });

    updateTimelineNavigation();
}

function updateTimelineNavigation() {
    const maxScroll = timeline.scrollWidth - timeline.clientWidth;
    timelineLeft.disabled = timeline.scrollLeft <= 0;
    timelineRight.disabled = timeline.scrollLeft >= maxScroll - 1;
}

function formatEventTitle(events) {
    const titles = events.map(e => e.title);
    const uniqueTitles = [...new Set(titles)];
    return uniqueTitles.join(' + ');
}

function formatEventDetails(event) {
    let details = '';

    if (event.team) {
        details += `<span class="event-team">${event.team}</span>`;
    }

    switch (event.title) {
        case 'Goal':
            details += `Goal by <span class="event-player">${event.player}</span>`;
            break;
        case 'Substitution':
            details += `<span class="event-player">${event.playerOff}</span> → <span class="event-player">${event.playerOn}</span>`;
            break;
        case 'SubstitutionOff':
            details += `${event.player} (Out)`;
            break;
        case 'SubstitutionOn':
            details += `${event.player} (In)`;
            break;
        default:
            details += event.title;
    }

    return details;
}

function loadSection(sectionId) {
    if (!currentData) return;

    currentSectionId = sectionId;

    // Find the first event in this section to get image URLs
    const event = currentData.events.find(e => e.section_id == sectionId);
    if (!event) return;

    // Load images
    if (event.imageTeam1Url) {
        imageTeam1.src = event.imageTeam1Url;
    } else {
        imageTeam1.src = '';
    }

    if (event.imageTeam2Url) {
        imageTeam2.src = event.imageTeam2Url;
    } else {
        imageTeam2.src = '';
    }

    // Highlight the clicked event
    document.querySelectorAll('.timeline-event').forEach(el => {
        el.style.opacity = '0.7';
    });
    
    // Find and highlight all events in this section
    document.querySelectorAll('.timeline-event').forEach(el => {
        const eventTime = el.querySelector('.event-time').textContent.replace("'", '');
        const matchingEvents = currentData.events.filter(e => e.section_id == sectionId);
        if (matchingEvents.some(e => e.minute == eventTime || matchingEvents[0].minute == parseInt(eventTime))) {
            el.style.opacity = '1';
        }
    });
}

// Initialize
loadingMessage.style.display = 'none';