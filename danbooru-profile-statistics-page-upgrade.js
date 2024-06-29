// ==UserScript==
// @name         danbooru-profile-statistics-page-upgrade
// @version      1.0
// @description  Display daily statistics on the user profile page
// @author       redtails
// @source       https://danbooru.donmai.us/users/200729
// @match        https://*.donmai.us/users/*
// @match        https://donmai.moe/users/*
// @match        https://*.donmai.us/profile
// @match        https://donmai.moe/profile
// @exclude      /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @exclude      /^https?://\w+\.donmai\.moe/.*\.(xml|json|atom)(\?|$)/
// @grant        none
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/red-tails/danbooru-userscripts/master/danbooru-profile-statistics-page-upgrade.js
// @updateURL    https://raw.githubusercontent.com/red-tails/danbooru-userscripts/master/danbooru-profile-statistics-page-upgrade.js
// ==/UserScript==

function getElem(re) {
    return [...document.querySelectorAll("table.user-statistics th")].filter(th => th.innerText.match(re))[0].nextElementSibling;
}

const uploads = getElem(/^Uploads/),
      deleted = getElem(/^Deleted Uploads/),
      rate = deleted.querySelector("a").innerText/uploads.querySelector("a").innerText*100;

deleted.append(`(${+rate.toFixed(2)}% of all uploads)`);

{
    const changes = getElem(/^Post Changes/), rate2 = uploads.querySelector("a").innerText/changes.querySelector("a").innerText*100;
    uploads.querySelector("a").insertAdjacentText("afterend", ` (${+rate2.toFixed(2)}% of post changes)`);
}

// Function to perform an asynchronous fetch request and extract the count
async function fetchCount(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data.counts.posts;
}

// Function to calculate daily stats
function calculateDailyStats(statName) {
    const statElem = getElem(new RegExp(`^${statName}`));
    const statValue = parseInt(statElem.querySelector('a').innerText);
    const joinDate = new Date(getElem(/^Join Date/).innerText);
    const currentDate = new Date();
    const daysActive = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
    return (statValue / daysActive).toFixed(2);
}

// Function to add a new column with a header and calculated daily stats
function addDailyStatsColumn() {
    const table = document.querySelector('table.user-statistics');
    const rows = table.querySelectorAll('tr');

    // Add 'Daily Events' header
    const header = document.createElement('th');
    header.textContent = 'Daily Events';
    rows[0].appendChild(header);

    // Stat names corresponding to the rows in the table
    const statNames = ['Uploads',
                       'Deleted Uploads',
                       'Favorites',
                       'Votes',
                       'Favorite Groups',
                       'Post Changes',
                       'Note Changes',
                       'Wiki Page Changes',
                       'Artist Changes',
                       'Commentary Changes',
                       'Pool Changes',
                       'Forum Posts',
                       'Approvals',
                       'Comments',
                       'Appeals',
                       'Flags'];

    // Add calculated stats to the new column
    statNames.forEach((statName, index) => {
        if (rows[index + 5]) { // Adjust the index based on the table structure
            const dailyStat = calculateDailyStats(statName);
            const cell = document.createElement('td');
            cell.textContent = dailyStat;
            rows[index + 5].appendChild(cell);
        }
    });
}

// Add styles for left alignment, bold headers, and auto width table
const tableStyle = document.createElement('style');
tableStyle.textContent = `
    table.user-statistics {
        border-collapse: collapse;
        width: auto; /* Adjusted to auto to fit content */
        table-layout: auto; /* Adjusted to auto to fit content */
    }
    table.user-statistics th, table.user-statistics td {
        border: 1px solid black;
        text-align: left; /* Adjusted to left-align */
        padding: 4px; /* Added padding for better readability */
    }
    table.user-statistics th {
        font-weight: bold; /* Make header row bold */
    }
`;
document.head.appendChild(tableStyle);

// Rename existing columns
const fieldHeader = document.querySelector('table.user-statistics th');
fieldHeader.textContent = 'Field';
const valueHeader = fieldHeader.nextElementSibling;
valueHeader.textContent = 'Value';

// Add the new 'Daily Events' column and calculate stats
addDailyStatsColumn();

// Change the link text for uploads and favorites by targeting the correct elements
const uploadsLink = document.querySelector('#a-show > div.user-uploads.recent-posts a[href*="user%3A"]');
uploadsLink.textContent = `Uploads (${getElem(/^Uploads/).querySelector('a').innerText} total)`;

const favoritesLink = document.querySelector('#a-show > div.user-favorites.recent-posts a[href*="ordfav%3A"]');
const userName = document.querySelector('a.user[data-user-name]').dataset.userName;
favoritesLink.textContent = `Ordfav:${userName} (${getElem(/^Favorites/).querySelector('a').innerText} total)`;

// Add a new link line for favorites
const newFavoritesLink = document.createElement('a');
newFavoritesLink.href = `/posts?tags=fav%3A${userName}`;
newFavoritesLink.textContent = 'Favorites';
favoritesLink.parentNode.insertBefore(newFavoritesLink, favoritesLink.nextSibling);

// Add styles for the links to appear on separate lines
const linkStyle = document.createElement('style');
linkStyle.textContent = `
    #a-show > div.user-favorites.recent-posts > h2 > a {
        display: block; /* This will make each link appear on a new line */
    }
`;
document.head.appendChild(linkStyle);
