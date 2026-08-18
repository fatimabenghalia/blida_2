// Configuration API
const API_BASE_URL = 'http://localhost:80/api';
let authToken = localStorage.getItem('authToken');

// Gestion de la navigation
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    // Toggle du menu mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Fermer le menu lors du clic sur un lien
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (menuToggle) {
                menuToggle.classList.remove('active');
            }
        });
    });

    // Gestion du scroll pour la navbar
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });

    // Animation des éléments au scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.service-card, .stat-item, .about-content, .contact-content');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            
            if (elementTop < window.innerHeight && elementBottom > 0) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialiser les styles pour l'animation
    document.querySelectorAll('.service-card, .stat-item, .about-content, .contact-content').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease-out';
    });

    // Écouter le scroll pour l'animation
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Appel initial

    // Smooth scroll pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animation des statistiques
    const stats = document.querySelectorAll('.stat-number');
    const animateStats = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 20);
        });
    };

    // Observer pour déclencher l'animation des stats
    if (document.querySelector('.stats')) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(document.querySelector('.stats'));
    }

    // Gestion de la connexion utilisateur
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    // Gestion de l'inscription
    if (document.getElementById('register-form')) {
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    }

    // Gestion de la déconnexion
    if (document.getElementById('logout')) {
        document.getElementById('logout').addEventListener('click', handleLogout);
    }

    // Vérifier si on est sur la page réservation
    if (document.getElementById('reservation-container')) {
        // Vérifier si l'utilisateur est connecté
        if (isUserLoggedIn()) {
            showReservationForm();
        } else {
            showLoginRequired();
        }
    }

    // Charger les données du tableau de bord si on est sur cette page
    if (document.querySelector('.dashboard-section')) {
        loadUserInfo();
        loadUserReservations();
    }

    // Si on est sur la page admin
    if (document.querySelector('.admin-dashboard')) {
        // Vérifier si l'utilisateur est admin
        if (isAdmin()) {
            loadAdminData();
        } else {
            window.location.href = 'login.html';
        }
    }

    // Gestion des formulaires de contact/newsletter
    const contactForms = document.querySelectorAll('form:not(#login-form):not(#register-form):not(#reservation-form)');
    contactForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Animation du bouton de soumission
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            submitButton.disabled = true;

            try {
                // Simuler un délai pour l'animation
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Réinitialiser le bouton
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;

                // Afficher un message de succès
                showSuccess('Votre message a été envoyé avec succès !');

                // Réinitialiser le formulaire
                form.reset();
            } catch (error) {
                // En cas d'erreur
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                showError('Une erreur est survenue. Veuillez réessayer.');
            }
        });
    });
});

// FONCTIONS D'API ET D'AUTHENTIFICATION

// Vérifier si l'utilisateur est connecté
function isUserLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

// Vérifier si l'utilisateur est admin
function isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
}

// Fonction pour gérer la connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    const originalText = loginButton.innerHTML;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion en cours...';
    loginButton.disabled = true;
    
    try {
        // Déterminer le type d'utilisateur à partir du formulaire
        const userType = document.querySelector('.tab-btn.active')?.dataset.type || 'patient';
        
        // Définir l'endpoint en fonction du type d'utilisateur
        const endpoint = userType === 'admin' 
            ? `${API_BASE_URL}/administrateurs/login` 
            : `${API_BASE_URL}/patients/login`;
        
        console.log(`Tentative de connexion en tant que ${userType} via ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                mot_de_passe: password,
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Échec de la connexion');
        }
        
        // Stocker le token et les informations utilisateur
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', userType);
        
        if (userType === 'admin') {
            localStorage.setItem('userName', data.nom_utilisateur);
            // Rediriger vers le panneau d'administration
            window.location.href = 'admin.html';
        } else {
            localStorage.setItem('userName', `${data.prenom} ${data.nom}`);
            
            // Rediriger vers la page appropriée
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');
            
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                // Rediriger vers le tableau de bord patient par défaut
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        loginButton.innerHTML = originalText;
        loginButton.disabled = false;
        showError(error.message || 'Échec de la connexion');
    }
}

// Fonction pour gérer l'inscription (pour les patients)
async function handleRegister(event) {
    event.preventDefault();
    
    // Get form values
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const dateNaissance = document.getElementById('date_naissance').value;
    const sexeElement = document.querySelector('input[name="sexe"]:checked');
    const sexe = sexeElement ? sexeElement.value : null;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const typeMaladie = document.getElementById('type_maladie').value.trim();
    const hopital = document.getElementById('hopital').value.trim();
    
    // Check for missing required fields
    const missingFields = [];
    if (!nom) missingFields.push('Nom');
    if (!prenom) missingFields.push('Prénom');
    if (!dateNaissance) missingFields.push('Date de naissance');
    if (!sexe) missingFields.push('Sexe');
    if (!password) missingFields.push('Mot de passe');
    
    if (missingFields.length > 0) {
        showError(`Veuillez remplir les champs obligatoires : ${missingFields.join(', ')}`);
        return;
    }
    
    // Log the values to debug
    console.log('Registration form values:', { 
        nom, prenom, email, telephone, dateNaissance, 
        sexe, password, typeMaladie, hopital 
    });
    
    // Verify that passwords match
    if (password !== confirmPassword) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }
    
    // Validate date format (must be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateNaissance)) {
        showError('Le format de la date de naissance est incorrect. Utilisez le format AAAA-MM-JJ');
        return;
    }
    
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    const originalText = registerButton.innerHTML;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création du compte...';
    registerButton.disabled = true;
    
    const requestBody = {
        nom: nom,
        prenom: prenom,
        date_naissance: dateNaissance,
        sexe: sexe,
        telephone: telephone || null,
        email: email || null,
        type_maladie: typeMaladie || null,
        notes: hopital ? `Hôpital: ${hopital}` : null,
        password: password
    };
    
    console.log('Registration request body:', requestBody);
    
    try {
        // Créer le patient
        const patientResponse = await fetch(`${API_BASE_URL}/utilisateurs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });
        
        const responseData = await patientResponse.json();
        console.log('Registration response:', responseData);
        
        if (!patientResponse.ok) {
            console.error('Registration error:', responseData);
            throw new Error(responseData.message || 'Échec de la création du compte');
        }
        
        // Se connecter avec les identifiants créés
        const loginResponse = await fetch(`${API_BASE_URL}/utilisateurs/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                mot_de_passe: password
            }),
        });
        
        if (!loginResponse.ok) {
            throw new Error('Compte créé, mais échec de la connexion. Veuillez vous connecter manuellement.');
        }
        
        const loginData = await loginResponse.json();
        
        // Stocker les informations d'authentification
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('userId', loginData.id);
        localStorage.setItem('userEmail', loginData.email);
        localStorage.setItem('userName', `${loginData.prenom} ${loginData.nom}`);
        localStorage.setItem('userRole', 'patient');
        
        // Afficher un message de succès et rediriger
        showSuccess('Compte créé avec succès !');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        registerButton.innerHTML = originalText;
        registerButton.disabled = false;
        showError(error.message || 'Échec de la création du compte');
    }
}

// Fonction pour gérer la déconnexion
function handleLogout(event) {
    event.preventDefault();
    
    // Supprimer les informations d'authentification
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    
    // Rediriger vers la page d'accueil
    window.location.href = 'index.html';
}

// Fonction pour afficher le formulaire de réservation
function showReservationForm() {
    const container = document.getElementById('reservation-container');
    container.innerHTML = `
        <div class="reservation-container">
            <h2 class="section-title">Réserver un hébergement</h2>
            <p class="section-subtitle">Remplissez le formulaire ci-dessous pour faire une demande de réservation</p>
            
            <form id="reservation-form" class="reservation-form">
                <div class="form-group">
                    <label for="date_arrivee">Date d'arrivée</label>
                    <input type="date" id="date_arrivee" name="date_arrivee" required>
                </div>
                
                <div class="form-group">
                    <label for="duree">Durée du séjour (en jours)</label>
                    <input type="number" id="duree" name="duree" min="1" required>
                </div>
                
                <div class="form-group">
                    <label for="type_maladie">Type de maladie</label>
                    <input type="text" id="type_maladie" name="type_maladie" required>
                </div>
                
                <div class="form-group">
                    <label for="hopital">Hôpital</label>
                    <input type="text" id="hopital" name="hopital" required>
                </div>
                
                <div class="form-group">
                    <label for="nb_accompagnateurs">Nombre d'accompagnateurs</label>
                    <input type="number" id="nb_accompagnateurs" name="nb_accompagnateurs" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="notes">Notes supplémentaires</label>
                    <textarea id="notes" name="notes" rows="4"></textarea>
                </div>
                
                <button type="submit" class="btn-primary">
                    <i class="fas fa-paper-plane"></i> Envoyer la demande
                </button>
            </form>
        </div>
    `;

    // Ajouter l'écouteur d'événements pour le formulaire
    document.getElementById('reservation-form').addEventListener('submit', handleReservationSubmit);
}

// Fonction pour afficher le message de connexion requise
function showLoginRequired() {
    const container = document.getElementById('reservation-container');
    container.innerHTML = `
        <div class="auth-message">
            <h2 class="section-title">Connexion requise</h2>
            <p class="section-subtitle">Vous devez être connecté pour effectuer une réservation.</p>
            <div class="auth-buttons">
                <a href="login.html" class="btn-primary">
                    <i class="fas fa-sign-in-alt"></i> Se connecter
                </a>
                <a href="register.html" class="btn-secondary">
                    <i class="fas fa-user-plus"></i> Créer un compte
                </a>
            </div>
        </div>
    `;
}

// Fonction pour gérer la soumission d'une réservation
async function handleReservationSubmit(event) {
    event.preventDefault();
    
    if (!isUserLoggedIn()) {
        showLoginRequired();
        return;
    }
    
    const dateArrivee = document.getElementById('date_arrivee').value;
    const duree = parseInt(document.getElementById('duree').value);
    const typeMaladie = document.getElementById('type_maladie').value;
    const hopital = document.getElementById('hopital').value;
    const nbAccompagnateurs = parseInt(document.getElementById('nb_accompagnateurs').value);
    const notes = document.getElementById('notes').value;
    
    // Calculer la date de fin
    const dateDebut = new Date(dateArrivee);
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + duree);
    
    const submitButton = document.querySelector('#reservation-form button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitButton.disabled = true;
    
    try {
        // Récupérer un lit disponible (dans une vraie application, l'admin assignerait un lit)
        const litsResponse = await fetch(`${API_BASE_URL}/lits/disponibles`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        const lits = await litsResponse.json();
        
        if (!lits.length) {
            throw new Error('Aucun lit disponible pour le moment');
        }
        
        // Créer la réservation
        const reservationResponse = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
                patient_id: localStorage.getItem('userId'),
                lit_id: lits[0].id,
                date_debut: dateDebut.toISOString().split('T')[0],
                date_fin: dateFin.toISOString().split('T')[0],
                statut: 'en_attente',
                notes: `Hôpital: ${hopital}, ${notes}`,
            }),
        });
        
        if (!reservationResponse.ok) {
            throw new Error('Échec de la création de la réservation');
        }
        
        const reservation = await reservationResponse.json();
        
        // Ajouter les accompagnateurs si nécessaire
        if (nbAccompagnateurs > 0) {
            for (let i = 0; i < nbAccompagnateurs; i++) {
                await fetch(`${API_BASE_URL}/accompagnateurs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: JSON.stringify({
                        nom: `Accompagnateur ${i+1}`,
                        prenom: '',
                        relation: 'Non spécifié',
                        reservation_id: reservation.id,
                    }),
                });
            }
        }
        
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Afficher un message de succès
        showSuccess('Votre demande de réservation a été envoyée avec succès');
        
        // Rediriger vers le tableau de bord après 2 secondes
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } catch (error) {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        showError(error.message || 'Erreur lors de la réservation');
    }
}

// Fonction pour charger les données du tableau de bord admin
async function loadAdminData() {
    try {
        await Promise.all([
            loadReservations(),
            loadPatients(),
            loadBatiments(),
        ]);
    } catch (error) {
        showError('Erreur lors du chargement des données');
    }
}

// Fonction pour charger les réservations dans l'admin
async function loadReservations() {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des réservations');
        }
        
        const reservations = await response.json();
        updateReservationsTable(reservations);
    } catch (error) {
        showError('Erreur lors du chargement des réservations');
    }
}

// Fonction pour charger les patients dans l'admin
async function loadPatients() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des patients');
        }
        
        const patients = await response.json();
        updatePatientsTable(patients);
    } catch (error) {
        showError('Erreur lors du chargement des patients');
    }
}

// Fonction pour charger les bâtiments dans l'admin
async function loadBatiments() {
    try {
        const response = await fetch(`${API_BASE_URL}/batiments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des bâtiments');
        }
        
        const batiments = await response.json();
        updateBatimentsTable(batiments);
    } catch (error) {
        showError('Erreur lors du chargement des bâtiments');
    }
}

// Fonction pour charger les informations de l'utilisateur
async function loadUserInfo() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/patients/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des informations utilisateur');
        }
        
        const user = await response.json();
        
        // Mettre à jour les informations utilisateur
        document.getElementById('user-name').textContent = `${user.prenom} ${user.nom}`;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-phone').textContent = user.telephone || '-';
    } catch (error) {
        showError('Erreur lors du chargement des informations utilisateur');
    }
}

// Fonction pour charger les réservations de l'utilisateur
async function loadUserReservations() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE_URL}/patients/${userId}/reservations`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des réservations');
        }
        
        const reservations = await response.json();
        
        // Get additional details for each reservation (bed, room, building)
        const enhancedReservations = await Promise.all(
            reservations.map(async (reservation) => {
                try {
                    // Get bed details
                    const bedResponse = await fetch(`${API_BASE_URL}/lits/${reservation.lit_id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        },
                    });
                    
                    if (bedResponse.ok) {
                        const bedData = await bedResponse.json();
                        
                        // Get room details
                        const roomResponse = await fetch(`${API_BASE_URL}/chambres/${bedData.chambre_id}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                            },
                        });
                        
                        if (roomResponse.ok) {
                            const roomData = await roomResponse.json();
                            
                            // Get building details
                            const buildingResponse = await fetch(`${API_BASE_URL}/batiments/${roomData.batiment_id}`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                },
                            });
                            
                            if (buildingResponse.ok) {
                                const buildingData = await buildingResponse.json();
                                
                                // Add all the details to the reservation object
                                return {
                                    ...reservation,
                                    bed_number: bedData.numero,
                                    room_number: roomData.numero,
                                    building_name: buildingData.nom,
                                    building_id: buildingData.id
                                };
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching details for reservation:', error);
                }
                
                // Return original reservation if any details fetch fails
                return reservation;
            })
        );
        
        updateUserReservationsTable(enhancedReservations);
    } catch (error) {
        showError('Erreur lors du chargement des réservations');
    }
}

// Fonction pour mettre à jour le tableau des réservations utilisateur
function updateUserReservationsTable(reservations) {
    const tableBody = document.querySelector('#reservations-table tbody');
    
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (reservations.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7" class="empty-message">
                    <i class="fas fa-info-circle"></i>
                    Aucune réservation trouvée
                </td>
            </tr>
        `;
        return;
    }
    
    // Filter to show only confirmed reservations
    const confirmedReservations = reservations.filter(
        reservation => reservation.statut === 'confirmee' || 
                       reservation.statut === 'confirmée' || 
                       reservation.statut === 'confirmed'
    );
    
    // Show a message if no confirmed reservations are found
    if (confirmedReservations.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7" class="empty-message">
                    <i class="fas fa-info-circle"></i>
                    Aucune réservation confirmée trouvée. Vos réservations seront visibles ici après confirmation par l'administration.
                </td>
            </tr>
        `;
        return;
    }
    
    // Show confirmed reservations
    confirmedReservations.forEach(reservation => {
        const row = document.createElement('tr');
        
        // Format dates
        const startDate = formatDate(reservation.date_debut);
        const endDate = formatDate(reservation.date_fin);
        
        // Calculate duration
        const dateDebut = new Date(reservation.date_debut);
        const dateFin = new Date(reservation.date_fin);
        const duree = Math.floor((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
        
        // Add reservation details to the table row
        row.innerHTML = `
            <td>${reservation.id}</td>
            <td>${reservation.building_name ? reservation.building_name : 'Bâtiment'} - Chambre ${reservation.room_number ? reservation.room_number : 'N/A'}</td>
            <td>Lit ${reservation.bed_number ? reservation.bed_number : 'N/A'}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>
                <span class="status-badge status-confirmed">
                    ${formatStatus(reservation.statut)}
                </span>
            </td>
            <td>
                <button class="btn-action view" data-id="${reservation.id}" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action cancel" data-id="${reservation.id}" title="Annuler">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to the view buttons
    document.querySelectorAll('#reservations-table .btn-action.view').forEach(button => {
        button.addEventListener('click', () => viewReservationDetails(button.dataset.id));
    });
    
    // Add event listeners to the cancel buttons
    document.querySelectorAll('#reservations-table .btn-action.cancel').forEach(button => {
        button.addEventListener('click', () => cancelReservation(button.dataset.id));
    });
}

// Fonction pour mettre à jour le tableau des réservations dans l'admin
function updateReservationsTable(reservations) {
    const tableBody = document.querySelector('#reservations-table tbody');
    
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (reservations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">Aucune réservation trouvée</td>
            </tr>
        `;
        return;
    }
    
    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        
        // Calculer la durée du séjour
        const dateDebut = new Date(reservation.date_debut);
        const dateFin = new Date(reservation.date_fin);
        const duree = Math.floor((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
        
        row.innerHTML = `
            <td>${reservation.id}</td>
            <td>${reservation.patient_nom} ${reservation.patient_prenom}</td>
            <td>${formatDate(reservation.date_debut)}</td>
            <td>${duree} jours</td>
            <td>${reservation.batiment_nom} - Chambre ${reservation.chambre_numero} - Lit ${reservation.lit_numero}</td>
            <td>${formatStatus(reservation.statut)}</td>
            <td>
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
        
        tableBody.appendChild(row);
    });
}

// Fonction pour mettre à jour le tableau des patients dans l'admin
function updatePatientsTable(patients) {
    const tableBody = document.querySelector('#patients-table tbody');
    
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (patients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">Aucun patient trouvé</td>
            </tr>
        `;
        return;
    }
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.nom} ${patient.prenom}</td>
            <td>${formatDate(patient.date_naissance)}</td>
            <td>${patient.sexe === 'M' ? 'Homme' : 'Femme'}</td>
            <td>${patient.telephone || '-'}</td>
            <td>${patient.email || '-'}</td>
            <td>
                <button class="btn-action edit" data-id="${patient.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action view" data-id="${patient.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action delete" data-id="${patient.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Fonction pour mettre à jour le tableau des bâtiments dans l'admin
function updateBatimentsTable(batiments) {
    const tableBody = document.querySelector('#batiments-table tbody');
    
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (batiments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">Aucun bâtiment trouvé</td>
            </tr>
        `;
        return;
    }
    
    batiments.forEach(batiment => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${batiment.id}</td>
            <td>${batiment.nom}</td>
            <td>${batiment.description || '-'}</td>
            <td>
                <button class="btn-action edit" data-id="${batiment.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action view" data-id="${batiment.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action delete" data-id="${batiment.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Fonction pour éditer une réservation (utilisateur)
async function editReservation(id) {
    // Dans un vrai système, cela ouvrirait un modal d'édition
    alert(`Édition de la réservation #${id}`);
}

// Fonction pour supprimer une réservation (utilisateur)
async function deleteReservation(id) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations/${id}/statut`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    statut: 'annulé',
                }),
            });
            
            if (!response.ok) {
                throw new Error('Échec de l\'annulation de la réservation');
            }
            
            showSuccess('Réservation annulée avec succès');
            loadUserReservations();
        } catch (error) {
            showError(error.message || 'Erreur lors de l\'annulation de la réservation');
        }
    }
}

// Fonction pour voir les détails d'une réservation
async function viewReservationDetails(id) {
    try {
        // Get reservation details
        const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Échec du chargement des détails de la réservation');
        }
        
        const reservation = await response.json();
        
        // Get bed details
        const bedResponse = await fetch(`${API_BASE_URL}/lits/${reservation.lit_id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        
        let bedDetails = { numero: 'N/A', chambre_id: null };
        if (bedResponse.ok) {
            bedDetails = await bedResponse.json();
        }
        
        // Get room details
        let roomDetails = { numero: 'N/A', batiment_id: null };
        if (bedDetails.chambre_id) {
            const roomResponse = await fetch(`${API_BASE_URL}/chambres/${bedDetails.chambre_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            
            if (roomResponse.ok) {
                roomDetails = await roomResponse.json();
            }
        }
        
        // Get building details
        let buildingDetails = { nom: 'Bâtiment' };
        if (roomDetails.batiment_id) {
            const buildingResponse = await fetch(`${API_BASE_URL}/batiments/${roomDetails.batiment_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            
            if (buildingResponse.ok) {
                buildingDetails = await buildingResponse.json();
            }
        }
        
        // Create modal for viewing reservation details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'view-reservation-modal';
        
        // Format dates
        const startDate = formatDate(reservation.date_debut);
        const endDate = formatDate(reservation.date_fin);
        const creationDate = formatDate(reservation.date_creation);
        
        // Calculate duration
        const dateDebut = new Date(reservation.date_debut);
        const dateFin = new Date(reservation.date_fin);
        const duree = Math.floor((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Détails de la réservation #${reservation.id}</h2>
                
                <div class="detail-section">
                    <h3>Informations générales</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Statut</span>
                            <span class="detail-value">
                                <span class="status-badge status-confirmed">
                                    ${formatStatus(reservation.statut)}
                                </span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date de création</span>
                            <span class="detail-value">${creationDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Période</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Date d'arrivée</span>
                            <span class="detail-value">${startDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date de départ</span>
                            <span class="detail-value">${endDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Durée du séjour</span>
                            <span class="detail-value">${duree} jours</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Hébergement</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Bâtiment</span>
                            <span class="detail-value">${buildingDetails.nom}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Chambre</span>
                            <span class="detail-value">${roomDetails.numero}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Lit</span>
                            <span class="detail-value">${bedDetails.numero}</span>
                        </div>
                    </div>
                </div>
                
                ${reservation.notes ? `
                <div class="detail-section">
                    <h3>Notes</h3>
                    <div class="detail-notes">
                        ${reservation.notes}
                    </div>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="btn-secondary close-btn">Fermer</button>
                    <button class="btn-danger cancel-btn" data-id="${reservation.id}">
                        <i class="fas fa-times"></i> Annuler la réservation
                    </button>
                </div>
            </div>
        `;
        
        // Append modal to body
        document.body.appendChild(modal);
        
        // Set up event listeners
        modal.querySelector('.close-modal').addEventListener('click', function() {
            modal.remove();
        });
        
        modal.querySelector('.close-btn').addEventListener('click', function() {
            modal.remove();
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', function() {
            const id = this.dataset.id;
            modal.remove();
            cancelReservation(id);
        });
        
        // Show modal
        modal.style.display = 'block';
    } catch (error) {
        showError('Erreur lors du chargement des détails de la réservation');
    }
}

// Fonction pour annuler une réservation
async function cancelReservation(id) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            
            if (!response.ok) {
                throw new Error('Échec de l\'annulation de la réservation');
            }
            
            showSuccess('Réservation annulée avec succès');
            
            // Reload reservations after cancelation
            loadUserReservations();
        } catch (error) {
            showError('Erreur lors de l\'annulation de la réservation');
        }
    }
}

// Formater une date pour l'affichage
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Formater le statut d'une réservation
function formatStatus(status) {
    const statusClasses = {
        'en_attente': 'status-pending',
        'confirmé': 'status-confirmed',
        'en_cours': 'status-in-progress',
        'terminé': 'status-completed',
        'annulé': 'status-canceled',
    };
    
    const statusLabels = {
        'en_attente': 'En attente',
        'confirmé': 'Confirmé',
        'en_cours': 'En cours',
        'terminé': 'Terminé',
        'annulé': 'Annulé',
    };
    
    return `<span class="status ${statusClasses[status] || ''}">${statusLabels[status] || status}</span>`;
}

// Afficher un message de succès
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 3000);
}

// Afficher un message d'erreur
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 3000);
} 