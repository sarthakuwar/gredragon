

document.addEventListener('DOMContentLoaded', () => {
    const wordEl = document.getElementById('word');
    const phoneticEl = document.getElementById('phonetic');
    const definitionEl = document.getElementById('definition');
    const loadingEl = document.getElementById('loading');
    const wordContainerEl = document.getElementById('word-container');
    const optionsLink = document.getElementById('options-link');

    
    chrome.storage.local.get('currentWord', (data) => {
        if (data.currentWord) {
            const { word, phonetic, definition } = data.currentWord;
            wordEl.textContent = word;
            phoneticEl.textContent = phonetic;
            definitionEl.textContent = definition;
            
            loadingEl.classList.add('hidden');
            wordContainerEl.classList.remove('hidden');
        } else {
            loadingEl.textContent = 'No word fetched yet. Please wait for the next notification.';
        }
    });

    
    optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
});
