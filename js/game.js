// Removed imports

class Game {
    constructor() {
        this.ui = new UI();
        this.dealer = new Dealer();
        this.players = [
            { id: 0, name: 'You', balance: 1000, hand: [], isFolded: false, currentBet: 0, isAI: false, actedThisRound: false },
            new AIPlayer(1, 'Doyle', 1000, 'hard'),
            new AIPlayer(2, 'Stu', 1000, 'medium'),
            new AIPlayer(3, 'Phil', 1000, 'easy'),
            new AIPlayer(4, 'Daniel', 1000, 'medium')
        ];
        this.players.forEach(p => { if (p.isAI) p.actedThisRound = false; });
        this.currentPlayerIndex = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerIndex = 0;

        this.init();
    }

    init() {
        this.ui.initAIPlayers(this.players);
        this.setupEventListeners();
        this.startRound();
    }

    setupEventListeners() {
        document.getElementById('fold-btn').onclick = () => this.handleAction('fold');
        document.getElementById('check-btn').onclick = () => this.handleAction('call', 0);
        document.getElementById('call-btn').onclick = () => {
            const callAmount = this.dealer.currentBet - this.players[0].currentBet;
            this.handleAction('call', callAmount);
        };
        document.getElementById('raise-btn').onclick = () => {
            const amount = parseInt(document.getElementById('raise-amount').value);
            this.handleAction('raise', amount);
        };
        document.getElementById('reset-chips').onclick = () => {
            this.players.forEach(p => p.balance = 1000);
            this.startRound();
        };
        document.getElementById('restart-game').onclick = () => this.startRound();
    }

    async startRound() {
        this.dealer.startNewRound();
        this.players.forEach(p => {
            p.isFolded = false;
            p.currentBet = 0;
            p.actedThisRound = false;
        });

        this.ui.setDealerMessage("Dealer: Dealing cards...");
        this.dealer.dealHoleCards(this.players);

        // Blinds
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;
        this.postBet(this.players[sbIndex], this.smallBlind);
        this.postBet(this.players[bbIndex], this.bigBlind);
        this.dealer.currentBet = this.bigBlind;

        this.updateAllUI();
        this.currentPlayerIndex = (bbIndex + 1) % this.players.length;
        this.playTurn();
    }

    postBet(player, amount) {
        const actual = Math.min(player.balance, amount);
        player.balance -= actual;
        player.currentBet += actual;
        this.dealer.pot += actual;
    }

    async playTurn() {
        const player = this.players[this.currentPlayerIndex];

        if (player.isFolded || player.balance === 0) {
            this.nextTurn();
            return;
        }

        this.ui.showTurn(player.id);

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
        } else {
            const callAmount = this.dealer.currentBet - player.currentBet;
            this.ui.toggleControls(true, callAmount);
            this.ui.updateStatus(0, "Your turn");
        }
    }

    handleAction(action, amount = 0) {
        const player = this.players[0];
        this.processAction(player, action, amount);
        this.ui.toggleControls(false);
        this.nextTurn();
    }

    processAction(player, action, amount) {
        player.actedThisRound = true;
        if (action === 'fold') {
            player.isFolded = true;
            this.ui.updateStatus(player.id, "Folded");
        } else if (action === 'call') {
            this.postBet(player, amount);
            this.ui.updateStatus(player.id, amount === 0 ? "Check" : "Call");
        } else if (action === 'raise') {
            const totalBet = (this.dealer.currentBet - player.currentBet) + amount;
            this.postBet(player, totalBet);
            this.dealer.currentBet = player.currentBet;
            this.ui.updateStatus(player.id, `Raise to $${player.currentBet}`);
        }
        this.updateAllUI();
    }

    async nextTurn() {
        // Check if round ended
        const activePlayers = this.players.filter(p => !p.isFolded);
        if (activePlayers.length === 1) {
            this.endRound();
            return;
        }

        // Check if betting round is over (everyone matched current bet and acted)
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

        if (this.dealer.phase === 'pre-flop') {
            this.dealer.dealFlop();
            this.ui.setDealerMessage("Dealer: Flop is dealt");
        } else if (this.dealer.phase === 'flop') {
            this.dealer.dealTurn();
            this.ui.setDealerMessage("Dealer: Turn is dealt");
        } else if (this.dealer.phase === 'turn') {
            this.dealer.dealRiver();
            this.ui.setDealerMessage("Dealer: River is dealt");
        } else {
            this.endRound();
            return;
        }

        this.updateAllUI();
        this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
        this.playTurn();
    }

    async endRound() {
        const winners = this.dealer.evaluateWinners(this.players);
        const winAmount = Math.floor(this.dealer.pot / winners.length);

        winners.forEach(w => w.balance += winAmount);

        this.ui.setDealerMessage(`Dealer: ${winners.map(w => w.name).join(', ')} wins $${this.dealer.pot}!`);
        this.ui.showTurn(-1);
        this.updateAllUI();

        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

        setTimeout(() => {
            if (this.players[0].balance > 0) {
                this.startRound();
            } else {
                this.ui.setDealerMessage("Game Over! You're out of chips.");
            }
        }, 5000);
    }

    updateAllUI() {
        this.ui.updateTable({
            pot: this.dealer.pot,
            communityCards: this.dealer.communityCards
        });
        this.players.forEach(p => this.ui.updatePlayerUI(p, this.dealer.communityCards));
    }
}

new Game();
