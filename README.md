# GBloxPoker 🃏

A complete, standalone Texas Hold'em poker game built with modern web technologies. Play against AI bots in a premium, dark-themed poker environment.

![GBloxPoker Screenshot Placeholder](/placeholder.png)

## Features

- **Texas Hold'em Rules**: Full implementation of blinds, betting rounds (Pre-flop, Flop, Turn, River), and hand evaluation.
- **AI Bots**: 4 AI opponents with varying difficulty levels (Easy, Medium, Hard).
- **Modern UI**: Sleek dark theme with glassmorphism effects, rounded cards, and smooth animations.
- **Responsive Design**: Optimized for desktop play.
- **Pure Javascript**: No backend, no database, no real money. Runs entirely in your browser.
- **Game Controls**: Fold, Check, Call, and Raise with a custom amount.
- **Dealer System**: Automatic dealer that manages the deck, pot, and game flow.

## Project Structure

```text
gbloxpoker/
├── index.html          # Main entry point
├── style.css           # Premium styling and animations
└── js/
    ├── game.js         # Main game engine / Orchestrator
    ├── dealer.js       # Game state and rules management
    ├── ai.js           # Bot decision-making logic
    ├── cards.js        # Card and Deck classes
    ├── handEvaluator.js # Poker hand scoring logic
    └── ui.js           # UI rendering and DOM management
```

## How to Run Locally

1. **Clone or Download**: Download the project folder.
2. **Open index.html**: Simply double-click `index.html` to open it in any modern web browser (Chrome, Firefox, Safari, Edge).
3. **No Setup Required**: No `npm install` or local servers needed. It's built with standard ES Modules.

## How to Play

1. You start with **$1000** in fake chips.
2. Follow the on-screen dealer messages to know the current game state.
3. Use the control panel at the bottom to make your moves.
4. The goal is to win the pot by having the best 5-card hand or making others fold.

## GitHub Upload Instructions

1. Initialize a new repository on GitHub named `gbloxpoker`.
2. Run the following commands in your local `gbloxpoker` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complete GBloxPoker game"
   git branch -M main
   git remote add origin https://github.com/Thatguyfromfortnite2/GbloxPoker.git
   git push -u origin main
   ```

---
