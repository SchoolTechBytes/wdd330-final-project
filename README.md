# The Wandering Quill Tavern

A browser-based D&D 5th Edition character builder and party tracker built with vanilla HTML, CSS, and JavaScript. No account required, no install needed — just open and play.

## Features

- Build D&D 5e characters by selecting class, race, and ability scores
- Live character card preview as you fill in the form
- Save up to 6 characters to a persistent party roster
- Browse spells, monsters, and magic items from the reference browser
- All data stored locally in your browser (no server required)

## How to Run

No build step required. Open any HTML file directly in a browser:

1. Open `index.html` to start building a character
2. Open `party.html` to view your saved party roster
3. Open `reference.html` to browse spells, monsters, and magic items

## Project Structure

```
/
├── index.html          Character Builder (View 1)
├── party.html          Party Roster (View 2)
├── reference.html      Reference Browser (View 3)
├── css/
│   ├── main.css        Global styles and CSS custom properties
│   ├── character.css   Character Builder view styles
│   ├── party.css       Party Roster view styles
│   └── reference.css   Reference Browser + modal styles
├── js/
│   ├── main.js         Entry point and page initialization
│   ├── dnd-api.js      D&D 5e SRD API fetch functions
│   ├── open5e-api.js   Open5e API fetch functions
│   ├── character.js    Character class definition
│   ├── party.js        Party management (add/remove/persist)
│   ├── ui.js           DOM rendering and animation
│   ├── form.js         Form validation logic
│   └── storage.js      localStorage/sessionStorage abstraction
└── assets/             Icons and images
```

## External APIs

- **D&D 5e SRD API** — `https://www.dnd5eapi.co/api/2014`
  Classes, races, proficiencies, spells
- **Open5e API** — `https://api.open5e.com/v1`
  Monsters, magic items, spells

Both APIs are publicly available, require no authentication, and have CORS enabled for direct browser access.

## Course

WDD 330 — Web Frontend Development II | BYU | Spring 2026
