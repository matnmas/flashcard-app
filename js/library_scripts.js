document.addEventListener("DOMContentLoaded", async function () {
    const deckCardsContainer = document.getElementById("deck-cards-container");
    const navDecks = document.getElementById("navDecks");
    const navFolders = document.getElementById("navFolders");
    const backToFoldersBtn = document.getElementById("backToFoldersBtn");
    const libraryPageTitle = document.getElementById("libraryPageTitle");
    const currentUserElement = document.getElementById("current-user");
    const logoutButton = document.getElementById("logout-button");
    
    // Function to show notification
    function showNotification(message, type = 'success') {
        const notificationArea = document.getElementById('notification-area');
        if (!notificationArea) {
            console.warn('Notification area (#notification-area) not found. Cannot display notification:', message);
            alert(`${type.toUpperCase()}: ${message}`); 
            return;
        }
        
        const alertElement = notificationArea.querySelector('.alert');
        if (!alertElement) {
            console.warn('Alert element (.alert) within notification area not found. Cannot display notification:', message);
            alert(`${type.toUpperCase()}: ${message}`); 
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

    let currentViewRenderFunction = renderDecks;
    let currentFolderViewName = null;
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
    
    // Function to display username from token
    function displayUsername() {
        const currentUserElement = document.getElementById('current-user');
        if (!currentUserElement) {
            console.error('Current user element not found');
            return;
        }

        if (localStorage.getItem('token')) {
            const token = localStorage.getItem('token');
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

    async function getDecks() {
        try {
            const decksData = await api.decks.getAllDecks();
            
            if (Array.isArray(decksData)) {
                return decksData;
            } else if (decksData && typeof decksData === 'object' && Array.isArray(decksData.decks)) {
                return decksData.decks;
            }
            console.warn('Unexpected decks data format:', decksData);
            return [];
        } catch (error) {
            console.error('Error getting decks:', error);
            showNotification('Failed to get decks. Please check your connection and try again.', 'error');
            return [];
        }
    }

    async function saveMultipleDecks(decksArrayToUpdate) {
        if (!decksArrayToUpdate || decksArrayToUpdate.length === 0) {
            console.log('No decks provided to save.');
            return;
        }
        try {
            const updatePromises = decksArrayToUpdate.map(deck => 
                api.decks.updateDeck(deck.deckId, deck)
            );
            await Promise.all(updatePromises);
            console.log(`${decksArrayToUpdate.length} deck(s) processed for saving.`);
        } catch (error) {
            console.error('Error saving multiple decks:', error);
            showNotification('Failed to save deck changes. Please check your connection and try again.', 'error');
        }
    }
    

    async function getFolders() {
        try {
            const foldersData = await api.folders.getAllFolders();
            
            let folderNames = [];
            
            if (Array.isArray(foldersData)) {
                folderNames = foldersData.map(folder => {
                    if (typeof folder === 'object' && folder.name) return folder.name;
                    if (typeof folder === 'string') return folder;
                    return null; 
                });
            } else if (foldersData && typeof foldersData === 'object') {
                if (Array.isArray(foldersData.folders)) {
                    folderNames = foldersData.folders.map(folder => {
                        if (typeof folder === 'object' && folder.name) return folder.name;
                        if (typeof folder === 'string') return folder;
                        return null;
                    });
                } else if (Object.keys(foldersData).length > 0) { 
                    folderNames = Object.values(foldersData).filter(value => typeof value === 'string');
                }
            }
            
            folderNames = [...new Set(folderNames.filter(name => name && name.trim() !== ''))];
            return folderNames;
        } catch (error) {
            console.error('Error fetching folders:', error);
            showNotification('Failed to fetch folders. Please try again.', 'error');
            return [];
        }
    }

    async function addFolder(folderName, silent = false) {
        if (!folderName || folderName.trim() === "") {
            if (!silent) showNotification("Folder name cannot be empty.", "error");
            return false;
        }
        
        const trimmedFolderName = folderName.trim();
        try {
            const result = await api.folders.createFolder(trimmedFolderName);

            let apiErrorMsg = null;
            if (result && result.error) {
                apiErrorMsg = result.error;
            } else if (result && result.body && typeof result.body === 'string') {
                try {
                    const parsedBody = JSON.parse(result.body);
                    if (parsedBody.error) {
                        apiErrorMsg = parsedBody.error;
                    }
                } catch (e) { }
            }
            
            if (apiErrorMsg || (result && result.statusCode && result.statusCode >= 400)) {
                 apiErrorMsg = apiErrorMsg || `API returned status ${result.statusCode}`;
                 console.error('Error from API creating folder:', apiErrorMsg);
                if (apiErrorMsg.includes('exists') || apiErrorMsg.includes('duplicate') || apiErrorMsg.includes('already exists')) {
                    if (!silent) showNotification("Folder with this name already exists.", "error");
                } else {
                    if (!silent) showNotification(`Failed to create folder: ${apiErrorMsg}.`, "error");
                }
                return false;
            }
            
            if (!silent) {
                showNotification(`Folder "${trimmedFolderName}" created successfully.`, "success");
            }
            return true;
        } catch (error) {
            console.error('Error creating folder:', error);
            let errorMessage = 'Failed to create folder. Please try again.';
            if (error && error.message) {
                if (error.message.includes('exists') || error.message.includes('duplicate')) {
                    errorMessage = 'Folder with this name already exists.';
                } else {
                     errorMessage = `Failed to create folder: ${error.message.substring(0,100)}.`; // Cap length
                }
            }
            if (!silent) showNotification(errorMessage, 'error');
            return false;
        }
    }

    async function deleteFolder(folderNameToDelete) {
        if (!confirm(`Are you sure you want to delete the folder "${folderNameToDelete}"? Decks inside will be moved out of the folder.`)) {
            return;
        }
        try {
            await api.folders.deleteFolder(folderNameToDelete);
            
            let allDecks = await getDecks();
            const decksToUpdate = allDecks
                .filter(deck => deck.folderName === folderNameToDelete)
                .map(deck => ({ ...deck, folderName: null })); // Create new objects for update

            if (decksToUpdate.length > 0) {
                await saveMultipleDecks(decksToUpdate);
            }
            
            currentFolderViewName = null; 
            await renderFolders();       
            showNotification(`Folder "${folderNameToDelete}" deleted successfully.`, 'success');
        } catch (error) {
            console.error('Error deleting folder:', error);
            showNotification('Failed to delete folder. Please check your connection and try again.', 'error');
        }
    }

    async function populateFolderSelect(selectElementId = 'folderSelect', selectedFolderName = null) {
        const select = document.getElementById(selectElementId);
        if (!select) {
            console.error(`Select element with ID '${selectElementId}' not found.`);
            return;
        }
        select.innerHTML = '<option value="">None (No Folder)</option>';
        try {
            const folders = await getFolders();
            folders.forEach(folderName => {
                const option = document.createElement('option');
                option.value = folderName;
                option.textContent = folderName;
                if (folderName === selectedFolderName) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating folder select:', error);
        }
    }

    function setActiveTab(activeTabElement) {
        document.querySelectorAll('.navigation .nav-link').forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        if (activeTabElement) {
            activeTabElement.classList.add('active');
            activeTabElement.setAttribute('aria-current', 'page');
        }
    }

    function updatePageTitleAndBackButton() {
        if (currentViewRenderFunction === renderFolders && currentFolderViewName) {
            libraryPageTitle.textContent = `Folder: ${currentFolderViewName}`;
            backToFoldersBtn.classList.remove('d-none');
        } else if (currentViewRenderFunction === renderFolders && !currentFolderViewName) {
            libraryPageTitle.textContent = "My Folders";
            backToFoldersBtn.classList.add('d-none');
        }
         else { 
            libraryPageTitle.textContent = "My Library";
            backToFoldersBtn.classList.add('d-none');
        }
    }

    function createDeckCardElement(deck, refreshCallback) {
        const colDiv = document.createElement("div");
        colDiv.classList.add("col-12", "col-sm-6", "col-md-4", "col-lg-3", "mb-4"); 
        const deckCard = document.createElement("div");
        deckCard.classList.add("card", "item-card", "h-100");
        deckCard.setAttribute("data-deck-id", deck.deckId);
        
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "d-flex", "flex-column");
        
        const title = document.createElement("h5");
        title.classList.add("card-title");
        title.textContent = deck.title || deck.name || "Untitled Deck";
        cardBody.appendChild(title);

        // Show folder name only when in "All Decks" view and deck is in a folder
        if (deck.folderName && currentViewRenderFunction === renderDecks) {
            const folderInfo = document.createElement("p");
            folderInfo.classList.add("card-text", "text-info", "small", "mb-1");
            folderInfo.innerHTML = `<i class="fa fa-folder-open-o"></i> ${deck.folderName}`;
            cardBody.appendChild(folderInfo);
        }

        const cardCount = document.createElement("p");
        cardCount.classList.add("card-text");
        cardCount.textContent = `Flashcards: ${deck.flashcards ? deck.flashcards.length : 0}`;
        cardBody.appendChild(cardCount);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("card-actions", "mt-auto");

        const editButton = document.createElement("button");
        editButton.classList.add("btn", "btn-sm", "btn-outline-light", "me-1");
        editButton.innerHTML = '<i class="fa fa-pencil"></i>';
        editButton.title = "Edit Deck";
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.setItem("deckIdToEdit", deck.deckId);
            window.location.href = "flashcard2.html";
        });
        actionsDiv.appendChild(editButton);

        const moveToFolderButton = document.createElement("button");
        moveToFolderButton.classList.add("btn", "btn-sm", "btn-outline-info", "me-1");
        moveToFolderButton.innerHTML = '<i class="fa fa-folder-open"></i>';
        moveToFolderButton.title = "Move to Folder";
        moveToFolderButton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('deckIdToMove').value = deck.deckId;
            populateFolderSelect('folderSelect', deck.folderName);
            var moveToFolderModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('moveToFolderModal'));
            moveToFolderModalInstance.show();
        });
        actionsDiv.appendChild(moveToFolderButton);

        // Show "Remove from Folder" button only when viewing a specific folder and deck is in it
        if (currentViewRenderFunction === renderFolders && currentFolderViewName && deck.folderName === currentFolderViewName) {
            const removeFromFolderButton = document.createElement("button");
            removeFromFolderButton.classList.add("btn", "btn-sm", "btn-outline-warning", "me-1");
            removeFromFolderButton.innerHTML = '<i class="fa fa-times-circle"></i>';
            removeFromFolderButton.title = "Remove from this Folder";
            removeFromFolderButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Remove deck "${deck.title || deck.name || 'Untitled Deck'}" from folder "${currentFolderViewName}"?`)) {
                    try {
                        const deckToUpdate = {...deck, folderName: null};
                        await api.decks.updateDeck(deck.deckId, deckToUpdate);
                        showNotification('Deck removed from folder.', 'success');
                        await refreshCallback(); 
                    } catch (error) {
                        console.error('Error removing deck from folder:', error);
                        showNotification('Failed to remove deck from folder.', 'error');
                    }
                }
            });
            actionsDiv.appendChild(removeFromFolderButton);
        }

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("btn", "btn-sm", "btn-outline-danger");
        deleteButton.innerHTML = '<i class="fa fa-trash"></i>';
        deleteButton.title = "Delete Deck";
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete the deck "${deck.title || deck.name || 'Untitled Deck'}"?`)) {
                try {
                    await api.decks.deleteDeck(deck.deckId);
                    showNotification('Deck deleted successfully.', 'success');
                    await refreshCallback(); // Refresh current view
                } catch (error) {
                    console.error('Error deleting deck:', error);
                    showNotification('Failed to delete deck.', 'error');
                }
            }
        });
        actionsDiv.appendChild(deleteButton);

        cardBody.appendChild(actionsDiv);
        deckCard.appendChild(cardBody);
        deckCard.addEventListener("click", function() {
            localStorage.setItem("currentDeckIdToStudy", deck.deckId);
            window.location.href = "course.html";
        });
        colDiv.appendChild(deckCard);
        return colDiv;
    }

    let deckCountCache = {};
    
    async function updateDeckCountCache(decksToCount = null) {
        try {
            const decks = decksToCount || await getDecks();
            deckCountCache = {}; // Reset cache
            decks.forEach(deck => {
                if (deck.folderName) {
                    deckCountCache[deck.folderName] = (deckCountCache[deck.folderName] || 0) + 1;
                }
            });
        } catch (error) {
            console.error('Error updating deck count cache:', error);
        }
    }
    
    function createFolderItemCardElement(folderName) {
        const deckCount = deckCountCache[folderName] || 0;

        const colDiv = document.createElement("div");
        colDiv.classList.add("col-12", "col-sm-6", "col-md-4", "col-lg-3", "mb-4");

        const folderCard = document.createElement("div");
        folderCard.classList.add("card", "item-card", "h-100", "folder-item-card");
        folderCard.style.cursor = "pointer";
        folderCard.style.backgroundColor = "#2c3e50";
        folderCard.style.borderColor = "#34495e";
        folderCard.addEventListener('click', async () => {
            currentFolderViewName = folderName;
            await renderFolders(); 
        });

        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "d-flex", "flex-column");
        
        const headerDiv = document.createElement("div");
        headerDiv.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-3");
        headerDiv.style.width = "100%"; 
        
        const title = document.createElement("h5");
        title.classList.add("card-title", "mb-0", "text-start");
        title.textContent = folderName;
        title.style.fontWeight = "bold";
        title.style.overflow = "hidden";
        title.style.textOverflow = "ellipsis";
        title.style.maxWidth = "70%"; 
        title.style.textAlign = "left"; 
        headerDiv.appendChild(title);
        
        const icon = document.createElement("i");
        icon.classList.add("fa", "fa-folder");
        icon.style.fontSize = "1.5rem";
        icon.style.color = "#f39c12";
        icon.style.marginLeft = "auto"; 
        headerDiv.appendChild(icon);
        
        cardBody.appendChild(headerDiv);

        const countText = document.createElement("p");
        countText.classList.add("card-text", "text-center", "my-3");
        countText.style.fontSize = "1.2rem";
        countText.textContent = `${deckCount} deck${deckCount !== 1 ? 's' : ''}`;
        cardBody.appendChild(countText);
        
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("card-actions", "mt-auto", "d-flex", "justify-content-between", "align-items-center");
        
        const buttonsDiv = document.createElement("div");
        
        const editButton = document.createElement("button");
        editButton.classList.add("btn", "btn-sm", "btn-outline-light", "me-1");
        editButton.innerHTML = '<i class="fa fa-pencil"></i>';
        editButton.title = "Edit Folder";
        editButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = prompt("Enter new folder name:", folderName);
            if (newName && newName.trim() !== '' && newName !== folderName) {
                try {
                    const token = localStorage.getItem('token');
                    const endpoint = `/folders/${encodeURIComponent(folderName)}`;
                    const data = await apiRequest(endpoint, 'PUT', { newFolderName: newName.trim() }, token);
                    
                    console.log('Folder renamed successfully:', data);
                    
                    showNotification(`Folder renamed to "${newName.trim()}"`, "success");
                    
                    await updateDeckCountCache();
                    await renderFolders();
                } catch (error) {
                    console.error('Error renaming folder:', error);
                    showNotification(error.message, "error");
                }
            }
        });
        buttonsDiv.appendChild(editButton);
        
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("btn", "btn-sm", "btn-outline-danger");
        deleteButton.innerHTML = '<i class="fa fa-trash"></i>';
        deleteButton.title = `Delete folder "${folderName}"`;
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteFolder(folderName);
        });
        buttonsDiv.appendChild(deleteButton);
        
        actionsDiv.appendChild(buttonsDiv);
        
        
        cardBody.appendChild(actionsDiv);
        folderCard.appendChild(cardBody);
        colDiv.appendChild(folderCard);
        return colDiv;
    }

    async function renderDecks() {
        currentViewRenderFunction = renderDecks;
        currentFolderViewName = null;
        updatePageTitleAndBackButton();
        deckCardsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div></div>'; // Loading indicator

        const allDecks = await getDecks();
        deckCardsContainer.innerHTML = ''; 

        if (allDecks.length > 0) {
            allDecks.forEach((deck) => {
                const deckElement = createDeckCardElement(deck, renderDecks);
                deckCardsContainer.appendChild(deckElement);
            });
        }

        const addDeckColDiv = document.createElement("div");
        addDeckColDiv.classList.add("col-12", "col-sm-6", "col-md-4", "col-lg-3", "mb-4");
        const addDeckCardElement = document.createElement("div");
        addDeckCardElement.classList.add("card", "add-deck-card", "h-100");
        addDeckCardElement.innerHTML = `<i class="fa fa-plus"></i><span>Create New Deck</span>`;
        addDeckCardElement.onclick = function() {
            localStorage.removeItem('deckIdToEdit');
            window.location.href='flashcard2.html';
        };
        addDeckColDiv.appendChild(addDeckCardElement);
        deckCardsContainer.appendChild(addDeckColDiv);

        if (allDecks.length === 0) {
            const noDecksMessageDiv = document.createElement('div');
            noDecksMessageDiv.className = 'col-12 text-center mt-3 no-content-message';
            noDecksMessageDiv.innerHTML = `<p>No decks found. Click the card above to create one!</p>`;
            if (deckCardsContainer.children.length === 1 && deckCardsContainer.firstChild.isEqualNode(addDeckColDiv)) {
                deckCardsContainer.insertBefore(noDecksMessageDiv, addDeckColDiv);
            } else {
                 deckCardsContainer.appendChild(noDecksMessageDiv); 
            }
        }
    }

    async function renderFolders() {
        currentViewRenderFunction = renderFolders;
        updatePageTitleAndBackButton();
        deckCardsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div></div>'; // Loading indicator

        if (currentFolderViewName === null) {
            try {
                const [folders, decksForCount] = await Promise.all([
                    getFolders(),
                    getDecks() 
                ]);
                
                await updateDeckCountCache(decksForCount);

                deckCardsContainer.innerHTML = ''; 

                const createFolderColDiv = document.createElement("div");
                createFolderColDiv.classList.add("col-12", "col-sm-6", "col-md-4", "col-lg-3", "mb-4");
                const createFolderCard = document.createElement("div");
                createFolderCard.classList.add("card", "add-deck-card", "h-100");
                createFolderCard.innerHTML = `<i class="fa fa-plus" style="font-size: 2em; margin-bottom: 0.5em;"></i><span>Create New Folder</span>`;
                createFolderCard.onclick = function() {
                    const createFolderModal = new bootstrap.Modal(document.getElementById('createFolderModal'));
                    document.getElementById('newFolderNameInput').value = ''; 
                    createFolderModal.show();
                };
                createFolderColDiv.appendChild(createFolderCard);
                deckCardsContainer.appendChild(createFolderColDiv);
                
                if (folders && folders.length > 0) {
                    folders.forEach(folderName => {
                        const folderElement = createFolderItemCardElement(folderName);
                        deckCardsContainer.appendChild(folderElement);
                    });
                } else {
                    if (deckCardsContainer.children.length === 1) {
                        const noFoldersMessage = document.createElement('div');
                        noFoldersMessage.className = 'col-12 text-center mt-3 no-content-message';
                        noFoldersMessage.innerHTML = `<p>No folders created yet. Click above to create one.</p>`;
                        deckCardsContainer.appendChild(noFoldersMessage);
                    }
                }
            } catch (error) {
                console.error("Error rendering folders list:", error);
                deckCardsContainer.innerHTML = '<div class="col-12 text-center text-danger"><p>Could not load folders. Please try again.</p></div>';
                showNotification("Could not load folders.", "error");
            }

        } else { 
            const allDecks = await getDecks();
            deckCardsContainer.innerHTML = '';
            const decksInThisFolder = allDecks.filter(deck => deck.folderName === currentFolderViewName);

            if (decksInThisFolder.length === 0) {
                deckCardsContainer.innerHTML = `<div class="col-12 no-content-message"><p>This folder is empty. You can move decks here using the <i class="fa fa-folder-open"></i> button on a deck.</p></div>`;
            } else {
                decksInThisFolder.forEach((deck) => {
                    const deckElement = createDeckCardElement(deck, renderFolders); 
                    deckCardsContainer.appendChild(deckElement);
                });
            }
        }
    }

    navDecks.addEventListener('click', async function(event) {
        event.preventDefault();
        setActiveTab(this);
        await renderDecks();
    });

    navFolders.addEventListener('click', async function(event) {
        event.preventDefault();
        setActiveTab(this);
        currentFolderViewName = null; 
        await renderFolders();
    });
    
    backToFoldersBtn.addEventListener('click', async () => {
        currentFolderViewName = null;
        setActiveTab(navFolders); 
        await renderFolders();
    });

    const createNewFolderModalBtn = document.getElementById('createNewFolderFromModalBtn');
    if (createNewFolderModalBtn) {
        createNewFolderModalBtn.addEventListener('click', async function() {
            const newFolderNameInput = document.getElementById('newFolderNameInputModal');
            const newFolderName = newFolderNameInput.value.trim();
            if (newFolderName) {
                const success = await addFolder(newFolderName, true); 
                if (success) {
                    await populateFolderSelect('folderSelect', newFolderName); 
                    newFolderNameInput.value = '';
                    showNotification(`Folder "${newFolderName}" created and selected.`, 'info');
                } else {
                    showNotification("Folder could not be created. It might already exist or the name is invalid.", 'error');
                }
            } else {
                showNotification("Please enter a folder name.", 'error');
            }
        });
    }
    
    const confirmCreateFolderBtn = document.getElementById('confirmCreateFolderBtn');
    if (confirmCreateFolderBtn) {
        confirmCreateFolderBtn.addEventListener('click', async function() {
            const newFolderNameInput = document.getElementById('newFolderNameInput');
            const newFolderName = newFolderNameInput.value.trim();
            
            if (newFolderName) {
                const createFolderModalInstance = bootstrap.Modal.getInstance(document.getElementById('createFolderModal'));
                const success = await addFolder(newFolderName);
                
                if (success) {
                    if(createFolderModalInstance) createFolderModalInstance.hide();
                    newFolderNameInput.value = '';
                    await renderFolders(); 
                }
            } else {
                showNotification("Please enter a folder name.", 'error');
            }
        });
    }

    const confirmMoveToFolderBtn = document.getElementById('confirmMoveToFolderBtn');
    if (confirmMoveToFolderBtn) {
        confirmMoveToFolderBtn.addEventListener('click', async function() {
            const deckId = document.getElementById('deckIdToMove').value;
            const selectedFolder = document.getElementById('folderSelect').value;
            
            const allDecks = await getDecks(); // Get fresh list of decks
            const deckToUpdate = allDecks.find(d => d.deckId === deckId);

            if (deckToUpdate) {
                const oldFolderName = deckToUpdate.folderName;
                deckToUpdate.folderName = selectedFolder === "" ? null : selectedFolder;
                try {
                    await api.decks.updateDeck(deckToUpdate.deckId, deckToUpdate);
                    showNotification(`Deck "${deckToUpdate.title || deckToUpdate.name}" moved successfully.`, 'success');
                    
                    if (oldFolderName) deckCountCache[oldFolderName] = (deckCountCache[oldFolderName] || 1) -1;
                    if (deckToUpdate.folderName) deckCountCache[deckToUpdate.folderName] = (deckCountCache[deckToUpdate.folderName] || 0) + 1;

                    await currentViewRenderFunction(); 
                } catch (error) {
                    console.error("Error moving deck:", error);
                    showNotification('Failed to move deck. Please try again.', 'error');
                    if (oldFolderName) deckCountCache[oldFolderName] = (deckCountCache[oldFolderName] || 0) + 1;
                    if (deckToUpdate.folderName) deckCountCache[deckToUpdate.folderName] = (deckCountCache[deckToUpdate.folderName] || 1) -1;

                }
            } else {
                showNotification('Deck not found for moving.', 'error');
            }
            
            var moveToFolderModalInstance = bootstrap.Modal.getInstance(document.getElementById('moveToFolderModal'));
            if (moveToFolderModalInstance) moveToFolderModalInstance.hide();
        });
    }
    
    if (document.getElementById('moveToFolderModal')) new bootstrap.Modal(document.getElementById('moveToFolderModal'), { keyboard: false });
    if (document.getElementById('createFolderModal')) new bootstrap.Modal(document.getElementById('createFolderModal'), { keyboard: false });


    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html'; 
        return; 
    }

    (async () => {
        try {
            setActiveTab(navDecks);
            await renderDecks();
        } catch (error) {
            console.error('Error during initial render:', error);
            showNotification('Error loading library. Please try refreshing.', 'error');
            if (error.message && (error.message.toLowerCase().includes('authorization') || error.message.toLowerCase().includes('token'))) {
                localStorage.removeItem('token'); // Clear bad token
                window.location.href = 'index.html';
            }
        }
    })();

    if (currentUserElement) {
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
            localStorage.removeItem('currentDeckIdToStudy');
            localStorage.removeItem('deckIdToEdit');
            window.location.href = 'index.html';
        });
    }
});