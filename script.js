/* Grundlegende Spiel-Logik für Truth or Dare
const gender = playerGender.value;
if(!name) return alert('Bitte Namen eingeben');
players.push({name,gender});
playerName.value=''; savePlayers(); updatePlayersUI();
}


startGameBtn.onclick = ()=>{
if(players.length < MIN_PLAYERS) return alert('Mindestens 3 Spieler notwendig');
setupSection.classList.add('hidden');
gameSection.classList.remove('hidden');
currentIndex = 0; renderTurn();
}


function renderTurn(){
const p = players[currentIndex];
turnLabel.textContent = `${p.name}, du bist dran.`;
questionBox.textContent = 'Wähle Wahrheit oder Pflicht';
remainingCount.textContent = questions.filter(q=>!used.has(String(q.id))).length;
}


function pickQuestion(playerGender, diff, wantType){
// filter available
const pool = questions.filter(q=>!used.has(String(q.id)) && (q.gender==='both' || q.gender===playerGender) && (diff==='any' || q.diff===diff) && (wantType? (wantType==='T'? q.type==='T' : q.type==='D') : true));
if(pool.length===0) return null;
const idx = Math.floor(Math.random()*pool.length);
return pool[idx];
}


truthBtn.onclick = ()=>{ handleChoice('T'); }
dareBtn.onclick = ()=>{ handleChoice('D'); }


function handleChoice(type){
const p = players[currentIndex];
// difficulty selection: read from UI? default to "mild" dropdown? For simplicity: ask user via prompt
let diff = prompt('Schwierigkeit wählen (mild / wild / crazy). Enter für beliebig', '');
diff = (diff||'').toLowerCase(); if(!['mild','wild','crazy'].includes(diff)) diff='any';
const q = pickQuestion(p.gender, diff, type);
if(!q){ questionBox.textContent = 'Keine passende Frage/Aufgabe mehr für diese Auswahl.'; return; }
lastPicked = q;
questionBox.textContent = (q.type==='T'? 'Wahrheit: ' : 'Pflicht: ') + q.text;
}


completeBtn.onclick = ()=>{
if(!lastPicked) { // nothing picked
// skip to next
nextPlayer(); return;
}
used.add(String(lastPicked.id)); saveUsed(); lastPicked = null; nextPlayer();
}


skipBtn.onclick = ()=>{ lastPicked = null; nextPlayer(); }


restartBtn.onclick = ()=>{
if(confirm('Spiel wirklich neu starten? Benutzte Fragen werden zurückgesetzt.')){
used = new Set(); saveUsed(); currentIndex = 0; renderTurn(); questionBox.textContent='Neustart';
}
}


function nextPlayer(){
currentIndex = (currentIndex + 1) % players.length; renderTurn();
}


// Editor
openEditor.onclick = ()=>{ editor.classList.toggle('hidden'); }
loadEditor.onclick = ()=>{
// load original questions file into editor (if available via fetch)
fetch('questions.txt').then(r=>r.text()).then(t=>{ editorArea.value = t; }).catch(e=>{
// fallback: try stored local
const s = localStorage.getItem('tod_questions_editor'); if(s) editorArea.value = s; else alert('Fragen konnten nicht geladen werden.');
});
}
saveEditor.onclick = ()=>{
localStorage.setItem('tod_questions_editor', editorArea.value); alert('Fragen lokal gespeichert (localStorage). Um die Datei im Repo zu ändern, bearbeite questions.txt im Repository.');
}


// Initialisation: lade Fragen
loadUsed(); loadPlayers(); updatePlayersUI();
fetch('questions.txt').then(r=>r.text()).then(t=>{
questions = parseLines(t);
remainingCount.textContent = questions.length - (used.size||0);
}).catch(e=>{
console.error('questions.txt konnte nicht geladen werden', e);
questions = [];
});


// Restore players into setup UI
if(players.length>0) updatePlayersUI();