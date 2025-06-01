document.addEventListener("DOMContentLoaded", async function () {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'index.html';
                return;
            }
            const addCardButton = document.getElementById("add-card");
            const createButton = document.getElementById("create");
            const mainContainer = document.getElementById("main-flashcard-container");
            const deckTitleInputElement = document.getElementById("deckTitleInput");
            const initialCardFormElement = document.getElementById("initial-card-form");
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
                        console.log('Token payload:', tokenPayload); 
                        
                        if (tokenPayload.username) {
                            currentUserElement.textContent = `Hello, ${tokenPayload.username}!`;
                            console.log('Username set to:', `Hello, ${tokenPayload.username}!`);
                        } else if (tokenPayload.user && tokenPayload.user.username) {
                            currentUserElement.textContent = `Hello, ${tokenPayload.user.username}!`;
                            console.log('Username set to:', `Hello, ${tokenPayload.user.username}!`); 
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
    
            let dynamicFlashcardForms = []; 
            let editingDeckId = null;

            function generateDeckId() {
                return Date.now().toString(36) + Math.random().toString(36).substring(2);
            }
    
           
            function showNotification(message, type = 'success') {
                const notificationArea = document.getElementById('notification-area');
                const alertElement = notificationArea.querySelector('.alert');
                
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
            
            async function saveDeckToLibrary() {
                try {
                    const deckTitleInput = document.getElementById('deckTitleInput');
                    if (deckTitleInput) {
                        deckTitleInput.value = deckToLoad.title || deckToLoad.name || '';
                        console.log('Setting deck title input to:', deckTitleInput.value);
                    } else {
                        console.error('Deck title input not found');
                    }

                    const deckName = deckTitleInputElement.value.trim();
                    if (!deckName) {
                        showNotification("Please enter a Deck Title.", "error");
                        deckTitleInputElement.focus();
                        return false;
                    }

                    let currentDeckData = {
                        deckId: editingDeckId || generateDeckId(),
                        name: deckName,
                        flashcards: []
                    };
        
                    const firstQuestionInput = document.getElementById("question");
                    const firstAnswerInput = document.getElementById("answer");
                    if (initialCardFormElement && firstQuestionInput && firstAnswerInput) { 
                        const firstQuestion = firstQuestionInput.value.trim();
                        const firstAnswer = firstAnswerInput.value.trim();
                        if (firstQuestion || firstAnswer || (dynamicFlashcardForms.length === 0 && !firstQuestion && !firstAnswer)) {
                             currentDeckData.flashcards.push({ question: firstQuestion, answer: firstAnswer });
                        }
                    }
        
                    dynamicFlashcardForms.forEach(formEl => {
                        const question = formEl.querySelector(".question").value.trim();
                        const answer = formEl.querySelector(".answer").value.trim();
                        if (question || answer) { 
                            currentDeckData.flashcards.push({ question, answer });
                        }
                    });
                    
                    console.log('Saving deck with data:', currentDeckData);
                    
                    if (editingDeckId) {
                        const updateResult = await api.decks.updateDeck(editingDeckId, currentDeckData);
                        console.log('Update deck result:', updateResult);
                        
                        if (updateResult && updateResult.error) {
                            throw new Error(updateResult.error);
                        }
                    } else {
                        const result = await api.decks.createDeck(currentDeckData);
                        console.log('Create deck result:', result);
                        
                        if (result && result.error) {
                            throw new Error(result.error);
                        }
                        
                        if (result && result.deckId) {
                            editingDeckId = result.deckId;
                        } else if (result && result.id) {
                            editingDeckId = result.id;
                        }
                    }
                    
                    showNotification("Deck saved successfully!", "success");
                    return true;
                } catch (error) {
                    console.error('Error saving deck:', error);
                    showNotification('Failed to save deck. Please check your connection and try again.', 'error');
                    return false;
                }
            }
    
            function createFlashcardForm(question = "", answer = "") {
                const newFlashcardForm = document.createElement("div");
                newFlashcardForm.classList.add("flashcardform", "mt-3"); 
    
                newFlashcardForm.innerHTML = `
                    <button class="deletebutton">
                        <i class='fa fa-window-close' style="color: #ffffff"></i>
                    </button>
                    <div class="row">
                        <div class="col">
                            <input type="text" class="question form-control" placeholder="Enter Question" value="${question}">
                            <p>Front</p>
                        </div>
                        <div class="col">
                            <input type="text" class="answer form-control" placeholder="Enter Answer" value="${answer}">
                            <p>Back</p>
                        </div>
                    </div>
                `;
    
                newFlashcardForm.querySelector(".deletebutton").addEventListener("click", function () {
                    dynamicFlashcardForms = dynamicFlashcardForms.filter(f => f !== newFlashcardForm); 
                    newFlashcardForm.remove();
                });
    
                dynamicFlashcardForms.push(newFlashcardForm); 
                const allForms = mainContainer.querySelectorAll('.flashcardform');
                const lastForm = allForms[allForms.length - 1] || initialCardFormElement;
                if (lastForm) {
                    lastForm.insertAdjacentElement('afterend', newFlashcardForm);
                } else { 
                    mainContainer.appendChild(newFlashcardForm);
                }
            }

            if (deckTitleInputElement) {
            }
            
            if (initialCardFormElement) {
                const initialQuestionInput = document.getElementById("question");
                const initialAnswerInput = document.getElementById("answer");
                const initialDeleteButton = document.getElementById("delete-card");
                if (initialDeleteButton) {
                    initialDeleteButton.addEventListener("click", function () {
                        if(initialQuestionInput) initialQuestionInput.value = "";
                        if(initialAnswerInput) initialAnswerInput.value = "";
                        showNotification("Initial card content cleared.", "info");
                    });
                }
            }
    
            addCardButton.addEventListener("click", function () {
                createFlashcardForm();
            });
    
            createButton.addEventListener("click", async function () {
                console.log('Create button clicked');
                
                const currentTitle = deckTitleInputElement.value.trim();
                console.log('Current deck title:', currentTitle);
                
                if (!currentTitle) {
                    showNotification("Please enter a Deck Title.", "error");
                    deckTitleInputElement.focus();
                    return;
                }

               
                let flashcards = [];
                const firstQuestionInput = document.getElementById("question");
                const firstAnswerInput = document.getElementById("answer");
                
               
                let existingCards = [];
                if (editingDeckId) {
                    try {
                        const existingDeck = await api.decks.getDeck(editingDeckId);
                        if (existingDeck && existingDeck.flashcards) {
                            existingCards = existingDeck.flashcards;
                        }
                    } catch (error) {
                        console.error('Error getting existing cards:', error);
                    }
                }
                
                if (initialCardFormElement && firstQuestionInput && firstAnswerInput) {
                    const firstQuestion = firstQuestionInput.value.trim();
                    const firstAnswer = firstAnswerInput.value.trim();
                    if (firstQuestion || firstAnswer) {
                        const existingCard = existingCards.length > 0 ? existingCards[0] : null;
                        const status = existingCard && existingCard.status ? existingCard.status : 'new';
                        flashcards.push({ question: firstQuestion, answer: firstAnswer, status });
                    }
                }

                let cardIndex = 1; 
                dynamicFlashcardForms.forEach(formEl => {
                    const question = formEl.querySelector(".question").value.trim();
                    const answer = formEl.querySelector(".answer").value.trim();
                    if (question || answer) {
                        // Try to find matching card in existing cards to preserve status
                        const existingCard = existingCards.length > cardIndex ? existingCards[cardIndex] : null;
                        const status = existingCard && existingCard.status ? existingCard.status : 'new';
                        flashcards.push({ question, answer, status });
                        cardIndex++;
                    }
                });

                console.log('Collected flashcards:', flashcards);
                
                const hasContent = flashcards.some(card => card.question.trim() !== "" || card.answer.trim() !== "");
                
                if (flashcards.length === 0 || !hasContent) {
                    showNotification("Please add at least one flashcard with some content.", "error");
                    const firstQuestionInput = document.getElementById("question");
                    if (firstQuestionInput && !firstQuestionInput.value.trim()) {
                        firstQuestionInput.focus();
                    } else {
                        const firstEmptyDynamicQ = dynamicFlashcardForms.find(f => !f.querySelector('.question').value.trim());
                        if (firstEmptyDynamicQ) {
                            firstEmptyDynamicQ.querySelector('.question').focus();
                        }
                    }
                    return;
                }

            
                const deckData = {
                    deckId: editingDeckId || generateDeckId(),
                    title: String(currentTitle).trim(), 
                    flashcards: flashcards
                };
                
                console.log('Deck data to save:', deckData);
                
                try {
                   
                    if (editingDeckId) {
                        
                        console.log(`Updating deck with ID ${editingDeckId} and title '${deckData.name}'`);
                        const updateResult = await api.decks.updateDeck(editingDeckId, deckData);
                        console.log('Update deck result:', updateResult);
                        
                        if (updateResult && updateResult.error) {
                            throw new Error(updateResult.error);
                        }
                    } else {
                       
                        console.log(`Creating new deck with title '${deckData.name}'`);
                        const result = await api.decks.createDeck(deckData);
                        console.log('Create deck result:', result);
                        
                        if (result && result.error) {
                            throw new Error(result.error);
                        }
                    }
                    
                    showNotification("Deck saved successfully!", "success");
                    
                   
                    localStorage.removeItem("deckIdToEdit");
                    
                   
                    setTimeout(() => {
                        window.location.href = "library.html";
                    }, 1000); 
                } catch (error) {
                    console.error('Error saving deck:', error);
                    showNotification('Failed to save deck. Please check your connection and try again.', 'error');
                }
            });
            async function loadDeckForEditing() { 
                editingDeckId = localStorage.getItem("deckIdToEdit");
                let deckToLoad = { name: "", flashcards: [] };

                if (editingDeckId) {
                    try {
                        console.log('Fetching deck with ID:', editingDeckId);
                        const deckData = await api.decks.getDeck(editingDeckId);
                        console.log('Received deck data:', deckData);
                        
                        if (deckData && !deckData.error) {
                            deckToLoad = deckData;
                        } else {
                            console.log('Trying to find deck in all decks');
                            const allDecks = await api.decks.getAllDecks();
                            console.log('All decks:', allDecks);
                            
                           
                            let decksArray = [];
                            if (Array.isArray(allDecks)) {
                                decksArray = allDecks;
                            } else if (allDecks && allDecks.decks && Array.isArray(allDecks.decks)) {
                                decksArray = allDecks.decks;
                            }
                            
                            const foundDeck = decksArray.find(deck => deck.deckId === editingDeckId);
                            if (foundDeck) {
                                deckToLoad = foundDeck;
                            } else {
                                console.error('Deck not found with ID:', editingDeckId);
                                editingDeckId = null; 
                                localStorage.removeItem("deckIdToEdit");
                            }
                        }
                    } catch (error) {
                        console.error('Error loading deck for editing:', error);
                        alert('Failed to load deck. Please check your connection and try again.');
                        editingDeckId = null;
                        localStorage.removeItem("deckIdToEdit");
                    }
                }
    
                if (deckTitleInputElement) {
                    
                    deckTitleInputElement.value = deckToLoad.title || deckToLoad.name || "";
                    console.log('Setting deck title input to:', deckTitleInputElement.value);
                }
                
                dynamicFlashcardForms.forEach(formEl => formEl.remove());
                dynamicFlashcardForms = [];

                const initialQuestionInput = document.getElementById("question");
                const initialAnswerInput = document.getElementById("answer");

                if (deckToLoad.flashcards.length > 0) {
                    const firstCardData = deckToLoad.flashcards[0];
                    if (initialCardFormElement && initialQuestionInput && initialAnswerInput && firstCardData) {
                        initialQuestionInput.value = firstCardData.question || "";
                        initialAnswerInput.value = firstCardData.answer || "";
                    }
                    deckToLoad.flashcards.slice(1).forEach(card => {
                        createFlashcardForm(card.question, card.answer);
                    });
                } else {
                    if(initialQuestionInput) initialQuestionInput.value = "";
                    if(initialAnswerInput) initialAnswerInput.value = "";
                }
                 if (!editingDeckId) { 
                    return false;
                 }
                 return true;
            }
    
            (async () => {
                try {
                    await loadDeckForEditing();
                } catch (error) {
                    console.error('Error during initialization:', error);
                }
            })();

            
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