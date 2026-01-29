// Removed import

const HAND_RANKS = {
    ROYAL_FLUSH: 9,
    STRAIGHT_FLUSH: 8,
    FOUR_OF_A_KIND: 7,
    FULL_HOUSE: 6,
    FLUSH: 5,
    STRAIGHT: 4,
    THREE_OF_A_KIND: 3,
    TWO_PAIR: 2,
    PAIR: 1,
    HIGH_CARD: 0
};

const HAND_NAMES = {
    [HAND_RANKS.ROYAL_FLUSH]: 'Royal Flush',
    [HAND_RANKS.STRAIGHT_FLUSH]: 'Straight Flush',
    [HAND_RANKS.FOUR_OF_A_KIND]: 'Four of a Kind',
    [HAND_RANKS.FULL_HOUSE]: 'Full House',
    [HAND_RANKS.FLUSH]: 'Flush',
    [HAND_RANKS.STRAIGHT]: 'Straight',
    [HAND_RANKS.THREE_OF_A_KIND]: 'Three of a Kind',
    [HAND_RANKS.TWO_PAIR]: 'Two Pair',
    [HAND_RANKS.PAIR]: 'Pair',
    [HAND_RANKS.HIGH_CARD]: 'High Card'
};

class HandEvaluator {
    static evaluate(cards) {
        // cards is an array of 7 Card objects (2 hole + 5 community)
        // Find the best 5-card combination
        const combinations = this.getCombinations(cards, 5);
        let bestHand = null;

        for (const combo of combinations) {
            const result = this.evaluateFive(combo);
            if (!bestHand || this.compare(result, bestHand) > 0) {
                bestHand = result;
            }
        }
        return bestHand;
    }

    static getCombinations(array, k) {
        const results = [];
        function helper(start, combo) {
            if (combo.length === k) {
                results.push([...combo]);
                return;
            }
            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                helper(i + 1, combo);
                combo.pop();
            }
        }
        helper(0, []);
        return results;
    }

    static evaluateFive(cards) {
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        const counts = {};
        const suits = {};
        sorted.forEach(c => {
            counts[c.value] = (counts[c.value] || 0) + 1;
            suits[c.suit] = (suits[c.suit] || 0) + 1;
        });

        const isFlush = Object.values(suits).some(count => count === 5);
        const isStraight = this.checkStraight(sorted);
        const freq = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0]);

        // Hand rank determination
        if (isFlush && isStraight && sorted[0].value === 14) return { rank: HAND_RANKS.ROYAL_FLUSH, value: sorted[0].value, tieBreakers: [], cards: sorted };
        if (isFlush && isStraight) return { rank: HAND_RANKS.STRAIGHT_FLUSH, value: sorted[0].value, tieBreakers: [], cards: sorted };
        if (freq[0][1] === 4) return { rank: HAND_RANKS.FOUR_OF_A_KIND, value: parseInt(freq[0][0]), tieBreakers: [parseInt(freq[1][0])], cards: sorted };
        if (freq[0][1] === 3 && freq[1][1] === 2) return { rank: HAND_RANKS.FULL_HOUSE, value: parseInt(freq[0][0]), tieBreakers: [parseInt(freq[1][0])], cards: sorted };
        if (isFlush) return { rank: HAND_RANKS.FLUSH, value: sorted[0].value, tieBreakers: sorted.map(c => c.value), cards: sorted };
        if (isStraight) return { rank: HAND_RANKS.STRAIGHT, value: sorted[0].value, tieBreakers: [], cards: sorted };
        if (freq[0][1] === 3) return { rank: HAND_RANKS.THREE_OF_A_KIND, value: parseInt(freq[0][0]), tieBreakers: freq.slice(1).map(f => parseInt(f[0])), cards: sorted };
        if (freq[0][1] === 2 && freq[1][1] === 2) return { rank: HAND_RANKS.TWO_PAIR, value: parseInt(freq[0][0]), tieBreakers: [parseInt(freq[1][0]), parseInt(freq[2][0])], cards: sorted };
        if (freq[0][1] === 2) return { rank: HAND_RANKS.PAIR, value: parseInt(freq[0][0]), tieBreakers: freq.slice(1).map(f => parseInt(f[0])), cards: sorted };

        return { rank: HAND_RANKS.HIGH_CARD, value: sorted[0].value, tieBreakers: sorted.slice(1).map(c => c.value), cards: sorted };
    }

    static checkStraight(cards) {
        // Handle Wheel (A, 2, 3, 4, 5)
        const values = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
        if (values.length < 5) return false;

        for (let i = 0; i <= values.length - 5; i++) {
            if (values[i] - values[i + 4] === 4) return true;
        }

        // Special case for Wheel
        if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
            return true;
        }
        return false;
    }

    static compare(h1, h2) {
        if (h1.rank !== h2.rank) return h1.rank - h2.rank;
        if (h1.value !== h2.value) return h1.value - h2.value;
        for (let i = 0; i < h1.tieBreakers.length; i++) {
            if (h1.tieBreakers[i] !== h2.tieBreakers[i]) return h1.tieBreakers[i] - h2.tieBreakers[i];
        }
        return 0;
    }

    static getHandName(result) {
        if (!result) return "";
        return HAND_NAMES[result.rank];
    }
}
