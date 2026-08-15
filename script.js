const filesInput=document.getElementById("files");
const queue=document.getElementById("queue");
const results=document.getElementById("results");
const empty=document.getElementById("empty");
const feedback=document.getElementById("feedback");
const drop=document.getElementById("drop");

async function digest(file){
  const buffer=await file.arrayBuffer();
  const hash=await crypto.subtle.digest("SHA-256",buffer);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

function confidenceFromHash(hash){
  return 82.4+(parseInt(hash.slice(0,2),16)%15);
}

async function processFiles(files){
  queue.innerHTML="";
  results.innerHTML="";
  empty.style.display=files.length?"none":"flex";
  if(!files.length)return;

  const items=[];
  for(const file of files){
    if(!file.type.startsWith("image/"))continue;
    const hash=await digest(file);
    const abnormal=parseInt(hash.slice(0,8),16)%2===0;
    const confidence=confidenceFromHash(hash);
    const url=URL.createObjectURL(file);
    items.push({file,hash,abnormal,confidence,url});
    queue.insertAdjacentHTML("beforeend",`
      <div class="queue-item"><img class="thumb" src="${url}"><strong>${escapeHtml(file.name)}</strong><span>${Math.round(file.size/1024)} KB · queued</span></div>`);
  }

  if(!items.length){empty.style.display="flex";return}

  for(const item of items){
    results.insertAdjacentHTML("beforeend",card(item));
  }
  bindActions(items);
}

function card(x){
  const result=x.abnormal?"Abnormal":"Normal";
  return `<article class="scan-card">
    <div class="scan-top">
      <div class="scan-name">${escapeHtml(x.file.name)}</div>
      <span class="tag ${x.abnormal?"abnormal":"normal"}">${result}</span>
    </div>
    <div class="scan-body">
      <img class="preview" src="${x.url}">
      <div class="details">
        <div>Scan ID: <strong>${x.hash.slice(0,8)}</strong></div>
        <div>AI confidence: <strong>${x.confidence.toFixed(1)}%</strong></div>
        <div>Workflow: <strong>${x.abnormal?"Priority 1":"Standard review"}</strong></div>
        <div>Status: <strong>Processed locally</strong></div>
      </div>
    </div>
    <div class="alert ${x.abnormal?"red":"green"}">${x.abnormal
      ?"🚨 Demo triage: abnormal pattern flagged for priority radiologist review."
      :"✓ Demo triage: no abnormal flag generated; standard review pathway."}</div>
    <div class="actions">
      <button class="confirm" data-hash="${x.hash}" data-value="${result}">Confirm '${result}'</button>
      <button class="correct" data-hash="${x.hash}" data-value="${x.abnormal?"Normal":"Abnormal"}">Correct to '${x.abnormal?"Normal":"Abnormal"}'</button>
    </div>
  </article>`;
}

function bindActions(items){
  document.querySelectorAll(".actions button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const corrected=btn.classList.contains("correct");
      const value=btn.dataset.value;
      feedback.textContent=(corrected?"Correction logged locally for demo scan ":"AI result confirmed for demo scan ")+btn.dataset.hash.slice(0,8)+` → ${value}.`;
      feedback.style.color=corrected?"#ff98a4":"#82dfbe";
    });
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
filesInput.addEventListener("change",e=>processFiles([...e.target.files]));
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor="#4dd9d4"}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor=""}));
drop.addEventListener("drop",e=>processFiles([...e.dataTransfer.files]));
