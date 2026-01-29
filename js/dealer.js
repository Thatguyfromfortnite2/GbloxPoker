// Removed imports

class Dealer {
    constructor() {
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.phase = 'pre-flop'; // 'pre-flop', 'flop', 'turn', 'river', 'showdown'
    }

    startNewRound() {
        this.deck.reset();
        this.deck.shuffle();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.phase = 'pre-flop';
    }

    dealHoleCards(players) {
        players.forEach(p => {
            p.hand = [this.deck.deal(), this.deck.deal()];
            p.isFolded = false;
            p.currentBet = 0;
        });
    }

    dealFlop() {
        this.communityCards.push(this.deck.deal(), this.deck.deal(), this.deck.deal());
        this.phase = 'flop';
    }

    dealTurn() {
        this.communityCards.push(this.deck.deal());
        this.phase = 'turn';
    }

    dealRiver() {
        this.communityCards.push(this.deck.deal());
        this.phase = 'river';
    }

    evaluateWinners(players) {
        const activePlayers = players.filter(p => !p.isFolded);
        if (activePlayers.length === 1) return [activePlayers[0]];

        const results = activePlayers.map(p => ({
            player: p,
            hand: HandEvaluator.evaluate([...p.hand, ...this.communityCards])
        }));

        results.sort((a, b) => HandEvaluator.compare(b.hand, a.hand));

        const winners = [results[0].player];
        for (let i = 1; i < results.length; i++) {
            if (HandEvaluator.compare(results[i].hand, results[0].hand) === 0) {
                winners.push(results[i].player);
            } else {
                break;
            }
        }
        return winners;
    }
}
