/**
 * Admin Dashboard JavaScript
 * Handles all functionality for the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    
    // API base URL
    const API_BASE_URL = 'http://localhost:80/api';
    
    // Get DOM elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutButton = document.getElementById('logout');
    
    // Tab elements
    const reservationsTable = document.querySelector('#reservations tbody');
    const usersTable = document.querySelector('#users tbody');
    const roomsGrid = document.querySelector('.rooms-grid');
    
    // Action buttons
    const newReservationBtn = document.querySelector('#reservations .btn-primary');
    const newUserBtn = document.querySelector('#users .btn-primary');
    const newRoomBtn = document.querySelector('#rooms .btn-primary');
    
    // Search inputs
    const reservationSearch = document.querySelector('#reservations .search-box input');
    const userSearch = document.querySelector('#users .search-box input');
    
    // Data storage
    let reservationsData = [];
    let usersData = [];
    let roomsData = [];
    
    // Initialize the dashboard
    init();
    
    // Initialize functions
    function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Load data for active tab
        loadTabData(document.querySelector('.tab-button.active').dataset.tab);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                switchTab(tabName);
                loadTabData(tabName);
            });
        });
        
        // Logout button
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        // Action buttons
        if (newReservationBtn) {
            newReservationBtn.addEventListener('click', function() {
                showNewReservationModal();
            });
        }
        
        if (newUserBtn) {
            newUserBtn.addEventListener('click', function() {
                showNewUserModal();
            });
        }
        
        if (newRoomBtn) {
            newRoomBtn.addEventListener('click', function() {
                showNewRoomModal();
            });
        }
        
        // Search functionality
        if (reservationSearch) {
            reservationSearch.addEventListener('input', function() {
                filterReservations(this.value);
            });
        }
        
        if (userSearch) {
            userSearch.addEventListener('input', function() {
                filterUsers(this.value);
            });
        }
        
        // Redirect to existing admin pages
        document.querySelectorAll('.admin-section .admin-header').forEach(header => {
            // Add building management button
            const buildingsBtn = document.createElement('a');
            buildingsBtn.href = 'admin-buildings.html';
            buildingsBtn.className = 'btn-primary';
            buildingsBtn.innerHTML = '<i class="fas fa-building"></i> Gestion des bâtiments';
            buildingsBtn.style.marginLeft = '10px';
            
            header.appendChild(buildingsBtn);
        });
    }
    
    // Switch tabs
    function switchTab(tabName) {
        // Update active tab button
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });
        
        // Update active tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName) {
                content.classList.add('active');
            }
        });
    }
    
    // Load data for the selected tab
    function loadTabData(tabName) {
        switch (tabName) {
            case 'reservations':
                loadReservations();
                break;
            case 'users':
                loadUsers();
                break;
            case 'rooms':
                loadRooms();
                break;
        }
    }
    
    // Load reservations data
    async function loadReservations() {
        try {
            showLoading(reservationsTable, 5);
            
            const response = await fetch(`${API_BASE_URL}/reservations`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des réservations');
            }
            
            reservationsData = await response.json();
            updateReservationsTable(reservationsData);
        } catch (error) {
            showError(error.message);
            reservationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        <i class="fas fa-exclamation-circle"></i> Erreur lors du chargement des réservations
                    </td>
                </tr>
            `;
        }
    }
    
    // Load users data
    async function loadUsers() {
        try {
            showLoading(usersTable, 6);
            
            // Load both patients and admins
            const patientsResponse = await fetch(`${API_BASE_URL}/patients`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const adminsResponse = await fetch(`${API_BASE_URL}/administrateurs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!patientsResponse.ok || !adminsResponse.ok) {
                throw new Error('Échec du chargement des utilisateurs');
            }
            
            const patients = await patientsResponse.json();
            const admins = await adminsResponse.json();
            
            // Combine and format data
            usersData = [
                ...patients.map(patient => ({
                    ...patient,
                    userType: 'patient',
                    fullName: `${patient.prenom} ${patient.nom}`
                })),
                ...admins.map(admin => ({
                    ...admin,
                    userType: 'admin',
                    fullName: admin.nom_utilisateur
                }))
            ];
            
            updateUsersTable(usersData);
        } catch (error) {
            showError(error.message);
            usersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        <i class="fas fa-exclamation-circle"></i> Erreur lors du chargement des utilisateurs
                    </td>
                </tr>
            `;
        }
    }
    
    // Load rooms data
    async function loadRooms() {
        try {
            roomsGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement des chambres...</div>';
            
            // First get buildings
            const buildingsResponse = await fetch(`${API_BASE_URL}/batiments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            // Then get rooms
            const roomsResponse = await fetch(`${API_BASE_URL}/chambres`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!buildingsResponse.ok || !roomsResponse.ok) {
                throw new Error('Échec du chargement des chambres');
            }
            
            const buildings = await buildingsResponse.json();
            const rooms = await roomsResponse.json();
            
            // Map buildings to rooms
            roomsData = rooms.map(room => {
                const building = buildings.find(b => b.id === room.batiment_id);
                return {
                    ...room,
                    buildingName: building ? building.nom : 'Bâtiment inconnu'
                };
            });
            
            updateRoomsGrid(roomsData);
        } catch (error) {
            showError(error.message);
            roomsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i> Erreur lors du chargement des chambres
                </div>
            `;
        }
    }
    
    // Update reservations table
    function updateReservationsTable(data) {
        reservationsTable.innerHTML = '';
        
        if (data.length === 0) {
            reservationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-info-circle"></i> Aucune réservation trouvée
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach(reservation => {
            const startDate = new Date(reservation.date_debut).toLocaleDateString('fr-FR');
            const endDate = new Date(reservation.date_fin).toLocaleDateString('fr-FR');
            const duration = Math.ceil((new Date(reservation.date_fin) - new Date(reservation.date_debut)) / (1000 * 60 * 60 * 24));
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reservation.id}</td>
                <td>${reservation.patient_nom || 'Nom inconnu'}</td>
                <td>${startDate}</td>
                <td>${duration} jours</td>
                <td>
                    <span class="status-badge ${getStatusClass(reservation.statut)}">
                        ${formatStatus(reservation.statut)}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-action edit" data-id="${reservation.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action view" data-id="${reservation.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action delete" data-id="${reservation.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            reservationsTable.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('#reservations .btn-action.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editReservation(id);
            });
        });
        
        document.querySelectorAll('#reservations .btn-action.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                viewReservation(id);
            });
        });
        
        document.querySelectorAll('#reservations .btn-action.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm(`Êtes-vous sûr de vouloir supprimer la réservation #${id} ?`)) {
                    deleteReservation(id);
                }
            });
        });
    }
    
    // View reservation details
    async function viewReservation(id) {
        try {
            // Get reservation details
            const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des détails de la réservation');
            }
            
            const reservation = await response.json();
            
            // Get patient details
            const patientResponse = await fetch(`${API_BASE_URL}/patients/${reservation.patient_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let patient = {};
            if (patientResponse.ok) {
                patient = await patientResponse.json();
            }
            
            // Get bed details
            const bedResponse = await fetch(`${API_BASE_URL}/lits/${reservation.lit_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let bed = {};
            if (bedResponse.ok) {
                bed = await bedResponse.json();
            }
            
            // Create modal for viewing reservation details
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'view-reservation-modal';
            
            // Format dates
            const startDate = new Date(reservation.date_debut).toLocaleDateString('fr-FR');
            const endDate = new Date(reservation.date_fin).toLocaleDateString('fr-FR');
            const duration = Math.ceil((new Date(reservation.date_fin) - new Date(reservation.date_debut)) / (1000 * 60 * 60 * 24));
            
            // Create modal content
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Détails de la réservation #${reservation.id}</h2>
                    
                    <div class="detail-section">
                        <h3>Informations de réservation</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Statut</span>
                                <span class="detail-value">
                                    <span class="status-badge ${getStatusClass(reservation.statut)}">
                                        ${formatStatus(reservation.statut)}
                                    </span>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date de début</span>
                                <span class="detail-value">${startDate}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date de fin</span>
                                <span class="detail-value">${endDate}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Durée</span>
                                <span class="detail-value">${duration} jours</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Patient</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Nom</span>
                                <span class="detail-value">${patient.nom || 'Non disponible'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Prénom</span>
                                <span class="detail-value">${patient.prenom || 'Non disponible'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email</span>
                                <span class="detail-value">${patient.email || 'Non disponible'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Téléphone</span>
                                <span class="detail-value">${patient.telephone || 'Non disponible'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Hébergement</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Lit</span>
                                <span class="detail-value">Lit #${bed.id || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Chambre</span>
                                <span class="detail-value">Chambre ${bed.chambre_numero || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Bâtiment</span>
                                <span class="detail-value">${bed.batiment_nom || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Notes</h3>
                        <div class="detail-notes">
                            ${reservation.notes ? reservation.notes : 'Aucune note disponible'}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-btn">Fermer</button>
                        <button type="button" class="btn-primary edit-btn" data-id="${reservation.id}">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
            
            // Append modal to body
            document.body.appendChild(modal);
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Edit button event
            modal.querySelector('.edit-btn').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                closeModal(modal);
                editReservation(id);
            });
            
            // Display modal
            modal.style.display = 'block';
            
            // Add styles for detail grid if not present
            if (!document.querySelector('#detail-styles')) {
                const styleTag = document.createElement('style');
                styleTag.id = 'detail-styles';
                styleTag.innerHTML = `
                    .detail-section {
                        margin-bottom: 20px;
                    }
                    
                    .detail-section h3 {
                        color: var(--primary-color);
                        margin-bottom: 10px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 5px;
                    }
                    
                    .detail-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 15px;
                    }
                    
                    .detail-item {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .detail-label {
                        font-weight: 600;
                        color: #666;
                        font-size: 0.875rem;
                    }
                    
                    .detail-value {
                        margin-top: 5px;
                    }
                    
                    .detail-notes {
                        background-color: #f9f9f9;
                        padding: 15px;
                        border-radius: 4px;
                        margin-top: 5px;
                        white-space: pre-line;
                    }
                `;
                document.head.appendChild(styleTag);
            }
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
    
    // Update users table
    function updateUsersTable(data) {
        usersTable.innerHTML = '';
        
        if (data.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-info-circle"></i> Aucun utilisateur trouvé
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.userType === 'admin' ? 'badge-admin' : 'badge-patient'}">
                        ${user.userType === 'admin' ? 'Admin' : 'Patient'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-active">Actif</span>
                </td>
                <td class="actions-cell">
                    <button class="btn-action edit" data-id="${user.id}" data-type="${user.userType}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action view" data-id="${user.id}" data-type="${user.userType}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action delete" data-id="${user.id}" data-type="${user.userType}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            usersTable.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('#users .btn-action.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                editUser(id, type);
            });
        });
        
        document.querySelectorAll('#users .btn-action.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                viewUser(id, type);
            });
        });
        
        document.querySelectorAll('#users .btn-action.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur #${id} (${type}) ?`)) {
                    deleteUser(id, type);
                }
            });
        });
    }
    
    // View user details
    async function viewUser(id, type) {
        try {
            // Get user endpoint based on type
            const endpoint = type === 'admin' ? 
                `${API_BASE_URL}/administrateurs/${id}` : 
                `${API_BASE_URL}/patients/${id}`;
            
            // Get user details
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Échec du chargement des détails de l'utilisateur`);
            }
            
            const userData = await response.json();
            
            // Create modal for viewing user details
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'view-user-modal';
            
            // Create modal content based on user type
            if (type === 'admin') {
                // Admin user
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h2>Détails de l'administrateur #${userData.id}</h2>
                        
                        <div class="detail-section">
                            <h3>Informations personnelles</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Nom d'utilisateur</span>
                                    <span class="detail-value">${userData.nom_utilisateur || 'Non disponible'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Email</span>
                                    <span class="detail-value">${userData.email || 'Non disponible'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Rôle</span>
                                    <span class="detail-value">
                                        <span class="badge badge-admin">
                                            ${userData.role || 'Admin'}
                                        </span>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Date de création</span>
                                    <span class="detail-value">${formatDate(userData.date_creation)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary close-btn">Fermer</button>
                            <button type="button" class="btn-primary edit-btn" data-id="${userData.id}" data-type="${type}">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Patient user
                const dateNaissance = userData.date_naissance ? 
                    new Date(userData.date_naissance).toLocaleDateString('fr-FR') : 'Non disponible';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h2>Détails du patient #${userData.id}</h2>
                        
                        <div class="detail-section">
                            <h3>Informations personnelles</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Nom</span>
                                    <span class="detail-value">${userData.nom || 'Non disponible'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Prénom</span>
                                    <span class="detail-value">${userData.prenom || 'Non disponible'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Date de naissance</span>
                                    <span class="detail-value">${dateNaissance}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Sexe</span>
                                    <span class="detail-value">${userData.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Coordonnées</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Email</span>
                                    <span class="detail-value">${userData.email || 'Non disponible'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Téléphone</span>
                                    <span class="detail-value">${userData.telephone || 'Non disponible'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Informations médicales</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Type de maladie</span>
                                    <span class="detail-value">${userData.type_maladie || 'Non disponible'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Notes</h3>
                            <div class="detail-notes">
                                ${userData.notes || 'Aucune note disponible'}
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary close-btn">Fermer</button>
                            <button type="button" class="btn-primary edit-btn" data-id="${userData.id}" data-type="${type}">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Append modal to body
            document.body.appendChild(modal);
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Edit button event
            modal.querySelector('.edit-btn').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                closeModal(modal);
                editUser(id, type);
            });
            
            // Display modal
            modal.style.display = 'block';
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
    
    // Format date with proper handling of null/undefined
    function formatDate(dateString) {
        if (!dateString) return 'Non disponible';
        
        try {
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (error) {
            return 'Format de date invalide';
        }
    }
    
    // Update rooms grid
    function updateRoomsGrid(data) {
        roomsGrid.innerHTML = '';
        
        if (data.length === 0) {
            roomsGrid.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-info-circle"></i> Aucune chambre trouvée
                </div>
            `;
            return;
        }
        
        // Group rooms by building
        const roomsByBuilding = data.reduce((acc, room) => {
            if (!acc[room.batiment_id]) {
                acc[room.batiment_id] = {
                    buildingName: room.buildingName,
                    rooms: []
                };
            }
            acc[room.batiment_id].rooms.push(room);
            return acc;
        }, {});
        
        // Create building sections with rooms
        Object.values(roomsByBuilding).forEach(building => {
            const buildingSection = document.createElement('div');
            buildingSection.className = 'building-section';
            buildingSection.innerHTML = `<h3>${building.buildingName}</h3>`;
            
            const roomsContainer = document.createElement('div');
            roomsContainer.className = 'rooms-container';
            
            building.rooms.forEach(room => {
                const roomCard = document.createElement('div');
                roomCard.className = 'room-card';
                roomCard.innerHTML = `
                    <div class="room-header">
                        <h4>Chambre ${room.numero}</h4>
                        <span class="room-capacity">
                            <i class="fas fa-users"></i> ${room.capacite} lits
                        </span>
                    </div>
                    <div class="room-description">
                        ${room.description || 'Aucune description'}
                    </div>
                    <div class="room-actions">
                        <button class="btn-action edit" data-id="${room.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action view" data-id="${room.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action delete" data-id="${room.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                roomsContainer.appendChild(roomCard);
            });
            
            buildingSection.appendChild(roomsContainer);
            roomsGrid.appendChild(buildingSection);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('#rooms .btn-action.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editRoom(id);
            });
        });
        
        document.querySelectorAll('#rooms .btn-action.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                viewRoom(id);
            });
        });
        
        document.querySelectorAll('#rooms .btn-action.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm(`Êtes-vous sûr de vouloir supprimer la chambre #${id} ?`)) {
                    deleteRoom(id);
                }
            });
        });
    }
    
    // Filter reservations
    function filterReservations(searchTerm) {
        if (!searchTerm) {
            updateReservationsTable(reservationsData);
            return;
        }
        
        searchTerm = searchTerm.toLowerCase();
        const filtered = reservationsData.filter(reservation => 
            reservation.id.toString().includes(searchTerm) || 
            (reservation.patient_nom && reservation.patient_nom.toLowerCase().includes(searchTerm)) ||
            (reservation.statut && reservation.statut.toLowerCase().includes(searchTerm))
        );
        
        updateReservationsTable(filtered);
    }
    
    // Filter users
    function filterUsers(searchTerm) {
        if (!searchTerm) {
            updateUsersTable(usersData);
            return;
        }
        
        searchTerm = searchTerm.toLowerCase();
        const filtered = usersData.filter(user => 
            user.id.toString().includes(searchTerm) || 
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.userType.toLowerCase().includes(searchTerm)
        );
        
        updateUsersTable(filtered);
    }
    
    // Delete reservation
    async function deleteReservation(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec de la suppression de la réservation');
            }
            
            // Remove from local data and update table
            reservationsData = reservationsData.filter(r => r.id != id);
            updateReservationsTable(reservationsData);
            
            showSuccess('Réservation supprimée avec succès');
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
    
    // Delete user
    async function deleteUser(id, type) {
        try {
            const endpoint = type === 'admin' ? 
                `${API_BASE_URL}/administrateurs/${id}` : 
                `${API_BASE_URL}/patients/${id}`;
            
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Échec de la suppression de l'utilisateur`);
            }
            
            // Remove from local data and update table
            usersData = usersData.filter(u => !(u.id == id && u.userType === type));
            updateUsersTable(usersData);
            
            showSuccess('Utilisateur supprimé avec succès');
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
    
    // Delete room
    async function deleteRoom(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/chambres/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec de la suppression de la chambre');
            }
            
            // Remove from local data and update UI
            roomsData = roomsData.filter(r => r.id != id);
            updateRoomsGrid(roomsData);
            
            showSuccess('Chambre supprimée avec succès');
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
    
    // Show loading indicator
    function showLoading(container, columns) {
        container.innerHTML = `
            <tr>
                <td colspan="${columns}" class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Chargement des données...
                </td>
            </tr>
        `;
    }
    
    // Show success message
    function showSuccess(message) {
        const alertBox = document.createElement('div');
        alertBox.className = 'alert alert-success';
        alertBox.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        document.querySelector('.admin-section').prepend(alertBox);
        
        setTimeout(() => {
            alertBox.remove();
        }, 3000);
    }
    
    // Show error message
    function showError(message) {
        const alertBox = document.createElement('div');
        alertBox.className = 'alert alert-error';
        alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        document.querySelector('.admin-section').prepend(alertBox);
        
        setTimeout(() => {
            alertBox.remove();
        }, 3000);
    }
    
    // Show message (for in-development features)
    function showMessage(message) {
        alert(message);
    }
    
    // Format status for display
    function formatStatus(status) {
        if (!status) return 'Inconnu';
        
        switch (status.toLowerCase()) {
            case 'confirmée':
            case 'confirmee':
            case 'confirmed':
                return 'Confirmée';
            case 'en_attente':
            case 'en attente':
            case 'pending':
                return 'En attente';
            case 'annulée':
            case 'annulee':
            case 'cancelled':
                return 'Annulée';
            case 'terminée':
            case 'terminee':
            case 'completed':
                return 'Terminée';
            default:
                return status;
        }
    }
    
    // Get status class for styling
    function getStatusClass(status) {
        if (!status) return 'status-unknown';
        
        switch (status.toLowerCase()) {
            case 'confirmée':
            case 'confirmee':
            case 'confirmed':
                return 'status-confirmed';
            case 'en_attente':
            case 'en attente':
            case 'pending':
                return 'status-pending';
            case 'annulée':
            case 'annulee':
            case 'cancelled':
                return 'status-cancelled';
            case 'terminée':
            case 'terminee':
            case 'completed':
                return 'status-completed';
            default:
                return 'status-unknown';
        }
    }
    
    // Logout function
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        window.location.href = 'login.html';
    }
    
    // Check if user is admin
    function isAdmin() {
        return localStorage.getItem('userRole') === 'admin';
    }

    // New Reservation Modal
    function showNewReservationModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'reservation-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Nouvelle réservation</h2>
                
                <form id="reservation-form">
                    <div class="form-group">
                        <label for="patient-id">Patient</label>
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <select id="patient-id" name="patient-id" required>
                                <option value="">Sélectionner un patient</option>
                                <!-- Options will be loaded dynamically -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="lit-id">Lit</label>
                        <div class="input-group">
                            <i class="fas fa-bed"></i>
                            <select id="lit-id" name="lit-id" required>
                                <option value="">Sélectionner un lit</option>
                                <!-- Options will be loaded dynamically -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="date-debut">Date de début</label>
                        <div class="input-group">
                            <i class="fas fa-calendar"></i>
                            <input type="date" id="date-debut" name="date-debut" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="date-fin">Date de fin</label>
                        <div class="input-group">
                            <i class="fas fa-calendar"></i>
                            <input type="date" id="date-fin" name="date-fin" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="statut">Statut</label>
                        <div class="input-group">
                            <i class="fas fa-info-circle"></i>
                            <select id="statut" name="statut" required>
                                <option value="en_attente">En attente</option>
                                <option value="confirmee">Confirmée</option>
                                <option value="annulee">Annulée</option>
                                <option value="terminee">Terminée</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <div class="input-group">
                            <i class="fas fa-sticky-note"></i>
                            <textarea id="notes" name="notes" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Créer la réservation
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Append modal to body
        document.body.appendChild(modal);
        
        // Load patients for select dropdown
        loadPatients();
        
        // Load available beds for select dropdown
        loadAvailableBeds();
        
        // Close modal event
        modal.querySelector('.close-modal').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Cancel button event
        modal.querySelector('.cancel-btn').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Form submission
        modal.querySelector('#reservation-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const patientId = document.getElementById('patient-id').value;
            const litId = document.getElementById('lit-id').value;
            const dateDebut = document.getElementById('date-debut').value;
            const dateFin = document.getElementById('date-fin').value;
            const statut = document.getElementById('statut').value;
            const notes = document.getElementById('notes').value;
            
            // Validate form
            if (!patientId || !litId || !dateDebut || !dateFin || !statut) {
                showError('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            try {
                // Create reservation
                const response = await fetch(`${API_BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        patient_id: patientId,
                        lit_id: litId,
                        date_debut: dateDebut,
                        date_fin: dateFin,
                        statut: statut,
                        notes: notes
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Échec de la création de la réservation');
                }
                
                // Close modal
                closeModal(modal);
                
                // Reload reservations
                await loadReservations();
                
                // Show success message
                showSuccess('Réservation créée avec succès');
            } catch (error) {
                showError(`Erreur: ${error.message}`);
            }
        });
        
        // Display modal
        modal.style.display = 'block';
    }

    // Load patients for select dropdown
    async function loadPatients() {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des patients');
            }
            
            const patients = await response.json();
            const patientSelect = document.getElementById('patient-id');
            
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.prenom} ${patient.nom}`;
                patientSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Load available beds for select dropdown
    async function loadAvailableBeds() {
        try {
            const response = await fetch(`${API_BASE_URL}/lits/disponibles`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des lits disponibles');
            }
            
            const beds = await response.json();
            const bedSelect = document.getElementById('lit-id');
            
            beds.forEach(bed => {
                const option = document.createElement('option');
                option.value = bed.id;
                option.textContent = `Lit #${bed.id} - Chambre ${bed.chambre_numero || 'N/A'} - Bâtiment ${bed.batiment_nom || 'N/A'}`;
                bedSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // New User Modal
    function showNewUserModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'user-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Nouvel utilisateur</h2>
                
                <form id="user-form">
                    <div class="form-group">
                        <label for="user-type">Type d'utilisateur</label>
                        <div class="input-group">
                            <i class="fas fa-user-tag"></i>
                            <select id="user-type" name="user-type" required>
                                <option value="patient">Patient</option>
                                <option value="admin">Administrateur</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-nom">Nom</label>
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="user-nom" name="user-nom" required>
                        </div>
                    </div>
                    
                    <div class="form-group patient-field">
                        <label for="user-prenom">Prénom</label>
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="user-prenom" name="user-prenom">
                        </div>
                    </div>
                    
                    <div class="form-group patient-field">
                        <label for="user-date-naissance">Date de naissance</label>
                        <div class="input-group">
                            <i class="fas fa-calendar"></i>
                            <input type="date" id="user-date-naissance" name="user-date-naissance">
                        </div>
                    </div>
                    
                    <div class="form-group patient-field">
                        <label>Sexe</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="user-sexe" value="M" checked>
                                <span>Homme</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="user-sexe" value="F">
                                <span>Femme</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-email">Email</label>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="user-email" name="user-email" required>
                        </div>
                    </div>
                    
                    <div class="form-group patient-field">
                        <label for="user-telephone">Téléphone</label>
                        <div class="input-group">
                            <i class="fas fa-phone"></i>
                            <input type="tel" id="user-telephone" name="user-telephone">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-password">Mot de passe</label>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="user-password" name="user-password" required>
                            <button type="button" class="toggle-password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group admin-field" style="display: none;">
                        <label for="user-role">Rôle</label>
                        <div class="input-group">
                            <i class="fas fa-user-shield"></i>
                            <select id="user-role" name="user-role">
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Créer l'utilisateur
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Append modal to body
        document.body.appendChild(modal);
        
        // Toggle password visibility
        const togglePasswordBtn = modal.querySelector('.toggle-password');
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = this.parentNode.querySelector('input');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
        
        // Toggle fields based on user type
        const userTypeSelect = modal.querySelector('#user-type');
        userTypeSelect.addEventListener('change', function() {
            const patientFields = modal.querySelectorAll('.patient-field');
            const adminFields = modal.querySelectorAll('.admin-field');
            
            if (this.value === 'patient') {
                patientFields.forEach(field => field.style.display = 'block');
                adminFields.forEach(field => field.style.display = 'none');
            } else {
                patientFields.forEach(field => field.style.display = 'none');
                adminFields.forEach(field => field.style.display = 'block');
            }
        });
        
        // Close modal event
        modal.querySelector('.close-modal').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Cancel button event
        modal.querySelector('.cancel-btn').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Form submission
        modal.querySelector('#user-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const userType = document.getElementById('user-type').value;
            const nom = document.getElementById('user-nom').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            
            try {
                let response;
                
                if (userType === 'patient') {
                    // Get patient-specific fields
                    const prenom = document.getElementById('user-prenom').value;
                    const dateNaissance = document.getElementById('user-date-naissance').value;
                    const sexe = document.querySelector('input[name="user-sexe"]:checked').value;
                    const telephone = document.getElementById('user-telephone').value;
                    
                    // Create patient
                    response = await fetch(`${API_BASE_URL}/utilisateurs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            nom: nom,
                            prenom: prenom,
                            date_naissance: dateNaissance,
                            sexe: sexe,
                            email: email,
                            telephone: telephone,
                            password: password
                        })
                    });
                } else {
                    // Get admin-specific fields
                    const role = document.getElementById('user-role').value;
                    
                    // Create admin
                    response = await fetch(`${API_BASE_URL}/administrateurs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            nom_utilisateur: nom,
                            email: email,
                            mot_de_passe: password,
                            role: role
                        })
                    });
                }
                
                if (!response.ok) {
                    throw new Error(`Échec de la création de l'utilisateur`);
                }
                
                // Close modal
                closeModal(modal);
                
                // Reload users
                await loadUsers();
                
                // Show success message
                showSuccess('Utilisateur créé avec succès');
            } catch (error) {
                showError(`Erreur: ${error.message}`);
            }
        });
        
        // Display modal
        modal.style.display = 'block';
    }

    // New Room Modal
    function showNewRoomModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'room-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Nouvelle chambre</h2>
                
                <form id="room-form">
                    <div class="form-group">
                        <label for="building-id">Bâtiment</label>
                        <div class="input-group">
                            <i class="fas fa-building"></i>
                            <select id="building-id" name="building-id" required>
                                <option value="">Sélectionner un bâtiment</option>
                                <!-- Options will be loaded dynamically -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="room-number">Numéro de chambre</label>
                        <div class="input-group">
                            <i class="fas fa-door-open"></i>
                            <input type="text" id="room-number" name="room-number" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="room-capacity">Capacité (nombre de lits)</label>
                        <div class="input-group">
                            <i class="fas fa-bed"></i>
                            <input type="number" id="room-capacity" name="room-capacity" min="1" max="10" value="2" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="room-description">Description</label>
                        <div class="input-group">
                            <i class="fas fa-align-left"></i>
                            <textarea id="room-description" name="room-description" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Créer la chambre
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Append modal to body
        document.body.appendChild(modal);
        
        // Load buildings for select dropdown
        loadBuildingsForSelect();
        
        // Close modal event
        modal.querySelector('.close-modal').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Cancel button event
        modal.querySelector('.cancel-btn').addEventListener('click', function() {
            closeModal(modal);
        });
        
        // Form submission
        modal.querySelector('#room-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const buildingId = document.getElementById('building-id').value;
            const roomNumber = document.getElementById('room-number').value;
            const roomCapacity = document.getElementById('room-capacity').value;
            const roomDescription = document.getElementById('room-description').value;
            
            // Validate form
            if (!buildingId || !roomNumber || !roomCapacity) {
                showError('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            try {
                // Create room
                const response = await fetch(`${API_BASE_URL}/chambres`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        batiment_id: buildingId,
                        numero: roomNumber,
                        capacite: roomCapacity,
                        description: roomDescription
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Échec de la création de la chambre');
                }
                
                // Get the created room ID
                const roomData = await response.json();
                
                // Create beds based on capacity
                for (let i = 1; i <= roomCapacity; i++) {
                    await fetch(`${API_BASE_URL}/lits`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            chambre_id: roomData.id,
                            numero: i,
                            statut: 'disponible'
                        })
                    });
                }
                
                // Close modal
                closeModal(modal);
                
                // Reload rooms
                await loadRooms();
                
                // Show success message
                showSuccess('Chambre créée avec succès');
            } catch (error) {
                showError(`Erreur: ${error.message}`);
            }
        });
        
        // Display modal
        modal.style.display = 'block';
    }

    // Load buildings for select dropdown
    async function loadBuildingsForSelect() {
        try {
            const response = await fetch(`${API_BASE_URL}/batiments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des bâtiments');
            }
            
            const buildings = await response.json();
            const buildingSelect = document.getElementById('building-id');
            
            buildings.forEach(building => {
                const option = document.createElement('option');
                option.value = building.id;
                option.textContent = building.nom;
                buildingSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Close modal helper
    function closeModal(modal) {
        // If modal is an element, remove it from DOM
        if (modal instanceof Element) {
            modal.remove();
        } else if (typeof modal === 'string') {
            // If modal is a string (ID), hide the modal
            document.getElementById(modal).style.display = 'none';
        }
    }

    // View room details
    async function viewRoom(id) {
        try {
            // Get room details
            const response = await fetch(`${API_BASE_URL}/chambres/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des détails de la chambre');
            }
            
            const room = await response.json();
            
            // Get building details
            const buildingResponse = await fetch(`${API_BASE_URL}/batiments/${room.batiment_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let building = {};
            if (buildingResponse.ok) {
                building = await buildingResponse.json();
            }
            
            // Get beds in this room
            const bedsResponse = await fetch(`${API_BASE_URL}/lits?chambre_id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let beds = [];
            if (bedsResponse.ok) {
                beds = await bedsResponse.json();
            }
            
            // Create modal for viewing room details
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'view-room-modal';
            
            // Create beds list HTML
            let bedsHTML = '';
            if (beds.length > 0) {
                bedsHTML = beds.map(bed => `
                    <tr>
                        <td>${bed.id}</td>
                        <td>${bed.numero || 'N/A'}</td>
                        <td>
                            <span class="status-badge ${bed.statut === 'disponible' ? 'status-confirmed' : 'status-pending'}">
                                ${bed.statut === 'disponible' ? 'Disponible' : 'Occupé'}
                            </span>
                        </td>
                    </tr>
                `).join('');
            } else {
                bedsHTML = `
                    <tr>
                        <td colspan="3" class="empty-message">Aucun lit trouvé</td>
                    </tr>
                `;
            }
            
            // Create modal content
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Détails de la chambre #${room.id}</h2>
                    
                    <div class="detail-section">
                        <h3>Informations générales</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Numéro</span>
                                <span class="detail-value">${room.numero || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Bâtiment</span>
                                <span class="detail-value">${building.nom || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Capacité</span>
                                <span class="detail-value">${room.capacite || '0'} lits</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date de création</span>
                                <span class="detail-value">${formatDate(room.date_creation)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Description</h3>
                        <div class="detail-notes">
                            ${room.description || 'Aucune description disponible'}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Lits (${beds.length})</h3>
                        <div class="beds-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Numéro</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bedsHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary close-btn">Fermer</button>
                        <button type="button" class="btn-primary edit-btn" data-id="${room.id}">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
            
            // Append modal to body
            document.body.appendChild(modal);
            
            // Add beds table style
            if (!document.querySelector('#beds-table-style')) {
                const styleTag = document.createElement('style');
                styleTag.id = 'beds-table-style';
                styleTag.innerHTML = `
                    .beds-table {
                        margin-top: 10px;
                        overflow-x: auto;
                    }
                    
                    .beds-table table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    
                    .beds-table th, 
                    .beds-table td {
                        padding: 8px 12px;
                        text-align: left;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .beds-table th {
                        background-color: #f9f9f9;
                        font-weight: 600;
                    }
                `;
                document.head.appendChild(styleTag);
            }
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Edit button event
            modal.querySelector('.edit-btn').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                closeModal(modal);
                editRoom(id);
            });
            
            // Display modal
            modal.style.display = 'block';
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Edit reservation
    async function editReservation(id) {
        try {
            // Get reservation details
            const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des détails de la réservation');
            }
            
            const reservation = await response.json();
            
            // Create modal element
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'edit-reservation-modal';
            
            // Format dates for input fields
            const startDate = new Date(reservation.date_debut).toISOString().split('T')[0];
            const endDate = new Date(reservation.date_fin).toISOString().split('T')[0];
            
            // Create modal content
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Modifier la réservation #${reservation.id}</h2>
                    
                    <form id="edit-reservation-form">
                        <div class="form-group">
                            <label for="edit-patient-id">Patient</label>
                            <div class="input-group">
                                <i class="fas fa-user"></i>
                                <select id="edit-patient-id" name="edit-patient-id" required>
                                    <option value="">Sélectionner un patient</option>
                                    <!-- Options will be loaded dynamically -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-lit-id">Lit</label>
                            <div class="input-group">
                                <i class="fas fa-bed"></i>
                                <select id="edit-lit-id" name="edit-lit-id" required>
                                    <option value="">Sélectionner un lit</option>
                                    <!-- Options will be loaded dynamically -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-date-debut">Date de début</label>
                            <div class="input-group">
                                <i class="fas fa-calendar"></i>
                                <input type="date" id="edit-date-debut" name="edit-date-debut" value="${startDate}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-date-fin">Date de fin</label>
                            <div class="input-group">
                                <i class="fas fa-calendar"></i>
                                <input type="date" id="edit-date-fin" name="edit-date-fin" value="${endDate}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-statut">Statut</label>
                            <div class="input-group">
                                <i class="fas fa-info-circle"></i>
                                <select id="edit-statut" name="edit-statut" required>
                                    <option value="en_attente" ${reservation.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                                    <option value="confirmee" ${reservation.statut === 'confirmee' ? 'selected' : ''}>Confirmée</option>
                                    <option value="annulee" ${reservation.statut === 'annulee' ? 'selected' : ''}>Annulée</option>
                                    <option value="terminee" ${reservation.statut === 'terminee' ? 'selected' : ''}>Terminée</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-notes">Notes</label>
                            <div class="input-group">
                                <i class="fas fa-sticky-note"></i>
                                <textarea id="edit-notes" name="edit-notes" rows="3">${reservation.notes || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Enregistrer les modifications
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Append modal to body
            document.body.appendChild(modal);
            
            // Load patients for select dropdown
            loadPatientsForEdit(reservation.patient_id);
            
            // Load available beds for select dropdown, including current bed
            loadAvailableBedsForEdit(reservation.lit_id);
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Cancel button event
            modal.querySelector('.cancel-btn').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Form submission
            modal.querySelector('#edit-reservation-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Get form values
                const patientId = document.getElementById('edit-patient-id').value;
                const litId = document.getElementById('edit-lit-id').value;
                const dateDebut = document.getElementById('edit-date-debut').value;
                const dateFin = document.getElementById('edit-date-fin').value;
                const statut = document.getElementById('edit-statut').value;
                const notes = document.getElementById('edit-notes').value;
                
                // Validate form
                if (!patientId || !litId || !dateDebut || !dateFin || !statut) {
                    showError('Veuillez remplir tous les champs obligatoires');
                    return;
                }
                
                try {
                    // Update reservation
                    const updateResponse = await fetch(`${API_BASE_URL}/reservations/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            patient_id: patientId,
                            lit_id: litId,
                            date_debut: dateDebut,
                            date_fin: dateFin,
                            statut: statut,
                            notes: notes
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        throw new Error('Échec de la mise à jour de la réservation');
                    }
                    
                    // Close modal
                    closeModal(modal);
                    
                    // Reload reservations
                    await loadReservations();
                    
                    // Show success message
                    showSuccess('Réservation mise à jour avec succès');
                } catch (error) {
                    showError(`Erreur: ${error.message}`);
                }
            });
            
            // Display modal
            modal.style.display = 'block';
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Load patients for edit dropdown
    async function loadPatientsForEdit(selectedPatientId) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des patients');
            }
            
            const patients = await response.json();
            const patientSelect = document.getElementById('edit-patient-id');
            
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.prenom} ${patient.nom}`;
                
                // Select the current patient
                if (patient.id == selectedPatientId) {
                    option.selected = true;
                }
                
                patientSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Load available beds for edit dropdown
    async function loadAvailableBedsForEdit(selectedBedId) {
        try {
            // Get all beds
            const response = await fetch(`${API_BASE_URL}/lits`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des lits');
            }
            
            const beds = await response.json();
            const bedSelect = document.getElementById('edit-lit-id');
            
            // Get bed details for the currently assigned bed
            const currentBedResponse = await fetch(`${API_BASE_URL}/lits/${selectedBedId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let currentBed = null;
            if (currentBedResponse.ok) {
                currentBed = await currentBedResponse.json();
            }
            
            // Get available beds
            const availableBedsResponse = await fetch(`${API_BASE_URL}/lits/disponibles`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            let availableBeds = [];
            if (availableBedsResponse.ok) {
                availableBeds = await availableBedsResponse.json();
            }
            
            // Combine the current bed with available beds
            const allBeds = [...availableBeds];
            
            // Add the current bed if it's not already in the list
            if (currentBed && !allBeds.some(bed => bed.id == currentBed.id)) {
                allBeds.push(currentBed);
            }
            
            // Add options to select
            allBeds.forEach(bed => {
                const option = document.createElement('option');
                option.value = bed.id;
                option.textContent = `Lit #${bed.id} - Chambre ${bed.chambre_numero || 'N/A'} - Bâtiment ${bed.batiment_nom || 'N/A'}`;
                
                // Select the current bed
                if (bed.id == selectedBedId) {
                    option.selected = true;
                }
                
                bedSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Edit user
    async function editUser(id, type) {
        try {
            // Get user endpoint based on type
            const endpoint = type === 'admin' ? 
                `${API_BASE_URL}/administrateurs/${id}` : 
                `${API_BASE_URL}/patients/${id}`;
            
            // Get user details
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Échec du chargement des détails de l'utilisateur`);
            }
            
            const userData = await response.json();
            
            // Create modal element
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'edit-user-modal';
            
            // Create modal content based on user type
            if (type === 'admin') {
                // Admin user
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h2>Modifier l'administrateur #${userData.id}</h2>
                        
                        <form id="edit-admin-form">
                            <div class="form-group">
                                <label for="edit-admin-nom">Nom d'utilisateur</label>
                                <div class="input-group">
                                    <i class="fas fa-user"></i>
                                    <input type="text" id="edit-admin-nom" name="edit-admin-nom" value="${userData.nom_utilisateur || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-admin-email">Email</label>
                                <div class="input-group">
                                    <i class="fas fa-envelope"></i>
                                    <input type="email" id="edit-admin-email" name="edit-admin-email" value="${userData.email || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-admin-password">Nouveau mot de passe (laisser vide pour conserver l'actuel)</label>
                                <div class="input-group">
                                    <i class="fas fa-lock"></i>
                                    <input type="password" id="edit-admin-password" name="edit-admin-password">
                                    <button type="button" class="toggle-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-admin-role">Rôle</label>
                                <div class="input-group">
                                    <i class="fas fa-user-shield"></i>
                                    <select id="edit-admin-role" name="edit-admin-role">
                                        <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        <option value="super_admin" ${userData.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i> Enregistrer les modifications
                                </button>
                            </div>
                        </form>
                    </div>
                `;
                
                // Append modal to body
                document.body.appendChild(modal);
                
                // Toggle password visibility
                const togglePasswordBtn = modal.querySelector('.toggle-password');
                togglePasswordBtn.addEventListener('click', function() {
                    const passwordInput = this.parentNode.querySelector('input');
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    this.querySelector('i').classList.toggle('fa-eye');
                    this.querySelector('i').classList.toggle('fa-eye-slash');
                });
                
                // Form submission for admin
                modal.querySelector('#edit-admin-form').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    // Get form values
                    const nom = document.getElementById('edit-admin-nom').value;
                    const email = document.getElementById('edit-admin-email').value;
                    const password = document.getElementById('edit-admin-password').value;
                    const role = document.getElementById('edit-admin-role').value;
                    
                    // Create update object
                    const updateData = {
                        nom_utilisateur: nom,
                        email: email,
                        role: role
                    };
                    
                    // Add password only if provided
                    if (password) {
                        updateData.mot_de_passe = password;
                    }
                    
                    try {
                        // Update admin
                        const updateResponse = await fetch(`${API_BASE_URL}/administrateurs/${id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify(updateData)
                        });
                        
                        if (!updateResponse.ok) {
                            throw new Error(`Échec de la mise à jour de l'administrateur`);
                        }
                        
                        // Close modal
                        closeModal(modal);
                        
                        // Reload users
                        await loadUsers();
                        
                        // Show success message
                        showSuccess('Administrateur mis à jour avec succès');
                    } catch (error) {
                        showError(`Erreur: ${error.message}`);
                    }
                });
            } else {
                // Patient user
                const dateNaissance = userData.date_naissance ? 
                    new Date(userData.date_naissance).toISOString().split('T')[0] : '';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h2>Modifier le patient #${userData.id}</h2>
                        
                        <form id="edit-patient-form">
                            <div class="form-group">
                                <label for="edit-patient-nom">Nom</label>
                                <div class="input-group">
                                    <i class="fas fa-user"></i>
                                    <input type="text" id="edit-patient-nom" name="edit-patient-nom" value="${userData.nom || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-prenom">Prénom</label>
                                <div class="input-group">
                                    <i class="fas fa-user"></i>
                                    <input type="text" id="edit-patient-prenom" name="edit-patient-prenom" value="${userData.prenom || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-email">Email</label>
                                <div class="input-group">
                                    <i class="fas fa-envelope"></i>
                                    <input type="email" id="edit-patient-email" name="edit-patient-email" value="${userData.email || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-password">Nouveau mot de passe (laisser vide pour conserver l'actuel)</label>
                                <div class="input-group">
                                    <i class="fas fa-lock"></i>
                                    <input type="password" id="edit-patient-password" name="edit-patient-password">
                                    <button type="button" class="toggle-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-date-naissance">Date de naissance</label>
                                <div class="input-group">
                                    <i class="fas fa-calendar"></i>
                                    <input type="date" id="edit-patient-date-naissance" name="edit-patient-date-naissance" value="${dateNaissance}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Sexe</label>
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="edit-patient-sexe" value="M" ${userData.sexe === 'M' ? 'checked' : ''}>
                                        <span>Homme</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="edit-patient-sexe" value="F" ${userData.sexe === 'F' ? 'checked' : ''}>
                                        <span>Femme</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-telephone">Téléphone</label>
                                <div class="input-group">
                                    <i class="fas fa-phone"></i>
                                    <input type="tel" id="edit-patient-telephone" name="edit-patient-telephone" value="${userData.telephone || ''}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-type-maladie">Type de maladie</label>
                                <div class="input-group">
                                    <i class="fas fa-stethoscope"></i>
                                    <input type="text" id="edit-patient-type-maladie" name="edit-patient-type-maladie" value="${userData.type_maladie || ''}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-patient-notes">Notes</label>
                                <div class="input-group">
                                    <i class="fas fa-sticky-note"></i>
                                    <textarea id="edit-patient-notes" name="edit-patient-notes" rows="3">${userData.notes || ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i> Enregistrer les modifications
                                </button>
                            </div>
                        </form>
                    </div>
                `;
                
                // Append modal to body
                document.body.appendChild(modal);
                
                // Toggle password visibility
                const togglePasswordBtn = modal.querySelector('.toggle-password');
                togglePasswordBtn.addEventListener('click', function() {
                    const passwordInput = this.parentNode.querySelector('input');
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    this.querySelector('i').classList.toggle('fa-eye');
                    this.querySelector('i').classList.toggle('fa-eye-slash');
                });
                
                // Form submission for patient
                modal.querySelector('#edit-patient-form').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    // Get form values
                    const nom = document.getElementById('edit-patient-nom').value;
                    const prenom = document.getElementById('edit-patient-prenom').value;
                    const email = document.getElementById('edit-patient-email').value;
                    const password = document.getElementById('edit-patient-password').value;
                    const dateNaissance = document.getElementById('edit-patient-date-naissance').value;
                    const sexe = document.querySelector('input[name="edit-patient-sexe"]:checked').value;
                    const telephone = document.getElementById('edit-patient-telephone').value;
                    const typeMaladie = document.getElementById('edit-patient-type-maladie').value;
                    const notes = document.getElementById('edit-patient-notes').value;
                    
                    // Create update object
                    const updateData = {
                        nom: nom,
                        prenom: prenom,
                        email: email,
                        date_naissance: dateNaissance,
                        sexe: sexe,
                        telephone: telephone,
                        type_maladie: typeMaladie,
                        notes: notes
                    };
                    
                    // Add password only if provided
                    if (password) {
                        updateData.password = password;
                    }
                    
                    try {
                        // Update patient
                        const updateResponse = await fetch(`${API_BASE_URL}/patients/${id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify(updateData)
                        });
                        
                        if (!updateResponse.ok) {
                            throw new Error(`Échec de la mise à jour du patient`);
                        }
                        
                        // Close modal
                        closeModal(modal);
                        
                        // Reload users
                        await loadUsers();
                        
                        // Show success message
                        showSuccess('Patient mis à jour avec succès');
                    } catch (error) {
                        showError(`Erreur: ${error.message}`);
                    }
                });
            }
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Cancel button event
            modal.querySelector('.cancel-btn').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Display modal
            modal.style.display = 'block';
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Edit room
    async function editRoom(id) {
        try {
            // Get room details
            const response = await fetch(`${API_BASE_URL}/chambres/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des détails de la chambre');
            }
            
            const room = await response.json();
            
            // Create modal element
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'edit-room-modal';
            
            // Create modal content
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Modifier la chambre #${room.id}</h2>
                    
                    <form id="edit-room-form">
                        <div class="form-group">
                            <label for="edit-building-id">Bâtiment</label>
                            <div class="input-group">
                                <i class="fas fa-building"></i>
                                <select id="edit-building-id" name="edit-building-id" required>
                                    <option value="">Sélectionner un bâtiment</option>
                                    <!-- Options will be loaded dynamically -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-room-number">Numéro de chambre</label>
                            <div class="input-group">
                                <i class="fas fa-door-open"></i>
                                <input type="text" id="edit-room-number" name="edit-room-number" value="${room.numero || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-room-capacity">Capacité (nombre de lits)</label>
                            <div class="input-group">
                                <i class="fas fa-bed"></i>
                                <input type="number" id="edit-room-capacity" name="edit-room-capacity" min="1" max="10" value="${room.capacite || 2}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-room-description">Description</label>
                            <div class="input-group">
                                <i class="fas fa-align-left"></i>
                                <textarea id="edit-room-description" name="edit-room-description" rows="3">${room.description || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary cancel-btn">Annuler</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Enregistrer les modifications
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Append modal to body
            document.body.appendChild(modal);
            
            // Load buildings for select dropdown
            loadBuildingsForEdit(room.batiment_id);
            
            // Close modal event
            modal.querySelector('.close-modal').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Cancel button event
            modal.querySelector('.cancel-btn').addEventListener('click', function() {
                closeModal(modal);
            });
            
            // Form submission
            modal.querySelector('#edit-room-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Get form values
                const buildingId = document.getElementById('edit-building-id').value;
                const roomNumber = document.getElementById('edit-room-number').value;
                const roomCapacity = document.getElementById('edit-room-capacity').value;
                const roomDescription = document.getElementById('edit-room-description').value;
                
                // Validate form
                if (!buildingId || !roomNumber || !roomCapacity) {
                    showError('Veuillez remplir tous les champs obligatoires');
                    return;
                }
                
                try {
                    // Update room
                    const updateResponse = await fetch(`${API_BASE_URL}/chambres/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            batiment_id: buildingId,
                            numero: roomNumber,
                            capacite: roomCapacity,
                            description: roomDescription
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        throw new Error('Échec de la mise à jour de la chambre');
                    }
                    
                    // Close modal
                    closeModal(modal);
                    
                    // Reload rooms
                    await loadRooms();
                    
                    // Show success message
                    showSuccess('Chambre mise à jour avec succès');
                } catch (error) {
                    showError(`Erreur: ${error.message}`);
                }
            });
            
            // Display modal
            modal.style.display = 'block';
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }

    // Load buildings for edit dropdown
    async function loadBuildingsForEdit(selectedBuildingId) {
        try {
            const response = await fetch(`${API_BASE_URL}/batiments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Échec du chargement des bâtiments');
            }
            
            const buildings = await response.json();
            const buildingSelect = document.getElementById('edit-building-id');
            
            buildings.forEach(building => {
                const option = document.createElement('option');
                option.value = building.id;
                option.textContent = building.nom;
                
                // Select the current building
                if (building.id == selectedBuildingId) {
                    option.selected = true;
                }
                
                buildingSelect.appendChild(option);
            });
        } catch (error) {
            showError(`Erreur: ${error.message}`);
        }
    }
}); 