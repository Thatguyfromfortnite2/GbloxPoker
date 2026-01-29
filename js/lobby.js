class Lobby {
    constructor() {
        this.displayName = localStorage.getItem('gblox_name') || 'Player_' + Math.floor(Math.random() * 1000);
        this.tableNameInput = document.getElementById('new-table-name');
        this.maxPlayersSelect = document.getElementById('max-players');
        this.tablesGrid = document.getElementById('tables-grid');
        this.displayNameEl = document.getElementById('display-name');

        this.init();
    }

    init() {
        this.displayNameEl.textContent = this.displayName;
        document.getElementById('edit-name').onclick = () => this.editName();
        document.getElementById('create-table-btn').onclick = () => this.createTable();
        document.getElementById('refresh-lobby').onclick = () => this.loadTables();

        this.loadTables();

        // Real-time listener for table changes
        db.ref('tables').on('value', (snapshot) => {
            this.renderTables(snapshot.val());
        });
    }

    editName() {
        const newName = prompt("Enter your display name:", this.displayName);
        if (newName && newName.trim()) {
            this.displayName = newName.trim();
            localStorage.setItem('gblox_name', this.displayName);
            this.displayNameEl.textContent = this.displayName;
        }
    }

    async createTable() {
        const name = this.tableNameInput.value.trim();
        if (!name) return alert("Please enter a table name");

        const tableData = {
            name: name,
            maxPlayers: parseInt(this.maxPlayersSelect.value),
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: 'waiting',
            players: {
                [this.displayName]: {
                    balance: 1000,
                    isAdmin: true,
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                }
            }
        };

        const newTableRef = db.ref('tables').push();
        await newTableRef.set(tableData);

        // Redirect to game with table ID
        window.location.href = `index.html?table=${newTableRef.key}`;
    }

    loadTables() {
        db.ref('tables').once('value').then(snapshot => {
            this.renderTables(snapshot.val());
        });
    }

    renderTables(tables) {
        if (!tables) {
            this.tablesGrid.innerHTML = '<div class="lobby-message">No active tables. Create one!</div>';
            return;
        }

        this.tablesGrid.innerHTML = '';
        Object.keys(tables).forEach(id => {
            const t = tables[id];
            const playerCount = t.players ? Object.keys(t.players).length : 0;

            const card = document.createElement('div');
            card.className = 'table-card glass-panel';
            card.innerHTML = `
                <div class="table-name">${t.name}</div>
                <div class="table-stats">
                    <span>${playerCount} / ${t.maxPlayers} Players</span>
                    <span class="table-tag">${t.status}</span>
                </div>
            `;

            card.onclick = () => this.joinTable(id);
            this.tablesGrid.appendChild(card);
        });
    }

    joinTable(tableId) {
        window.location.href = `index.html?table=${tableId}`;
    }
}

// Start Lobby
document.addEventListener('DOMContentLoaded', () => {
    new Lobby();
});
