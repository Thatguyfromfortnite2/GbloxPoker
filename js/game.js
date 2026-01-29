class Game {
    constructor() {
        this.ui = new UI();
        this.dealer = new Dealer();
        this.isMultiplayer = !!new URLSearchParams(window.location.search).get('table');
        this.players = [];
        this.currentPlayerIndex = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerIndex = 0;
        this.turnTimer = null;
        this.timePerTurn = 30;
        this.timeLeft = 30;

        window.pokerGame = this; // Global reference for multiplayer sync
        this.init();
    }

    async init() {
        if (!this.isMultiplayer) {
            this.players = [
                { id: 0, name: 'You', balance: 1000, hand: [], isFolded: false, currentBet: 0, isAI: false, actedThisRound: false },
                new AIPlayer(1, 'Doyle', 1000, 'hard'),
                new AIPlayer(2, 'Stu', 1000, 'medium'),
                new AIPlayer(3, 'Phil', 1000, 'easy'),
                new AIPlayer(4, 'Daniel', 1000, 'medium')
            ];
            this.ui.initAIPlayers(this.players);
            this.setupEventListeners();
            this.startRound();
        } else {
            this.setupEventListeners();
            // Multiplayer state will be initialized by the first 'value' event in MultiplayerManager
        }
    }

    setupEventListeners() {
        document.getElementById('fold-btn').onclick = () => this.handleAction('fold');
        document.getElementById('check-btn').onclick = () => this.handleAction('call', 0);
        document.getElementById('call-btn').onclick = () => {
            const callAmount = this.dealer.currentBet - this.players[this.currentPlayerIndex].currentBet;
            this.handleAction('call', callAmount);
        };
        document.getElementById('raise-btn').onclick = () => {
            const amount = parseInt(document.getElementById('raise-amount').value);
            this.handleAction('raise', amount);
        };
        document.getElementById('reset-chips').onclick = () => {
            if (this.isMultiplayer) return;
            this.players.forEach(p => p.balance = 1000);
            this.startRound();
        };
        document.getElementById('restart-game').onclick = () => {
            if (this.isMultiplayer) return;
            this.startRound();
        };
    }

    // BRIDGE: Sync local game state with remote Firebase data
    syncWithMultiplayer(data) {
        if (!data.gameState) return;

        console.log("Syncing state...", data.gameState);
        const state = data.gameState;

        // Update local players list from remote
        // Map Firebase players object to array
        const remotePlayers = Object.entries(data.players || {}).map(([name, p]) => ({
            name: name,
            ...p,
            isAI: p.isAI || false
        }));

        this.players = remotePlayers;
        this.dealer.pot = state.pot || 0;
        this.dealer.currentBet = state.currentBet || 0;
        this.dealer.communityCards = state.communityCards || [];
        this.dealer.phase = state.phase || 'pre-flop';
        this.currentPlayerIndex = state.currentPlayerIndex || 0;
        this.dealerIndex = state.dealerIndex || 0;

        this.updateAllUI();
        this.playTurn();
    }

    async startRound() {
        if (this.isMultiplayer) {
            // Only the "Admin" (first player) should trigger round starts to keep it simple
            // In a better version, we'd use a server or consensus
            if (this.players[0].name !== window.multiplayer.playerName) return;
        }

        this.dealer.startNewRound();
        this.players.forEach(p => {
            p.isFolded = false;
            p.currentBet = 0;
            p.actedThisRound = false;
            p.hand = []; // Clear hands, dealer will redistribute
        });

        this.ui.setDealerMessage("Dealer: Dealing cards...");
        this.dealer.dealHoleCards(this.players);

        // Blinds
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;
        this.postBet(this.players[sbIndex], this.smallBlind);
        this.postBet(this.players[bbIndex], this.bigBlind);
        this.dealer.currentBet = this.bigBlind;

        this.currentPlayerIndex = (bbIndex + 1) % this.players.length;

        if (this.isMultiplayer) {
            await this.pushRoomState();
        } else {
            this.updateAllUI();
            this.playTurn();
        }
    }

    async pushRoomState() {
        if (window.multiplayer) {
            await window.multiplayer.updateGameState({
                pot: this.dealer.pot,
                currentBet: this.dealer.currentBet,
                communityCards: this.dealer.communityCards,
                phase: this.dealer.phase,
                currentPlayerIndex: this.currentPlayerIndex,
                dealerIndex: this.dealerIndex
            });
            // Also need to push updated player balances/hands (privately)
            // For simplicity in this demo, we'll keep it simple
        }
    }

    postBet(player, amount) {
        const actual = Math.min(player.balance, amount);
        player.balance -= actual;
        player.currentBet += actual;
        this.dealer.pot += actual;
    }

    async playTurn() {
        const player = this.players[this.currentPlayerIndex];
        if (!player) return;

        if (player.isFolded || player.balance === 0) {
            this.nextTurn();
            return;
        }

        this.ui.showTurn(player.id || player.name);
        this.startTurnTimer();

        const isLocalPlayer = this.isMultiplayer ? (player.name === window.multiplayer.playerName) : (player.id === 0);

        if (player.isAI) {
            this.ui.toggleControls(false);
            const decision = await player.makeDecision({
                pot: this.dealer.pot,
                currentBet: this.dealer.currentBet,
                communityCards: this.dealer.communityCards,
                players: this.players
            });
            this.processAction(player, decision.action, decision.amount);
            this.nextTurn();
        } else if (isLocalPlayer) {
            const callAmount = this.dealer.currentBet - player.currentBet;
            this.ui.toggleControls(true, callAmount);
            this.ui.updateStatus(player.id || player.name, "Your turn");
        } else {
            this.ui.toggleControls(false);
            this.ui.updateStatus(player.id || player.name, "Thinking...");
        }
    }

    startTurnTimer() {
        this.clearTurnTimer();
        this.timeLeft = this.timePerTurn;
        this.ui.updateTimer(this.timeLeft);

        this.turnTimer = setInterval(() => {
            this.timeLeft--;
            this.ui.updateTimer(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    clearTurnTimer() {
        if (this.turnTimer) clearInterval(this.turnTimer);
    }

    handleTimeout() {
        this.clearTurnTimer();
        const player = this.players[this.currentPlayerIndex];
        const isLocalPlayer = this.isMultiplayer ? (player.name === window.multiplayer.playerName) : (player.id === 0);

        if (isLocalPlayer) {
            const callAmount = this.dealer.currentBet - player.currentBet;
            if (callAmount > 0) {
                this.handleAction('fold');
            } else {
                this.handleAction('call', 0); // Check
            }
        }
    }

    handleAction(action, amount = 0) {
        this.clearTurnTimer();
        const player = this.players[this.currentPlayerIndex];
        this.processAction(player, action, amount);
        this.ui.toggleControls(false);

        if (this.isMultiplayer) {
            this.pushRoomState();
        } else {
            this.nextTurn();
        }
    }

    processAction(player, action, amount) {
        player.actedThisRound = true;
        if (action === 'fold') {
            player.isFolded = true;
            this.ui.updateStatus(player.id || player.name, "Folded");
            if (window.gameAudio) window.gameAudio.playFoldSound();
        } else if (action === 'call') {
            this.postBet(player, amount);
            this.ui.updateStatus(player.id || player.name, amount === 0 ? "Check" : "Call");
            if (window.gameAudio) {
                amount === 0 ? window.gameAudio.playKnockSound() : window.gameAudio.playChipSound();
            }
        } else if (action === 'raise') {
            const totalBet = (this.dealer.currentBet - player.currentBet) + amount;
            this.postBet(player, totalBet);
            this.dealer.currentBet = player.currentBet;
            this.ui.updateStatus(player.id || player.name, `Raise to $${player.currentBet}`);
            if (window.gameAudio) window.gameAudio.playChipSound();
        }
        this.updateAllUI();
    }

    async nextTurn() {
        const activePlayers = this.players.filter(p => !p.isFolded);
        if (activePlayers.length === 1) {
            this.endRound();
            return;
        }

        const allActed = this.players.every(p => p.isFolded || (p.currentBet === this.dealer.currentBet && p.actedThisRound) || p.balance === 0);

        if (allActed) {
            this.nextPhase();
        } else {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.playTurn();
        }
    }

    async nextPhase() {
        this.players.forEach(p => {
            p.currentBet = 0;
            p.actedThisRound = false;
        });
        this.dealer.currentBet = 0;

        if (this.dealer.phase === 'pre-flop') this.dealer.dealFlop();
        else if (this.dealer.phase === 'flop') this.dealer.dealTurn();
        else if (this.dealer.phase === 'turn') this.dealer.dealRiver();
        else { this.endRound(); return; }

        this.updateAllUI();
        this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
        this.playTurn();
    }

    async endRound() {
        this.clearTurnTimer();
        const winners = this.dealer.evaluateWinners(this.players);
        const winAmount = Math.floor(this.dealer.pot / winners.length);
        winners.forEach(w => w.balance += winAmount);

        this.ui.setDealerMessage(`Dealer: ${winners.map(w => w.name).join(', ')} wins $${this.dealer.pot}!`);
        this.ui.showTurn(-1);
        this.updateAllUI();
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

        setTimeout(() => {
            if (this.players.some(p => !p.isAI && p.balance > 0)) this.startRound();
        }, 5000);
    }

    updateAllUI() {
        this.ui.updateTable({ pot: this.dealer.pot, communityCards: this.dealer.communityCards });
        this.players.forEach(p => this.ui.updatePlayerUI(p, this.dealer.communityCards));
    }
}

new Game();
