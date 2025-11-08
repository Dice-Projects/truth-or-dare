// Saubere, robuste script.js — UTF-8 ohne BOM erforderlich
document.addEventListener('DOMContentLoaded', () => {
  console.log('TOD: DOM geladen');

  // DOM-Elemente
  const playersList = document.getElementById('playersList');
  const playerName = document.getElementById('playerName');
  const playerGender = document.getElementById('playerGender');
  const addPlayerBtn = document.getElementById('addPlayer');
  const startGameBtn = document.getElementById('startGame');
  const setupSection = document.getElementById('setup');
  const gameSection = document.getElementById('game');
  const turnLabel = document.getElementById('turnLabel');
  const truthBtn = document.getElementById('truthBtn');
  const dareBtn = document.getElementById('dareBtn');
  const questionBox = document.getElementById('questionBox');
  const completeBtn = document.getElementById('completeBtn');
  const skipBtn = document.getElementById('skipBtn');
  const restartBtn = document.getElementById('restartBtn');
  const remainingCount = document.getElementById('remainingCount');

  const openEditor = document.getElementById('openEditor');
  const editor = document.getElementById('editor');
  const editorArea = document.getElementById('editorArea');
  const loadEditor = document.getElementById('loadEditor');
  const saveEditor = document.getElementById('saveEditor');

  const globalDifficultySelect = document.getElementById('globalDifficulty');

  // Defensive checks
  if(!startGameBtn) console.warn('startGameBtn nicht gefunden — prüfe index.html');
  if(!globalDifficultySelect) console.warn('globalDifficulty Select nicht gefunden — bitte index.html anpassen');

  // App state
  const MIN_PLAYERS = 3;
  let questions = [];
  let used = new Set();
  let players = [];
  let currentIndex = 0;
  let lastPicked = null;
  let chosenDifficulty = 'any';
  let questionsLoaded = false;

  // Storage helpers
  function saveUsed(){ localStorage.setItem('tod_used', JSON.stringify(Array.from(used))); }
  function loadUsed(){ try{ const raw = localStorage.getItem('tod_used'); if(raw) used = new Set(JSON.parse(raw)); }catch(e){ used = new Set(); } }
  function savePlayers(){ localStorage.setItem('tod_players', JSON.stringify(players)); }
  function loadPlayers(){ try{ const raw = localStorage.getItem('tod_players'); if(raw) players = JSON.parse(raw); }catch(e){ players = []; } }

  // Parser
  function parseLines(text){
    if(text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // remove BOM if present
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l && !l.startsWith('#'));
    const parsed = lines.map((line, idx)=>{
      const parts = line.split('|');
      const id = idx+1;
      return {
        id: id,
        raw: line,
        type: (parts[0]||'T').trim().toUpperCase(),
        gender: (parts[1]||'both').trim().toLowerCase(),
        diff: (parts[2]||'mild').trim().toLowerCase(),
        text: parts.slice(3).join('|')||''
      };
    });
    return parsed;
  }

  // UI players
  function updatePlayersUI(){
    if(!playersList) return;
    playersList.innerHTML = '';
    players.forEach((p, i)=>{
      const el = document.createElement('div'); el.className='player';
      el.innerHTML = `<strong>${p.name}</strong> <span class="small">${p.gender}</span>`;
      const rem = document.createElement('button'); rem.textContent='Entfernen';
      rem.onclick = ()=>{ players.splice(i,1); savePlayers(); updatePlayersUI(); };
      el.appendChild(rem);
      playersList.appendChild(el);
    });
  }

  // Buttons: add player
  if(addPlayerBtn){
    addPlayerBtn.addEventListener('click', ()=>{
      const name = (playerName.value||'').trim();
      const gender = playerGender.value;
      if(!name) return alert('Bitte Namen eingeben');
      players.push({name,gender});
      playerName.value='';
      savePlayers();
      updatePlayersUI();
      console.log('Spieler hinzugefügt:', players);
    });
  }

  // Start game: use global difficulty selected BEFORE start
  if(startGameBtn){
    startGameBtn.addEventListener('click', ()=>{
      if(!questionsLoaded){
        return alert('Fragen werden noch geladen. Bitte kurz warten (Seite neu laden falls das Problem besteht).');
      }
      if(players.length < MIN_PLAYERS) return alert('Mindestens 3 Spieler notwendig');
      chosenDifficulty = (globalDifficultySelect ? globalDifficultySelect.value : 'any') || 'any';
      console.log('Gewählte Schwierigkeit vor Start:', chosenDifficulty);
      if(setupSection) setupSection.classList.add('hidden');
      if(gameSection) gameSection.classList.remove('hidden');
      currentIndex = 0; renderTurn();
    });
  }

  function renderTurn(){
    const p = players[currentIndex];
    if(!p){ turnLabel && (turnLabel.textContent = 'Keine Spieler'); return; }
    turnLabel && (turnLabel.textContent = `${p.name}, du bist dran.`);
    questionBox && (questionBox.textContent = 'Wähle Wahrheit oder Pflicht');
    remainingCount && (remainingCount.textContent = questions.filter(q=>!used.has(String(q.id))).length);
  }

  function pickQuestion(playerGender, diff, wantType){
    const pool = questions.filter(q=>{
      if(used.has(String(q.id))) return false;
      if(!(q.gender === 'both' || q.gender === playerGender)) return false;
      if(!(diff === 'any' || q.diff === diff)) return false;
      if(wantType){
        if(wantType === 'T' && q.type !== 'T') return false;
        if(wantType === 'D' && q.type !== 'D') return false;
      }
      return true;
    });
    if(pool.length===0) {
      console.log('pickQuestion: leerer Pool — debug:', {
        totalQuestions: questions.length,
        usedCount: used.size,
      });
      const possible = questions.filter(q => (q.gender==='both' || q.gender===playerGender) && (diff==='any' || q.diff===diff) && (wantType ? (wantType==='T'? q.type==='T' : q.type==='D') : true));
      console.log(' mögliche gesamt (ohne used filter):', possible.length, possible.slice(0,6));
      return null;
    }
    const idx = Math.floor(Math.random()*pool.length);
    return pool[idx];
  }

  function handleChoice(type){
    const p = players[currentIndex];
    if(!p) return alert('Kein Spieler ausgewählt');
    const diff = chosenDifficulty || 'any';
    const q = pickQuestion(p.gender, diff, type);
    if(!q){ questionBox && (questionBox.textContent = 'Keine passende Frage/Aufgabe mehr für diese Auswahl.'); return; }
    lastPicked = q;
    questionBox && (questionBox.textContent = (q.type==='T'? 'Wahrheit: ' : 'Pflicht: ') + q.text);
  }

  if(truthBtn) truthBtn.addEventListener('click', ()=>handleChoice('T'));
  if(dareBtn) dareBtn.addEventListener('click', ()=>handleChoice('D'));

  if(completeBtn) completeBtn.addEventListener('click', ()=>{
    if(!lastPicked){ nextPlayer(); return; }
    used.add(String(lastPicked.id)); saveUsed(); lastPicked = null; nextPlayer();
  });
  if(skipBtn) skipBtn.addEventListener('click', ()=>{ lastPicked = null; nextPlayer(); });
  if(restartBtn) restartBtn.addEventListener('click', ()=>{
    if(confirm('Spiel wirklich neu starten? Benutzte Fragen werden zurückgesetzt.')){
      used = new Set(); saveUsed(); currentIndex = 0; renderTurn(); questionBox && (questionBox.textContent='Neustart');
    }
  });

  function nextPlayer(){ currentIndex = (currentIndex + 1) % players.length; renderTurn(); }

  // Editor UI
  if(openEditor) openEditor.addEventListener('click', ()=>{ if(editor) editor.classList.toggle('hidden'); });
  if(loadEditor) loadEditor.addEventListener('click', ()=>{
    fetch('questions.txt').then(r=>r.text()).then(t=>{ editorArea.value = t; }).catch(e=>{
      const s = localStorage.getItem('tod_questions_editor'); if(s) editorArea.value = s; else alert('Fragen konnten nicht geladen werden.');
    });
  });
  if(saveEditor) saveEditor.addEventListener('click', ()=>{ localStorage.setItem('tod_questions_editor', editorArea.value); alert('Fragen lokal gespeichert (localStorage). Um die Datei im Repo zu ändern, bearbeite questions.txt im Repository.'); });

  // Init
  loadUsed(); loadPlayers(); updatePlayersUI();

  if(startGameBtn) startGameBtn.disabled = true;

  // --- Robust: fetch -> localStorage fallback -> file upload ---
  function handleQuestionsLoadText(text){
    try{
      questions = parseLines(text || '');
      questionsLoaded = true;
      console.log('Fragen geladen (Quelle):', questions.length);
      if(startGameBtn) startGameBtn.disabled = false;
      remainingCount && (remainingCount.textContent = questions.length - (used.size||0));
    } catch(e){
      console.error('Fehler beim parsen der Fragen:', e);
      questions = [];
      questionsLoaded = false;
      if(startGameBtn) startGameBtn.disabled = true;
    }
  }

  fetch('questions.txt').then(r=>{
    if(!r.ok) throw new Error('fetch-not-ok: '+r.status);
    return r.text();
  }).then(t=>{
    handleQuestionsLoadText(t);
  }).catch(e=>{
    console.warn('questions.txt fetch failed (vermutlich file:// oder CORS). Versuche Fallbacks. Fehler:', e);
    const localEditor = localStorage.getItem('tod_questions_editor');
    if(localEditor){
      console.log('Lade Fragen aus localStorage (tod_questions_editor).');
      handleQuestionsLoadText(localEditor);
      return;
    }
    questionsLoaded = false;
    if(startGameBtn) startGameBtn.disabled = true;
    alert('Die Fragenliste konnte nicht automatisch geladen werden. Wenn du die Seite lokal per Datei öffnest, starte am besten einen lokalen Server (z. B. `python -m http.server 8000`) ODER lade die questions.txt manuell hoch.');
    const fileLabel = document.createElement('div');
    fileLabel.style.marginTop = '10px';
    fileLabel.className = 'card';
    fileLabel.innerHTML = '<strong>Lokale questions.txt hochladen</strong><div class="small">Wenn du die Seite ohne Server geöffnet hast, wähle hier deine questions.txt.</div>';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.csv';
    fileInput.style.marginTop = '8px';
    fileLabel.appendChild(fileInput);
    const container = document.querySelector('.app') || document.body;
    container.insertBefore(fileLabel, container.firstChild);

    fileInput.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = function(evt){
        const txt = evt.target.result;
        localStorage.setItem('tod_questions_editor', txt);
        handleQuestionsLoadText(txt);
        fileLabel.remove();
        alert('Fragen geladen (vom lokalen File). Du kannst jetzt starten.');
      };
      reader.readAsText(f, 'utf-8');
    });
  });

  if(players.length>0) updatePlayersUI();

  console.log('TOD: Init abgeschlossen');
});
