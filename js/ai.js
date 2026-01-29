// Removed import

class AIPlayer {
    constructor(id, name, balance, difficulty) {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.hand = [];
        this.isFolded = false;
        this.currentBet = 0;
        this.isAI = true;
        this.actedThisRound = false;
    }

    async makeDecision(gameState) {
        // Add a realistic delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const { pot, currentBet, communityCards, players } = gameState;
        const callAmount = currentBet - this.currentBet;

        // Evaluate current hand strength
        let handStrength = 0;
        if (communityCards.length > 0) {
            const evaluation = HandEvaluator.evaluate([...this.hand, ...communityCards]);
            handStrength = evaluation.rank;
        }

        switch (this.difficulty) {
            case 'easy':
                return this.makeEasyDecision(callAmount);
            case 'medium':
                return this.makeMediumDecision(callAmount, handStrength, pot);
            case 'hard':
                return this.makeHardDecision(callAmount, handStrength, pot, communityCards.length);
            default:
                return { action: 'call', amount: callAmount };
        }
    }

    makeEasyDecision(callAmount) {
        const rand = Math.random();
        if (rand < 0.1 && callAmount > 0) return { action: 'fold' };
        if (rand < 0.8) return { action: 'call', amount: callAmount };
        return { action: 'raise', amount: callAmount + 20 };
    }

    makeMediumDecision(callAmount, handStrength, pot) {
        const rand = Math.random();
        if (handStrength >= HAND_RANKS.PAIR) {
            if (rand < 0.2) return { action: 'raise', amount: callAmount + Math.floor(pot * 0.2) };
            return { action: 'call', amount: callAmount };
        }
        if (callAmount > this.balance * 0.3 && handStrength < HAND_RANKS.PAIR) return { action: 'fold' };
        if (rand < 0.6) return { action: 'call', amount: callAmount };
        return { action: 'fold' };
    }

    makeHardDecision(callAmount, handStrength, pot, stage) {
        const rand = Math.random();
        // Simple bluffing
        if (rand < 0.1) return { action: 'raise', amount: callAmount + Math.floor(pot * 0.5) };

        if (handStrength >= HAND_RANKS.THREE_OF_A_KIND) {
            return { action: 'raise', amount: callAmount + Math.floor(pot * 0.4) };
        }
        if (handStrength >= HAND_RANKS.PAIR) {
            if (callAmount > pot * 0.5 && rand < 0.4) return { action: 'fold' };
            return { action: 'call', amount: callAmount };
        }

        if (stage === 0) { // Pre-flop
            if (this.hand[0].value > 10 || this.hand[1].value > 10 || this.hand[0].value === this.hand[1].value) {
                return { action: 'call', amount: callAmount };
            }
        }

        if (callAmount === 0) return { action: 'call', amount: 0 };
        return { action: 'fold' };
    }
}
