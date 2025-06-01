document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const flashcardContainer = document.getElementById("flashcard-container");
    const progressTracker = document.getElementById("progress-tracker");
    const progressBar = document.getElementById("flashcard-progress-bar");
    const progressContainerElement = document.querySelector('.progress-container');
    const deckDisplayTitleElement = document.getElementById("deckDisplayTitle");
    const studyButtonsContainer = document.querySelector('.study-buttons');
    const currentUserElement = document.getElementById("current-user");
    const logoutButton = document.getElementById("logout-button");

    const deckIdToStudy = localStorage.getItem("currentDeckIdToStudy");
    let currentDeck = { deckId: null, name: "Deck Not Found", flashcards: [] };
    
    try {
        const allDecksData = await api.decks.getAllDecks();
        
        if (deckIdToStudy) {
            const foundDeck = allDecksData.find(deck => deck.deckId === deckIdToStudy);
            if (foundDeck) {
                currentDeck = foundDeck;
            }
        } else if (allDecksData.length > 0) { 
            currentDeck = allDecksData[0]; 
            if(currentDeck.deckId) localStorage.setItem("currentDeckIdToStudy", currentDeck.deckId); 
        }
    } catch (error) {
        console.error('Error fetching decks:', error);
        if (error.toString().includes('authorization') || error.toString().includes('token')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    }
    
    currentDeck.flashcards = currentDeck.flashcards || []; 
    const currentDeckFlashcards = currentDeck.flashcards; 
    const totalCards = currentDeckFlashcards.length;

    if (deckDisplayTitleElement) {
        deckDisplayTitleElement.textContent = currentDeck.name || "Deck Title";
    }

    
    if (totalCards === 0) {
        flashcardContainer.innerHTML = `<div class="carousel-item active"><div class="text-center p-5 display-6 text-muted">No flashcards in this deck.</div></div>`;
        progressTracker.textContent = "0/0";
        if (progressBar) {
            progressBar.style.transform = "scaleX(0)"; 
            if(progressBar.parentElement) progressBar.parentElement.setAttribute("aria-valuenow", "0");
        }
        document.querySelector('.carousel-control-prev')?.classList.add('d-none');
        document.querySelector('.carousel-control-next')?.classList.add('d-none');
        if (progressContainerElement) progressContainerElement.classList.add('d-none');
        if (studyButtonsContainer) studyButtonsContainer.classList.add('d-none');
        return; 
    } else {
        
        document.querySelector('.carousel-control-prev')?.classList.remove('d-none');
        document.querySelector('.carousel-control-next')?.classList.remove('d-none');
        if (progressContainerElement) progressContainerElement.classList.remove('d-none');
        if (studyButtonsContainer) studyButtonsContainer.classList.remove('d-none');
    }

    
    currentDeckFlashcards.forEach((card, index) => {
        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item");
        carouselItem.setAttribute('data-card-index', index); 
        if (index === 0) {
            carouselItem.classList.add("active");
        }

        carouselItem.innerHTML = `
            <div class="container p-4 d-flex justify-content-center align-items-center">
                <div class="card mx-auto">
                    <div class="card-face card-front">
                        <p class="fw-bold">${card.question || "N/A"}</p>
                    </div>
                    <div class="card-face card-back">
                        <p>${card.answer || "N/A"}</p>
                    </div>
                </div>
            </div>
        `;
        flashcardContainer.appendChild(carouselItem);

        const cardElement = carouselItem.querySelector('.card');
        if (cardElement) {
            cardElement.addEventListener("click", function () {
                this.classList.toggle("clicked");
            });
        }
    });

    function updateProgress() {
        const activeItem = document.querySelector("#flashcardCarousel .carousel-item.active");
        let currentProgressPercent = 0;
        let activeDomIndex = 0;

        if (activeItem && totalCards > 0) {
            const allItems = Array.from(flashcardContainer.querySelectorAll(".carousel-item"));
            activeDomIndex = allItems.indexOf(activeItem); 
            progressTracker.textContent = `${activeDomIndex + 1}/${totalCards}`;
            currentProgressPercent = ((activeDomIndex + 1) / totalCards) * 100;
            
            if (activeDomIndex === totalCards - 1) {
                showCompletionMessage();
            } else {
                hideCompletionMessage();
            }
        } else if (totalCards === 0) {
            progressTracker.textContent = "0/0";
        }
            
        if (progressBar) {
            progressBar.style.transform = `scaleX(${currentProgressPercent / 100})`; 
            if(progressBar.parentElement) progressBar.parentElement.setAttribute("aria-valuenow", currentProgressPercent.toFixed(0));
        }
    }

    updateProgress();

    const carouselElement = document.getElementById("flashcardCarousel");
    if (carouselElement) {
            carouselElement.addEventListener("slid.bs.carousel", updateProgress);
    }
    
    const difficultButton = document.querySelector('.diff-button');
    const easyButton = document.querySelector('.easy-button');

    async function handleCardStatusUpdate(newStatus) {
        const activeItem = document.querySelector("#flashcardCarousel .carousel-item.active");
        if (!activeItem) {
            console.warn("No active carousel item found for status update.");
            return;
        }

        const cardIndexToUpdate = parseInt(activeItem.getAttribute('data-card-index'), 10);

        if (isNaN(cardIndexToUpdate) || cardIndexToUpdate < 0 || cardIndexToUpdate >= currentDeckFlashcards.length) {
            console.error("Invalid card index obtained from active item:", cardIndexToUpdate, "Max index:", currentDeckFlashcards.length -1);
            return;
        }
        
        currentDeckFlashcards[cardIndexToUpdate].status = newStatus;

        try {
            if (currentDeck.deckId) {
                await api.decks.updateDeck(currentDeck.deckId, currentDeck);
                console.log(`Card at index ${cardIndexToUpdate} (Deck ID: ${currentDeck.deckId}) marked as ${newStatus}. Data saved via API.`);
                
                const buttonClicked = (newStatus === 'learning') ? difficultButton : easyButton;
                if(buttonClicked){
                    const originalText = buttonClicked.textContent;
                    buttonClicked.textContent = "Marked!";
                    setTimeout(() => {
                        buttonClicked.textContent = originalText;
                    }, 1500); 
                }
            } else {
                throw new Error('Missing deck ID');
            }
        } catch (error) {
            console.error(`Error updating card status: ${error}`);
            alert("Failed to save card status. Please check your connection and try again.");
        }
    }

    if (difficultButton) {
        difficultButton.addEventListener('click', async function(event) {
            event.stopPropagation();
            await handleCardStatusUpdate('learning');
        });
    }

    if (easyButton) {
        easyButton.addEventListener('click', async function(event) {
            event.stopPropagation();
            await handleCardStatusUpdate('mastered');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

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
                    console.log('Username set to:', `Hello, ${tokenPayload.username}!`); // Debug
                } else if (tokenPayload.user && tokenPayload.user.username) {
                    currentUserElement.textContent = `Hello, ${tokenPayload.user.username}!`;
                    console.log('Username set to:', `Hello, ${tokenPayload.user.username}!`); // Debug
                } else {
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
    
    function showCompletionMessage() {
        let completionMessage = document.getElementById('completion-message');
        if (!completionMessage) {
            completionMessage = document.createElement('div');
            completionMessage.id = 'completion-message';
            completionMessage.className = 'text-center mt-4 mb-3';
            completionMessage.innerHTML = `
                <h3 class="text-success">You have completed "${currentDeck.title}"!</h3>
            `;
            
            const studyButtonsContainer = document.querySelector('.study-buttons');
            if (studyButtonsContainer) {
                studyButtonsContainer.parentNode.insertBefore(completionMessage, studyButtonsContainer);
            }
        } else {
            completionMessage.style.display = 'block';
        }
        
        let finishButton = document.getElementById('finish-button');
        if (!finishButton) {
            finishButton = document.createElement('button');
            finishButton.id = 'finish-button';
            finishButton.className = 'btn btn-success mt-2';
            finishButton.textContent = 'Finish';
            finishButton.addEventListener('click', function() {
                window.location.href = 'library.html';
            });
            
            const studyButtonsContainer = document.querySelector('.study-buttons');
            if (studyButtonsContainer) {
                studyButtonsContainer.appendChild(document.createElement('br'));
                studyButtonsContainer.appendChild(document.createElement('br'));
                studyButtonsContainer.appendChild(finishButton);
            }
        } else {
            finishButton.style.display = 'inline-block';
        }
    }
    
    function hideCompletionMessage() {
        const completionMessage = document.getElementById('completion-message');
        if (completionMessage) {
            completionMessage.style.display = 'none';
        }
        
        const finishButton = document.getElementById('finish-button');
        if (finishButton) {
            finishButton.style.display = 'none';
        }
    }
});