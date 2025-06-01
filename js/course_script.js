document.addEventListener("DOMContentLoaded", async function () {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'index.html';
                return;
            }

            const courseMainTitleElement = document.getElementById("courseMainTitle");
            const courseCardCountElement = document.getElementById("courseCardCount");
            const flashcardsListArea = document.getElementById("flashcards-list-area");
            const filterButtons = document.querySelectorAll(".filter-button");
            const addCardsButton = document.getElementById("addCardsButton");
            const studyDeckButton = document.getElementById("studyDeckButton");
            const currentUserElement = document.getElementById("current-user");
            const logoutButton = document.getElementById("logout-button");
            
            function displayUsername() {
                const currentUserElement = document.getElementById('current-user');
                if (!currentUserElement) {
                    console.error('Current user element not found');
                    return;
                }

                if (token) {
                    try {
                        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                        console.log('Token payload:', tokenPayload); // Debug
                        if (tokenPayload.username) {
                            currentUserElement.textContent = `Hello, ${tokenPayload.username}!`;
                            console.log('Username set to:', `Hello, ${tokenPayload.username}!`); 
                        } else if (tokenPayload.user && tokenPayload.user.username) {
                            currentUserElement.textContent = `Hello, ${tokenPayload.user.username}!`;
                            console.log('Username set to:', `Hello, ${tokenPayload.user.username}!`); 
                            console.error('Username not found in token payload');
                            currentUserElement.textContent = 'Hello, User!';
                        }
                    } catch (error) {
                        console.error('Error parsing token:', error);
                        currentUserElement.textContent = 'Hello, User!';
                    }
                } else {
                    console.error('No token found');
                    currentUserElement.textContent = 'Hello, User!';
                }
            }
            
            setTimeout(displayUsername, 100);

            const deckIdToStudy = localStorage.getItem("currentDeckIdToStudy");
            let currentDeckData = { deckId: null, title: "Deck Not Found", name: "Deck Not Found", flashcards: [] }; 
            
            function showNotification(message, type = 'success') {
                const notificationArea = document.getElementById('notification-area');
                if (!notificationArea) {
                    console.error('Notification area not found');
                    return;
                }
                
                const alertElement = notificationArea.querySelector('.alert');
                if (!alertElement) {
                    console.error('Alert element not found in notification area');
                    return;
                }
                
                alertElement.textContent = message;
                alertElement.className = 'alert';
                
                if (type === 'success') {
                    alertElement.classList.add('alert-success');
                } else if (type === 'error') {
                    alertElement.classList.add('alert-danger');
                } else if (type === 'info') {
                    alertElement.classList.add('alert-info');
                }
                
                notificationArea.style.display = 'block';
                
                setTimeout(() => {
                    notificationArea.style.display = 'none';
                }, 3000);
            }
            
            try {
                const allDecksData = await api.decks.getAllDecks();
                console.log('All decks data from API:', allDecksData);
                
                let decksArray = [];
                
                if (Array.isArray(allDecksData)) {
                    decksArray = allDecksData;
                } else if (allDecksData && typeof allDecksData === 'object') {
                    if (Array.isArray(allDecksData.decks)) {
                        decksArray = allDecksData.decks;
                    } else if (Object.keys(allDecksData).length > 0) {
                       
                        decksArray = Object.values(allDecksData);
                    }
                }
                
                console.log('Normalized decks array:', decksArray);
                
                if (decksArray.length === 0) {
                    console.warn('No decks found in the response');
                    showNotification('No decks found. Please create a deck first.', 'info');
                }
                
                if (deckIdToStudy) {
                    console.log('Looking for deck with ID:', deckIdToStudy);
                    
                    const foundDeck = decksArray.find(deck => deck.deckId === deckIdToStudy);
                    console.log('Found deck:', foundDeck);
                    
                    if (foundDeck) {
                        currentDeckData = {
                            ...foundDeck,
                            title: foundDeck.title || foundDeck.name || 'Untitled Deck',
                            name: foundDeck.name || foundDeck.title || 'Untitled Deck'
                        };
                        console.log('Normalized deck data:', currentDeckData);
                    } else {
                        console.log('Deck not found, using first available deck');
                        if (decksArray.length > 0) {
                            const firstDeck = decksArray[0];
                            currentDeckData = {
                                ...firstDeck,
                                title: firstDeck.title || firstDeck.name || 'Untitled Deck',
                                name: firstDeck.name || firstDeck.title || 'Untitled Deck'
                            };
                            console.log('Using first deck with normalized data:', currentDeckData);
                            localStorage.setItem("currentDeckIdToStudy", currentDeckData.deckId);
                        }
                    }
                } else if (decksArray.length > 0) { 
                    const firstDeck = decksArray[0];
                    currentDeckData = {
                        ...firstDeck,
                        title: firstDeck.title || firstDeck.name || 'Untitled Deck',
                        name: firstDeck.name || firstDeck.title || 'Untitled Deck'
                    };
                    console.log('No deck ID in localStorage, using first deck with normalized data:', currentDeckData);
                    localStorage.setItem("currentDeckIdToStudy", currentDeckData.deckId);
                }
                
                console.log('Current deck data to use:', currentDeckData);
            } catch (error) {
                console.error('Error fetching decks:', error);
                if (error.toString().includes('authorization') || error.toString().includes('token')) {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                }
            }
            
            if (courseMainTitleElement) {
                courseMainTitleElement.textContent = currentDeckData.title || currentDeckData.name || "Untitled Deck";
                console.log('Setting course title to:', courseMainTitleElement.textContent);
            }
            if (courseCardCountElement) {
                const cardCount = currentDeckData.flashcards ? currentDeckData.flashcards.length : 0;
                courseCardCountElement.textContent = `Flashcards: ${cardCount}`;
            }

            if (addCardsButton) {
                addCardsButton.addEventListener('click', function() {
                    if (currentDeckData && currentDeckData.deckId) {
                        localStorage.setItem('deckIdToEdit', currentDeckData.deckId);
                        window.location.href = 'flashcard2.html';
                    } else {
                        alert("Cannot determine which deck to add cards to. Please go to library and select a deck first.");
                    }
                });
            }

            if (studyDeckButton) {
                studyDeckButton.addEventListener('click', function() {
                     if (currentDeckData && currentDeckData.deckId && currentDeckData.flashcards && currentDeckData.flashcards.length > 0) {
                        window.location.href = 'cards.html';
                    } else if (currentDeckData.flashcards && currentDeckData.flashcards.length === 0) {
                        alert("This deck has no cards to study. Please add some cards first.");
                    } else {
                         alert("Cannot determine which deck to study. Please go to library and select a deck first.");
                    }
                });
            }


            function renderFlashcards(filter = "all") {
                flashcardsListArea.innerHTML = ''; 
                let cardsToDisplay = currentDeckData.flashcards || [];
                let filteredCards = [];

                if (filter === "all") {
                    filteredCards = cardsToDisplay;
                } else if (filter === "new") {
                    filteredCards = cardsToDisplay.filter(card => !card.status || card.status === 'new');
                } else if (filter === "learning") {
                    filteredCards = cardsToDisplay.filter(card => card.status === 'learning');
                } else if (filter === "mastered") {
                    filteredCards = cardsToDisplay.filter(card => card.status === 'mastered');
                }


                if (filteredCards.length === 0) {
                    let message = "No flashcards in this deck.";
                    if (filter !== "all" && cardsToDisplay.length > 0) { 
                        message = `No flashcards in this deck matching the '${filter}' filter.`;
                    } else if (cardsToDisplay.length === 0) { 
                         message = `No flashcards in this deck. Add some cards!`;
                    }
                    flashcardsListArea.innerHTML = `<p class="no-cards-message">${message}</p>`;
                    return;
                }

                filteredCards.forEach(card => {
                    const cardItemDiv = document.createElement("div");
                    cardItemDiv.classList.add("flashcard-list-item");

                    let statusText = 'New';
                    let statusBadgeClass = 'bg-info'; 

                    if (card.status === 'learning') {
                        statusText = 'Learning';
                        statusBadgeClass = 'bg-warning text-dark'; 
                    } else if (card.status === 'mastered') {
                        statusText = 'Mastered';
                        statusBadgeClass = 'bg-success';
                    } else if (card.status === 'new') { 
                        statusText = 'New';
                        statusBadgeClass = 'bg-info';
                    }
            
                    const statusIndicator = `<span class="badge ${statusBadgeClass} flashcard-status-badge">${statusText}</span>`;

                    cardItemDiv.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="question-section flex-grow-1">
                                <strong>Question:</strong>
                                <p>${card.question || "N/A"}</p>
                            </div>
                            <div class="status-section ms-2">
                                ${statusIndicator}
                            </div>
                        </div>
                        <hr>
                        <div class="answer-section">
                            <strong>Answer:</strong>
                            <p>${card.answer || "N/A"}</p>
                        </div>
                    `;
                    flashcardsListArea.appendChild(cardItemDiv);
                });
            }

            filterButtons.forEach(button => {
                button.addEventListener("click", function(event) {
                    event.preventDefault();
                    filterButtons.forEach(btn => btn.classList.remove("active"));
                    this.classList.add("active");
                    const filterType = this.getAttribute("data-tab-filter");
                    renderFlashcards(filterType);
                });
            });

            renderFlashcards("all"); 

            // Display current user's username
            if (currentUserElement) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        if (payload && payload.username) {
                            currentUserElement.textContent = `Welcome, ${payload.username}`;
                            currentUserElement.style.color = '#fff';
                            currentUserElement.style.fontWeight = 'bold';
                        }
                    } catch (error) {
                        console.error('Error parsing JWT token:', error);
                    }
                } else {
                    window.location.href = 'index.html';
                }
            }

            if (logoutButton) {
                logoutButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                });
            }
        });