class UI {
    constructor() {
        this.communityCardsEl = document.getElementById('community-cards');
        this.potAmountEl = document.getElementById('pot-amount');
        this.dealerMessageEl = document.getElementById('dealer-message');
        this.playersContainerEl = document.getElementById('players-container');
        this.humanCardsEl = document.getElementById('human-cards');
        this.handNameEl = document.getElementById('hand-name-display');
        this.playerBalanceEl = document.getElementById('player-balance');
        this.callValueEl = document.getElementById('call-value');
        this.timerEl = document.getElementById('turn-timer-display');
        this.actionButtons = document.querySelectorAll('.action-btn');
    }

    renderCard(card, isHidden = false) {
        if (window.gameAudio) window.gameAudio.playDealSound();
        const cardEl = document.createElement('div');
        cardEl.className = `card ${isHidden ? 'hidden' : (card.suit === '♥' || card.suit === '♦' ? 'red' : 'black')}`;

        if (!isHidden) {
            cardEl.innerHTML = `
                <div class="card-rank">${card.rank}</div>
                <div class="card-suit" style="font-size: 1.5rem">${card.suit}</div>
                <div class="card-rank card-rank-bottom" style="transform: rotate(180deg)">${card.rank}</div>
            `;
        }
        return cardEl;
    }

    updateTable(gameState) {
        this.potAmountEl.textContent = `$${gameState.pot.toLocaleString()}`;
        this.communityCardsEl.innerHTML = '';
        gameState.communityCards.forEach(card => {
            if (card) this.communityCardsEl.appendChild(this.renderCard(card));
        });
    }

    updatePlayerUI(player, communityCards = []) {
        // Find if this is the local human player
        const isLocalHuman = window.multiplayer ? (player.name === window.multiplayer.playerName) : (player.id === 0);

        if (isLocalHuman) {
            this.playerBalanceEl.textContent = player.balance.toLocaleString();
            this.humanCardsEl.innerHTML = '';
            if (player.hand) {
                player.hand.forEach(card => {
                    this.humanCardsEl.appendChild(this.renderCard(card));
                });
            }

            if (player.hand && player.hand.length === 2) {
                const combined = [...player.hand, ...communityCards];
                if (combined.length >= 5) {
                    const result = HandEvaluator.evaluate(combined);
                    this.handNameEl.textContent = HandEvaluator.getHandName(result);
                    this.handNameEl.style.display = 'inline-block';
                } else {
                    this.handNameEl.textContent = 'Pre-flop';
                    this.handNameEl.style.display = 'inline-block';
                }
            } else {
                this.handNameEl.style.display = 'none';
            }

            document.getElementById('human-player').classList.toggle('folded', player.isFolded);
        } else {
            // REMOTE or AI PLAYER
            let playerEl = document.getElementById(`player-${player.id || player.name}`);
            if (!playerEl) {
                // If it doesn't exist yet (e.g. joined late), create it
                this.createRemotePlayerBox(player);
                playerEl = document.getElementById(`player-${player.id || player.name}`);
            }

            if (playerEl) {
                playerEl.querySelector('.player-balance').textContent = `$${player.balance.toLocaleString()}`;
                playerEl.classList.toggle('folded', player.isFolded);
                const cardsEl = playerEl.querySelector('.cards-hand');
                cardsEl.innerHTML = '';
                if (player.hand) {
                    player.hand.forEach(() => {
                        cardsEl.appendChild(this.renderCard(null, true));
                    });
                }
            }
        }
    }

    createRemotePlayerBox(p) {
        const index = Array.from(this.playersContainerEl.children).length;
        const pEl = document.createElement('div');
        pEl.id = `player-${p.id || p.name}`;
        pEl.className = `player-box ai-pos-${index}`;
        pEl.innerHTML = `
            <div class="player-info">
                <span class="player-name">${p.name}</span>
                <span class="player-balance">$${p.balance.toLocaleString()}</span>
            </div>
            <div class="cards-hand"></div>
            <div class="player-status">Waiting...</div>
        `;
        this.playersContainerEl.appendChild(pEl);
    }

    initAIPlayers(players) {
        this.playersContainerEl.innerHTML = '';
        players.forEach((p, index) => {
            if (!p.isAI) return;
            this.createRemotePlayerBox(p);
        });
    }

    setDealerMessage(msg) {
        this.dealerMessageEl.textContent = msg;
    }

    updateTimer(seconds) {
        if (this.timerEl) {
            this.timerEl.textContent = seconds > 0 ? seconds : '';
        }
    }

    showTurn(playerId) {
        document.querySelectorAll('.player-box').forEach(el => el.classList.remove('active-turn'));
        const el = document.getElementById(`player-${playerId}`) || (playerId === 0 ? document.getElementById('human-player') : null);
        if (el) el.classList.add('active-turn');
    }

    updateStatus(playerId, status) {
        const id = (playerId === 0 || (window.multiplayer && playerId === window.multiplayer.playerName)) ? 'human-player' : `player-${playerId}`;
        const el = document.getElementById(id);
        const statusText = el ? (id === 'human-player' ? document.getElementById('player-status') : el.querySelector('.player-status')) : null;

        if (statusText) statusText.textContent = status;
        if (!el) return;

        // Trigger Animations
        el.classList.remove('anim-check', 'anim-raise', 'anim-fold');
        void el.offsetWidth;

        if (status.includes('Fold')) el.classList.add('anim-fold');
        else if (status === 'Check') el.classList.add('anim-check');
        else if (status.includes('Raise') || status.includes('Call')) el.classList.add('anim-raise');
    }

    toggleControls(enabled, callAmount = 0) {
        this.actionButtons.forEach(btn => btn.disabled = !enabled);
        this.callValueEl.textContent = callAmount > 0 ? `($${callAmount})` : '';
    }
}
