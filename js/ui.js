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
        this.actionButtons = document.querySelectorAll('.action-btn');
    }

    renderCard(card, isHidden = false) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${isHidden ? 'hidden' : card.color}`;
        if (!isHidden) {
            cardEl.innerHTML = `
                <div class="card-rank">${card.rank}</div>
                <div class="card-suit">${card.suit}</div>
            `;
        }
        return cardEl;
    }

    updateTable(gameState) {
        this.potAmountEl.textContent = gameState.pot;
        this.communityCardsEl.innerHTML = '';
        gameState.communityCards.forEach(card => {
            this.communityCardsEl.appendChild(this.renderCard(card));
        });
    }

    updatePlayerUI(player, communityCards = []) {
        if (!player.isAI) {
            this.playerBalanceEl.textContent = player.balance;
            this.humanCardsEl.innerHTML = '';
            player.hand.forEach(card => {
                this.humanCardsEl.appendChild(this.renderCard(card));
            });

            if (player.hand.length === 2) {
                const combined = [...player.hand, ...communityCards];
                if (combined.length >= 5) {
                    const result = HandEvaluator.evaluate(combined);
                    this.handNameEl.textContent = HandEvaluator.getHandName(result);
                    this.handNameEl.style.display = 'inline-block';
                } else {
                    this.handNameEl.textContent = 'Pre-flop';
                }
            } else {
                this.handNameEl.style.display = 'none';
            }

            document.getElementById('human-player').classList.toggle('folded', player.isFolded);
        } else {
            const playerEl = document.getElementById(`player-${player.id}`);
            if (playerEl) {
                playerEl.querySelector('.player-balance').textContent = `$${player.balance}`;
                playerEl.classList.toggle('folded', player.isFolded);
                const cardsEl = playerEl.querySelector('.cards-hand');
                cardsEl.innerHTML = '';
                player.hand.forEach(() => {
                    cardsEl.appendChild(this.renderCard(null, true));
                });
            }
        }
    }

    initAIPlayers(players) {
        this.playersContainerEl.innerHTML = '';
        players.forEach((p, index) => {
            if (!p.isAI) return;
            const pEl = document.createElement('div');
            pEl.id = `player-${p.id}`;
            pEl.className = `player-box ai-pos-${index}`;
            pEl.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${p.name}</span>
                    <span class="player-balance">$${p.balance}</span>
                </div>
                <div class="cards-hand"></div>
                <div class="player-status">Waiting...</div>
            `;
            this.playersContainerEl.appendChild(pEl);
        });
    }

    setDealerMessage(msg) {
        this.dealerMessageEl.textContent = msg;
    }

    showTurn(playerId) {
        document.querySelectorAll('.player-box').forEach(el => el.classList.remove('active-turn'));
        if (playerId === 0) {
            document.getElementById('human-player').classList.add('active-turn');
        } else {
            document.getElementById(`player-${playerId}`)?.classList.add('active-turn');
        }
    }

    updateStatus(playerId, status) {
        const el = playerId === 0 ? document.getElementById('player-status') : document.querySelector(`#player-${playerId} .player-status`);
        if (el) el.textContent = status;
    }

    toggleControls(enabled, callAmount = 0) {
        this.actionButtons.forEach(btn => btn.disabled = !enabled);
        this.callValueEl.textContent = callAmount > 0 ? `($${callAmount})` : '';
    }
}
