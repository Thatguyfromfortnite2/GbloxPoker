class MultiplayerManager {
    constructor() {
        this.db = firebase.database();
        this.tableId = new URLSearchParams(window.location.search).get('table');
        this.playerName = localStorage.getItem('gblox_name') || 'Guest';
        this.tableRef = null;
        this.playerId = null;

        if (this.tableId) {
            this.tableRef = this.db.ref('tables/' + this.tableId);
            this.init();
        } else {
            // If no table, redirect to lobby
            window.location.href = 'lobby.html';
        }
    }

    async init() {
        // 1. Join the table state
        await this.joinTable();

        // 2. Listen for game state updates
        this.tableRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.handleRemoteUpdate(data);
            }
        });

        // 3. Handle disconnection
        this.tableRef.child('players').child(this.playerName).onDisconnect().remove();
    }

    async joinTable() {
        const snapshot = await this.tableRef.once('value');
        const data = snapshot.val();

        if (!data) return alert("Table no longer exists");

        const players = data.players || {};
        if (Object.keys(players).length >= data.maxPlayers && !players[this.playerName]) {
            alert("Table is full");
            window.location.href = 'lobby.html';
            return;
        }

        // Add self to players
        await this.tableRef.child('players').child(this.playerName).update({
            balance: 1000,
            status: 'waiting',
            isAI: false,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    handleRemoteUpdate(data) {
        // This will be called whenever anyone updates the table state
        // We need to bridge this to our local Game instance
        if (window.pokerGame) {
            window.pokerGame.syncWithMultiplayer(data);
        }
    }

    // Call this from local game when an action occurs
    async sendAction(actionData) {
        if (!this.tableRef) return;

        // Update the remote state
        // In a real implementation, we might use transactions or a specialized server
        // For this serverless version, we update the table root with the new game state
        await this.tableRef.update({
            lastAction: {
                player: this.playerName,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                ...actionData
            }
        });
    }

    async updateGameState(newState) {
        if (!this.tableRef) return;
        await this.tableRef.child('gameState').set(newState);
    }
}

// Start Multiplayer
document.addEventListener('DOMContentLoaded', () => {
    window.multiplayer = new MultiplayerManager();
});
