
// Saves tab for window
chrome.runtime.sendMessage({type: 'save'}, () => {})

// Signals to close window
document.addEventListener('click', function(){
    chrome.runtime.sendMessage({type: 'close-window'}, () => {})
})