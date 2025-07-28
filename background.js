
import { WORD_LIST } from './words.js';

const REVISION_INTERVAL_DAYS = 2;

const REVISION_CHANCE = 0.25;




/**
 * 
 * @returns {string|null} 
 */
async function getNewWordFromList() {
  const { seenWords = [] } = await chrome.storage.local.get('seenWords');
  const seenWordStrings = seenWords.map(item => item.word);
  
  const availableWords = WORD_LIST.filter(word => !seenWordStrings.includes(word));

  if (availableWords.length === 0) {
    return null; // All words have been learned
  }

  const randomIndex = Math.floor(Math.random() * availableWords.length);
  return availableWords[randomIndex];
}

/** 
 * 
 * @returns {object|null}
 */
async function getRevisionWord() {
    const { seenWords = [] } = await chrome.storage.local.get('seenWords');
    if (seenWords.length === 0) {
        return null;
    }

    const now = Date.now();
    const revisionThreshold = now - (REVISION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    const dueForRevision = seenWords.filter(item => item.lastSeen < revisionThreshold);

    if (dueForRevision.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * dueForRevision.length);
    return dueForRevision[randomIndex];
}


/**
 * 
 * @param {string} word 
 * @returns {object|null} 
 */
async function fetchWordDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      word: data[0].word,
      phonetic: data[0].phonetics.find(p => p.text)?.text || '',
      definition: data[0].meanings[0]?.definitions[0]?.definition || 'No definition found.'
    };
  } catch (error) {
    console.error(`Error fetching definition for "${word}":`, error);
    return null;
  }
}

/**
 * 
 * @param {object} wordData 
 * @param {boolean} isRevision 
 */
async function showNotificationAndUpdateStorage(wordData, isRevision) {
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/dragon_128.png',
        title: `${isRevision ? '🔄 Revision: ' : '✨ New Word: '}${wordData.word}`,
        message: wordData.definition,
        priority: 2
    });

   
    chrome.storage.local.set({ currentWord: wordData });

  
    const { seenWords = [] } = await chrome.storage.local.get('seenWords');
    const wordIndex = seenWords.findIndex(item => item.word === wordData.word);
    const now = Date.now();

    if (wordIndex > -1) {
       
        seenWords[wordIndex].lastSeen = now;
    } else {
       
        seenWords.push({ word: wordData.word, lastSeen: now });
    }
    
    await chrome.storage.local.set({ seenWords: seenWords });
    console.log(`Successfully ${isRevision ? 'revised' : 'saved new word'}: ${wordData.word}`);
}



async function handleWordNotification() {
    console.log("Deciding whether to show a new word or a revision...");

  
    const revisionWord = await getRevisionWord();
    
   
    if (revisionWord && Math.random() < REVISION_CHANCE) {
        console.log(`Revising word: ${revisionWord.word}`);
        const wordData = await fetchWordDefinition(revisionWord.word);
        if (wordData) {
            await showNotificationAndUpdateStorage(wordData, true);
        }
        return; 
    }

    
    console.log("No revision shown, attempting to show a new word.");
    const newWord = await getNewWordFromList();

    if (!newWord) {
        console.log("Congratulations! All words from the list have been learned.");
       
        return;
    }

    const wordData = await fetchWordDefinition(newWord);
    if (wordData) {
        await showNotificationAndUpdateStorage(wordData, false);
    }
}



async function handleAlarm() {
    console.log("Alarm triggered!");
    const { dailyGoal = 5, wordsShownToday = 0, lastShownDate } = await chrome.storage.local.get(['dailyGoal', 'wordsShownToday', 'lastShownDate']);
    
    const today = new Date().toISOString().split('T')[0];
    let currentWordsShown = wordsShownToday;

    if (lastShownDate !== today) {
        console.log("New day detected. Resetting daily word count.");
        currentWordsShown = 0;
        await chrome.storage.local.set({ wordsShownToday: 0, lastShownDate: today });
    }

    if (currentWordsShown < dailyGoal) {
        console.log(`Words shown today: ${currentWordsShown}. Goal: ${dailyGoal}.`);
        await handleWordNotification();
        await chrome.storage.local.set({ wordsShownToday: currentWordsShown + 1 });
    } else {
        console.log("Daily word goal reached. No new word will be fetched until tomorrow.");
    }
}


chrome.runtime.onInstalled.addListener(() => {
  console.log("Vocabulary Builder extension installed/updated.");
  
  
  chrome.storage.local.get('seenWords', (result) => {
    if (!result.seenWords) {
        chrome.storage.local.set({
            dailyGoal: 5,
            wordsShownToday: 0,
            lastShownDate: new Date().toISOString().split('T')[0],
           
            seenWords: [] 
        });
    }
  });

 
  chrome.alarms.create('wordAlarm', {
    delayInMinutes: 1,
    periodInMinutes: 30 // Fires every hour
  });
  
 
  handleAlarm();
});


chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'wordAlarm') {
    handleAlarm();
  }
});
