
function saveOptions() {
    const dailyGoal = document.getElementById('dailyGoal').value;
    chrome.storage.local.set({
        dailyGoal: parseInt(dailyGoal, 10)
    }, () => {
       
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}


function restoreOptions() {
    chrome.storage.local.get({
        dailyGoal: 5 // Default value
    }, (items) => {
        document.getElementById('dailyGoal').value = items.dailyGoal;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
