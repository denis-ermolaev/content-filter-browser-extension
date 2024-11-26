// blockpage.js
chrome.storage.local.get(['status', 'score', 'language', 'foundWords'], (data) => {
  const status = data.status || 'Unknown';
  const score = data.score || 0;
  const language = data.language || 'Unknown';
  const foundWords = data.foundWords || {};

  document.getElementById('status').textContent = status;
  document.getElementById('score').textContent = score;
  document.getElementById('language').textContent = language;


  const foundWordsContainer = document.getElementById('foundWordsContainer');


  foundWordsContainer.innerHTML = '';


  if (typeof foundWords === 'object') {
    for (const key in foundWords) {
      if (foundWords.hasOwnProperty(key)) {
        const phrases = [foundWords[key],];
        if (typeof foundWords[key] != 'object') {
            const phrases = [foundWords[key],];
        } else {
            const phrases = foundWords[key];
        }


        const groupHeader = document.createElement('h4');
        groupHeader.textContent = `Weight ${key}:`;
        foundWordsContainer.appendChild(groupHeader);


        const list = document.createElement('ul');
        //console.log(foundWords);
        //console.log("phrases", phrases);
        phrases.forEach(phrase => {
          if (typeof phrase === 'object') {
            phrase.forEach(phrase_ => {
                const listItem = document.createElement('li');
                listItem.textContent = phrase_;
                list.appendChild(listItem);
            });
          } else {
            const listItem = document.createElement('li');
            listItem.textContent = phrase;
            list.appendChild(listItem);
          }
        });

        foundWordsContainer.appendChild(list);
      }
    }
  } else {
    foundWordsContainer.textContent = 'No found words available.';
  }

  console.log(status, score, language, foundWords);
});