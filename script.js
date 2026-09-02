'use strict';
// ====== GYM TRACKER - Main Script ======

// ====== STATE ======
const LS = {
  goals:'gym_goals', workouts:'gym_workouts', meals:'gym_meals',
  weights:'gym_weights', name:'gym_name', theme:'gym_theme'
};
function load(k, fb){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?fb:v }catch(e){ return fb } }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(e){} }

let goals = load(LS.goals, {cal:2400, pro:150, carb:250, fat:70});
let workouts = load(LS.workouts, []);
let meals = load(LS.meals, []);
let weights = load(LS.weights, []);

const today = () => new Date().toISOString().slice(0,10);
const num = (v,d=0) => { const n=parseFloat(v); return isNaN(n)?d:n; };
const fmt = n => Math.round(n).toLocaleString('vi-VN');

function daysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }
function weekRange(){
  const d=new Date(); const day=d.getDay()||7; const start=new Date(d); start.setDate(d.getDate()-day+1);
  const end=new Date(d); return [start.toISOString().slice(0,10), end.toISOString().slice(0,10)];
}
function vnDate(s){ const d=new Date(s+'T00:00:00'); return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}); }

// ====== NAME ======
let userName = localStorage.getItem(LS.name) || '';
function askName(){
  if(userName) return;
  const n = prompt('Bạn tên gì? (để trống nếu không muốn)');
  if(n){ userName=n.trim(); localStorage.setItem(LS.name,userName); }
}
askName();

// ====== NAV ======
document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click',()=>{
    switchView(b.dataset.view);
  });
});

// ====== THEME ======
const LIGHT = {
  '--bg':'#f6f7f9','--card':'#ffffff','--card2':'#eef1f5','--border':'#e0e5ec',
  '--fg':'#1a2029','--muted':'#64748b','--accent':'#f59e0b','--accent2':'#16a34a','--red':'#dc2626'
};
if(localStorage.getItem(LS.theme)==='light') applyTheme('light');
function applyTheme(t){
  const root=document.documentElement;
  if(t==='light'){
    Object.entries(LIGHT).forEach(([k,v])=>root.style.setProperty(k,v));
    document.body.classList.add('light');
  } else {
    Object.entries(LIGHT).forEach(([k,v])=>root.style.removeProperty(k));
    document.body.classList.remove('light');
  }
  localStorage.setItem(LS.theme,t);
}
document.getElementById('themeToggle').addEventListener('click',()=>{
  const cur=localStorage.getItem(LS.theme)==='light'?'dark':'light';
  applyTheme(cur);
  document.querySelector('#themeToggle .ic').textContent = cur==='light'?'☀️':'🌙';
});

// ====== ROUTINE VIEW ======
function renderRoutine(){
  const grid=document.getElementById('routineGrid');
  grid.innerHTML = Object.entries(ROUTINE).map(([key,rt])=>{
    const color = key==='Push'?'var(--push)':key==='Pull'?'var(--pull)':'var(--legs)';
    return `<div class="routine-card" style="border-top:3px solid ${color}">
      <div class="routine-header">
        <h2>${rt.emoji} ${rt.name}</h2>
        <span class="sets-count">${rt.sets} sets</span>
      </div>
      <div class="routine-body">
        ${rt.exs.map((ex,i)=>`
          <div class="routine-ex" data-key="${key}" data-idx="${i}">
            <span class="ex-icon">${ex.icon}</span>
            <div class="ex-info">
              <div class="ex-name">${ex.name}</div>
              <div class="ex-meta">${ex.sets}×${ex.reps} · ${ex.muscle}</div>
            </div>
            <span class="ex-mg">${ex.muscle}</span>
            <button class="ex-view">🔍</button>
          </div>
        `).join('')}
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.routine-ex').forEach(el=>{
    el.addEventListener('click',()=>{
      const key=el.dataset.key, idx=parseInt(el.dataset.idx);
      showExerciseModal(key, idx);
    });
  });
}

// ====== MODAL ======
function showExerciseModal(key, idx){
  const ex=ROUTINE[key].exs[idx];
  document.getElementById('modalTitle').textContent = ex.name;
  document.getElementById('modalMG').textContent = ex.muscle;
  document.getElementById('modalMG').style.background = key==='Push'?'rgba(239,68,68,.15)':key==='Pull'?'rgba(59,130,246,.15)':'rgba(34,197,94,.15)';
  document.getElementById('modalMG').style.color = key==='Push'?'var(--push)':key==='Pull'?'var(--pull)':'var(--legs)';
  document.getElementById('modalSets').textContent = ex.sets;
  document.getElementById('modalReps').textContent = ex.reps;
  document.getElementById('modalMuscle').textContent = ex.muscle;
  document.getElementById('modalDay').textContent = ROUTINE[key].emoji+' '+ROUTINE[key].name;
  document.getElementById('modalTips').textContent = '💡 Mẹo: '+ex.tip;

  // images: support multiple options (main + alt) + 0/1
  const opts = getExImgs(ex);
  const wrap = document.getElementById('modalImgWrap');

  function renderOpt(optIdx) {
    const opt = opts[optIdx];
    if (!opt || !opt.imgs.length) {
      wrap.innerHTML = `<div class="placeholder"><span class="big">${ex.icon}</span><span>${ex.name}<br><small>Không có ảnh minh hoạ</small></span></div>`;
      return;
    }
    // show 2 images side by side
    const imgs = opt.imgs.map((src, i) => {
      const cls = i === 0 ? 'img-start' : 'img-end';
      const lbl = i === 0 ? 'Bắt đầu' : 'Kết thúc';
      return `<div class="img-col"><div class="img-frame"><img src="${src}" alt="${ex.name}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'height:160px\\'><span class=\\'big\\' style=\\'font-size:32px\\'>${ex.icon}</span><span style=\\'font-size:12px\\'>Không tải được</span></div>'"></div><div class="img-label">${lbl}</div></div>`;
    }).join('');
    const tabs = opts.length > 1 ? `<div class="modal-tabs">${opts.map((o, i) => `<button class="modal-tab ${i === optIdx ? 'active' : ''}" data-oi="${i}">${o.label}</button>`).join('')}</div>` : '';
    wrap.innerHTML = tabs + `<div class="img-pair">${imgs}</div>`;
    // bind tabs
    wrap.querySelectorAll('.modal-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const oi = parseInt(btn.dataset.oi);
        renderOpt(oi);
      });
    });
  }
  renderOpt(0);
  document.getElementById('exModal').classList.add('open');
}
document.getElementById('modalClose').addEventListener('click',()=>document.getElementById('exModal').classList.remove('open'));
document.getElementById('exModal').addEventListener('click',e=>{ if(e.target===e.currentTarget) e.target.classList.remove('open'); });

// ====== ROUTINE → WORKOUT ======
['Push','Pull','Legs'].forEach(k=>{
  const btn = document.getElementById('rtn'+k);
  if(btn) btn.addEventListener('click',()=>{
    try{
      fillWorkoutFromRoutine(k);
      switchView('workout');
    }catch(err){
      showErr('Lỗi khi chuyển: '+err.message);
    }
  });
});

// hiện lỗi đỏ lên đầu trang để debug nhanh
function showErr(msg){
  let b=document.getElementById('errBanner');
  if(!b){
    b=document.createElement('div');
    b.id='errBanner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;padding:8px 16px;font:11px/1.4 monospace;white-space:pre-wrap';
    document.body.prepend(b);
  }
  b.textContent='⚠ '+msg;
}
window.addEventListener('error',e=>{ showErr(e.message+'\n'+e.filename+':'+e.lineno); });

function switchView(name){
  // 1) bỏ active toàn bộ nav + view
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  // 2) bật view đích — ép cả class lẫn style cho chắc
  const v=document.getElementById('view-'+name);
  if(v){ v.classList.add('active'); v.style.display='block'; }
  const nav=document.querySelector('[data-view="'+name+'"]');
  if(nav) nav.classList.add('active');
  window.scrollTo(0,0);
  try{ renderAll(); }catch(err){ showErr('renderAll: '+err.message); }
}

function fillWorkoutFromRoutine(key){
  document.getElementById('wDate').value = today();
  document.querySelectorAll('#wTypeBtns .type-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.type===key);
  });
  wType = key;
  const container=document.getElementById('exerciseRows');
  container.innerHTML='';
  ROUTINE[key].exs.forEach(ex=>{
    const d=document.createElement('div');
    d.className='form-row'; d.style.marginBottom='0'; d.style.alignItems='center';
    d.innerHTML = `
      <input type="text" class="ex-name" list="exList" placeholder="Bài tập" value="${ex.name}" style="flex:1;min-width:120px">
      <datalist id="exList"></datalist>
      <div class="field"><label>Sets</label><input type="number" class="ex-sets" min="1" value="${ex.sets}" style="width:60px"></div>
      <div class="field"><label>Reps</label><input type="number" class="ex-reps" min="1" value="${parseInt(ex.reps)}" style="width:70px"></div>
      <div class="field"><label>Kg</label><input type="number" class="ex-w" min="0" step="0.5" value="0" style="width:70px"></div>
      <button class="btn danger ex-del">✕</button>`;
    d.querySelector('.ex-del').addEventListener('click',()=>d.remove());
    d.querySelector('.ex-name').addEventListener('input',()=>fillExList());
    container.appendChild(d);
  });
  fillExList();
}

// ====== WORKOUT ======
document.getElementById('wDate').value = today();
let wType = 'Push';
document.querySelectorAll('#wTypeBtns .type-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#wTypeBtns .type-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); wType=b.dataset.type;
  });
});

const EXERCISES = {
  'Push':['Bench Press','Incline Dumbbell Press','Pec Deck','Chest Fly','Lateral Raise','Shoulder Press','Tricep Pushdown'],
  'Pull':['Lat Pulldown','Seated Cable Row','One-Arm Cable Lat Pulldown','Straight-Arm Pulldown','Preacher Curl','Hammer Curl'],
  'Legs':['Squat','Leg Press','Bulgarian Split Squat','Leg Extension','Leg Curl','Abductor','Abdominal Crunch Machine','Leg Raise'],
  'Cardio':['Chạy bộ','Đạp xe','Máy chèo','Jump Rope'],
  'Full body':['Squat','Bench Press','Deadlift','Row','Shoulder Press']
};
function exerciseRow(ex){
  const d=document.createElement('div');
  d.className='form-row'; d.style.marginBottom='0'; d.style.alignItems='center';
  d.innerHTML = `
    <input type="text" class="ex-name" list="exList" placeholder="Bài tập" value="${(ex&&ex.name)||''}" style="flex:1;min-width:120px">
    <datalist id="exList"></datalist>
    <div class="field"><label>Sets</label><input type="number" class="ex-sets" min="1" value="${(ex&&ex.sets)||3}" style="width:60px"></div>
    <div class="field"><label>Reps</label><input type="number" class="ex-reps" min="1" value="${(ex&&ex.reps)||10}" style="width:70px"></div>
    <div class="field"><label>Kg</label><input type="number" class="ex-w" min="0" step="0.5" value="${(ex&&ex.w)||0}" style="width:70px"></div>
    <button class="btn danger ex-del">✕</button>`;
  d.querySelector('.ex-del').addEventListener('click',()=>d.remove());
  d.querySelector('.ex-name').addEventListener('input',()=>fillExList());
  return d;
}
function fillExList(){
  const dl=document.getElementById('exList'); dl.innerHTML='';
  const seen=new Set();
  (EXERCISES[wType]||[]).forEach(e=>{ const o=document.createElement('option'); o.value=e; dl.appendChild(o); seen.add(e); });
  document.querySelectorAll('.ex-name').forEach(i=>{ const v=i.value.trim(); if(v&&!seen.has(v)){ const o=document.createElement('option'); o.value=v; dl.appendChild(o); seen.add(v); } });
}
document.getElementById('exerciseRows').appendChild(exerciseRow(null));
document.getElementById('addExercise').addEventListener('click',()=>{
  document.getElementById('exerciseRows').appendChild(exerciseRow(null)); fillExList();
});
document.getElementById('resetWorkout').addEventListener('click',()=>{
  if(!document.querySelectorAll('#exerciseRows .form-row').length) return;
  if(!confirm('Reset toàn bộ bài tập trong buổi này?')) return;
  const c=document.getElementById('exerciseRows');
  c.innerHTML='';
  c.appendChild(exerciseRow(null));
  fillExList();
  document.getElementById('wDur').value='';
  document.getElementById('wCal').value='';
});
document.getElementById('saveWorkout').addEventListener('click',()=>{
  const date=document.getElementById('wDate').value||today();
  const dur=num(document.getElementById('wDur').value);
  const cal=num(document.getElementById('wCal').value);
  const exs=[...document.querySelectorAll('#exerciseRows .form-row')]
    .map(r=>({name:r.querySelector('.ex-name').value.trim(),sets:num(r.querySelector('.ex-sets').value),reps:num(r.querySelector('.ex-reps').value),w:num(r.querySelector('.ex-w').value)}))
    .filter(e=>e.name);
  if(!exs.length){ alert('Thêm ít nhất 1 bài tập'); return; }
  workouts.push({id:Date.now(), date, type:wType, dur, cal, exs});
  save(LS.workouts, workouts);
  renderAll();
  alert('✅ Đã lưu buổi tập!');
});
function renderWorkoutList(){
  const el=document.getElementById('workoutList');
  const sorted=[...workouts].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){ el.innerHTML='<div class="empty">Chưa có buổi tập nào</div>'; return; }
  el.innerHTML = sorted.slice(0,20).map(w=>`
    <div class="list-item">
      <div class="grow">
        <div class="name"><span class="badge ${w.type==='Push'?'push':w.type==='Pull'?'pull':w.type==='Legs'?'legs':'gray'}">${w.type}</span> ${vnDate(w.date)} ${w.dur?'· '+w.dur+' phút':''}</div>
        <div class="meta">${w.exs.map(e=>`${e.name} ${e.sets}×${e.reps}${e.w?' @'+e.w+'kg':''}`).join(' · ')}</div>
      </div>
      ${w.cal?`<span class="badge green">🔥 ${fmt(w.cal)} kcal</span>`:''}
      <button class="btn danger" data-del="${w.id}">✕</button>
    </div>`).join('');
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá buổi tập này?')){ workouts=workouts.filter(w=>w.id!=b.dataset.del); save(LS.workouts,workouts); renderAll(); }
  }));
}

// ====== MEALS ======
function addMeal(){
  const date = today();
  const name=document.getElementById('mName').value.trim();
  const cal=num(document.getElementById('mCalV').value);
  if(!name&&cal<=0){ alert('Nhập tên món hoặc calo'); return; }
  const m={id:Date.now(), date, meal:document.getElementById('mMeal').value,
    name:name||'Món ăn', cal, pro:num(document.getElementById('mProV').value),
    carb:num(document.getElementById('mCarbV').value), fat:num(document.getElementById('mFatV').value)};
  meals.push(m); save(LS.meals, meals);
  document.getElementById('mName').value=''; ['mCalV','mProV','mCarbV','mFatV'].forEach(i=>document.getElementById(i).value='');
  renderAll();
}
document.getElementById('addMeal').addEventListener('click', addMeal);
document.getElementById('mName').addEventListener('keydown', e=>{ if(e.key==='Enter') addMeal(); });

function dayTotals(day){
  return meals.filter(m=>m.date===day).reduce((a,m)=>({cal:a.cal+m.cal,pro:a.pro+m.pro,carb:a.carb+m.carb,fat:a.fat+m.fat}),{cal:0,pro:0,carb:0,fat:0});
}
function renderDiet(){
  const t=dayTotals(today());
  const pct=(v,g)=>g>0?Math.min(100,v/g*100):0;
  document.getElementById('mCal').textContent=fmt(t.cal);
  document.getElementById('mCalG').textContent=fmt(goals.cal);
  document.getElementById('mPro').textContent=fmt(t.pro);
  document.getElementById('mCarb').textContent=fmt(t.carb);
  document.getElementById('mFat').textContent=fmt(t.fat);
  const bar=document.getElementById('macroBar'); bar.innerHTML='';
  const segs=[['protein',t.pro,goals.pro,'#3b82f6'],['carbs',t.carb,goals.carb,'#f59e0b'],['fat',t.fat,goals.fat,'#a855f7']];
  const totalPct=segs.reduce((s,x)=>s+pct(x[1],x[2]),0);
  segs.forEach(s=>{ const p=totalPct>100?pct(s[1],s[2])/totalPct*100:pct(s[1],s[2]); if(p>0){ const el=document.createElement('span'); el.style.width=p+'%'; el.style.background=s[3]; bar.appendChild(el); } });
  if(t.cal>goals.cal) bar.style.border='1px solid var(--red)'; else bar.style.border='none';

  const el=document.getElementById('mealList');
  const tMeals=meals.filter(m=>m.date===today()).sort((a,b)=>a.id-b.id);
  el.innerHTML = tMeals.length? tMeals.map(m=>`
    <div class="list-item">
      <div class="grow"><div class="name">${m.meal} · ${m.name}</div>
      <div class="meta">P ${m.pro}g · C ${m.carb}g · F ${m.fat}g</div></div>
      <span class="badge gray">${fmt(m.cal)} kcal</span>
      <button class="btn danger" data-del="${m.id}">✕</button>
    </div>`).join('') : '<div class="empty">Chưa có bữa ăn nào hôm nay</div>';
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá bữa ăn này?')){ meals=meals.filter(m=>m.id!=b.dataset.del); save(LS.meals,meals); renderAll(); }
  }));

  const hist=document.getElementById('dietHistory');
  const days=[...Array(7)].map((_,i)=>daysAgo(6-i));
  hist.innerHTML = `<table><thead><tr><th>Ngày</th><th>Calo</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead><tbody>`+
    days.map(d=>{ const x=dayTotals(d); return `<tr><td>${d===today()?'Hôm nay':vnDate(d)}</td><td class="weight-cell">${fmt(x.cal)}</td><td>${fmt(x.pro)}g</td><td>${fmt(x.carb)}g</td><td>${fmt(x.fat)}g</td></tr>`; }).join('')+
    `</tbody></table>`;
}
document.getElementById('saveGoals').addEventListener('click',()=>{
  goals={cal:num(document.getElementById('gCal').value,2400),pro:num(document.getElementById('gPro').value,150),carb:num(document.getElementById('gCarb').value,250),fat:num(document.getElementById('gFat').value,70)};
  save(LS.goals, goals); renderAll(); alert('✅ Đã lưu mục tiêu');
});

// ====== WEIGHT ======
document.getElementById('wtDate').value = today();
document.getElementById('saveWeight').addEventListener('click',()=>{
  const date=document.getElementById('wtDate').value||today();
  const v=num(document.getElementById('wtVal').value);
  if(v<=0){ alert('Nhập cân nặng hợp lệ'); return; }
  weights=weights.filter(w=>w.date!==date);
  weights.push({date, v}); save(LS.weights, weights); renderAll();
});
function renderWeight(){
  const sorted=[...weights].sort((a,b)=>a.date.localeCompare(b.date));
  const el=document.getElementById('weightChart');
  if(sorted.length<2){ el.innerHTML='<div class="empty">Nhập ít nhất 2 lần để xem biểu đồ</div>'; }
  else{
    const vals=sorted.map(w=>w.v); const min=Math.min(...vals), max=Math.max(...vals);
    const range=Math.max(max-min,0.5);
    el.innerHTML = '<div class="chart-wrap" style="height:200px;align-items:flex-start">'+
      sorted.map(w=>{
        const h=((w.v-min)/range*100)+6;
        const color=w.v<=vals[0]? 'linear-gradient(180deg,var(--accent2),#15803d)' : 'linear-gradient(180deg,var(--accent),#d97706)';
        return `<div class="bar" style="display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%">
          <div class="tip">${w.v} kg · ${vnDate(w.date)}</div>
          <div style="height:${h}%;width:100%;border-radius:6px 6px 0 0;background:${color}"></div>
        </div>`;
      }).join('')+'</div>';
    el.innerHTML += `<div class="chart-wrap" style="height:auto;padding-top:0">${sorted.map(w=>`<div class="bar-label">${w.date===today()?'Hôm nay':vnDate(w.date)}</div>`).join('')}</div>`;
  }
  const list=[...sorted].reverse();
  document.getElementById('weightList').innerHTML = list.length?
    list.map((w,i)=>`
      <div class="list-item">
        <div class="grow"><div class="name">${vnDate(w.date)}${w.date===today()?' (hôm nay)':''}</div></div>
        <span class="weight-cell" style="font-size:16px">${w.v} kg</span>
        ${i>0?`<span class="badge ${w.v<=list[i-1].v?'green':'red'}">${w.v<=list[i-1].v?'▼':'▲'} ${Math.abs(w.v-list[i-1].v).toFixed(1)}</span>`:''}
        <button class="btn danger" data-del="${w.id||w.date}">✕</button>
      </div>`).join('') : '<div class="empty">Chưa có dữ liệu</div>';
  document.querySelectorAll('#weightList [data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá mục này?')){ weights=weights.filter(w=>(w.id||w.date)!=b.dataset.del); save(LS.weights,weights); renderAll(); }
  }));
}

// ====== HOME ======
function getStreak(){
  let streak=0; const set=new Set(workouts.map(w=>w.date));
  let d=new Date();
  if(!set.has(d.toISOString().slice(0,10))) d.setDate(d.getDate()-1);
  while(set.has(d.toISOString().slice(0,10))){ streak++; d.setDate(d.getDate()-1); }
  return streak;
}
function renderHome(){
  const [ws,we]=weekRange();
  const wk=workouts.filter(w=>w.date>=ws&&w.date<=we);
  document.getElementById('greetName').textContent = userName || 'bạn';
  document.getElementById('stWorkouts').textContent=wk.length;
  document.getElementById('stStreak').textContent=getStreak();
  const cal7=workouts.filter(w=>w.date>=daysAgo(6)).reduce((a,w)=>a+w.cal,0);
  document.getElementById('stCal').textContent=fmt(cal7);
  document.getElementById('stKcalIn').textContent=fmt(dayTotals(today()).cal);

  const hour=new Date().getHours();
  const g=hour<12?'Chúc buổi sáng':hour<18?'Chúc buổi trưa':'Chúc buổi tối';
  const todayW=wk.find(w=>w.date===today());
  const t=dayTotals(today());
  const msg = todayW? `💪 ${g}! Hôm nay bạn đã tập ${todayW.type} ${todayW.dur?todayW.dur+' phút':''}. ${t.cal?`Đã nạp ${fmt(t.cal)}/${fmt(goals.cal)} kcal.`:''} Cố lên!`
    : `💪 ${g}! Hôm nay bạn chưa tập. ${t.cal?`Đã nạp ${fmt(t.cal)}/${fmt(goals.cal)} kcal.`:''} Xem giáo án và tập ngay nhé!`;
  document.getElementById('greetMsg').textContent=msg;

  document.getElementById('weekWorkouts').innerHTML = wk.length?
    [...wk].sort((a,b)=>b.date.localeCompare(a.date)).map(w=>`
      <div class="list-item">
        <div class="grow"><div class="name"><span class="badge ${w.type==='Push'?'push':w.type==='Pull'?'pull':w.type==='Legs'?'legs':'gray'}">${w.type}</span> ${w.date===today()?'Hôm nay':vnDate(w.date)}</div>
        <div class="meta">${w.exs.length} bài tập ${w.dur?'· '+w.dur+' phút':''}</div></div>
        ${w.cal?`<span class="badge green">${fmt(w.cal)} kcal</span>`:''}
      </div>`).join('')
    : '<div class="empty">Chưa có buổi tập tuần này</div>';

  const tMeals=meals.filter(m=>m.date===today());
  document.getElementById('todayMeals').innerHTML = tMeals.length?
    tMeals.map(m=>`<div class="list-item"><div class="grow"><div class="name">${m.meal} · ${m.name}</div></div><span class="badge gray">${fmt(m.cal)} kcal</span></div>`).join('')
    : '<div class="empty">Chưa có bữa ăn nào</div>';

  const now=new Date(); const ym=now.toISOString().slice(0,7);
  const mWs=meals.filter(m=>m.date.startsWith(ym)).reduce((a,m)=>a+m.cal,0);
  const mWk=workouts.filter(w=>w.date.startsWith(ym)).length;
  document.getElementById('monthSummary').textContent = `Nạp ${fmt(mWs)} kcal · ${mWk} buổi tập`;
  const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const chart=document.getElementById('monthChart'); chart.innerHTML='';
  const dayCals=[...Array(daysInMonth)].map((_,i)=>{
    const d=`${ym}-${String(i+1).padStart(2,'0')}`;
    return {d, cal:meals.filter(m=>m.date===d).reduce((a,m)=>a+m.cal,0), w:workouts.filter(w=>w.date===d).length};
  });
  const maxC=Math.max(...dayCals.map(x=>x.cal),1);
  dayCals.forEach(x=>{
    const b=document.createElement('div'); b.className='bar'; b.style.height='100%';
    b.innerHTML=`<div class="tip">${vnDate(x.d)} · ${fmt(x.cal)} kcal${x.w?' · 💪'+x.w:''}</div><div class="fill" style="height:${x.cal/maxC*100}%"></div><div class="bar-label">${String(x.d.slice(8)).padStart(2,'0')}</div>`;
    chart.appendChild(b);
  });
  chart.children[now.getDate()-1].style.background='var(--accent)';
}

// ====== PROGRESS ======
function calcPR(exName){
  return workouts.flatMap(w=>w.exs.map(e=>({date:w.date,type:w.type,name:e.name,sets:e.sets,reps:e.reps,w:e.w})))
    .filter(e=>e.name.toLowerCase()===exName.toLowerCase() && e.w>0)
    .reduce((best,e)=> e.w>best.w?e:best, {w:0});
}
function renderWeekly(){
  const el=document.getElementById('prog-weekly');
  const [ws,we]=weekRange();
  const days=[...Array(7)].map((_,i)=>{ const d=new Date(ws); d.setDate(new Date(ws).getDate()+i); return d.toISOString().slice(0,10); });
  const wk=workouts.filter(w=>w.date>=ws&&w.date<=we);
  const totalCal=wk.reduce((a,w)=>a+w.cal,0);
  const totalMin=wk.reduce((a,w)=>a+w.dur,0);
  const types={}; wk.forEach(w=>types[w.type]=(types[w.type]||0)+1);
  const cals=days.map(d=>dayTotals(d).cal);
  const avgCal=cals.reduce((a,b)=>a+b,0)/7;
  el.innerHTML = `
    <div class="grid stats" style="margin-bottom:16px">
      <div class="stat"><div class="ic">🏋️</div><div class="val">${wk.length}</div><div class="lbl">Buổi tập</div></div>
      <div class="stat"><div class="ic">🔥</div><div class="val">${fmt(totalCal)}</div><div class="lbl">Kcal đốt</div></div>
      <div class="stat"><div class="ic">⏱️</div><div class="val">${totalMin}</div><div class="lbl">Phút tập</div></div>
      <div class="stat"><div class="ic">🍗</div><div class="val">${fmt(avgCal)}</div><div class="lbl">Kcal/ngày nạp</div></div>
    </div>
    <div class="card"><h3>🥗 Calo nạp 7 ngày</h3><div class="chart-wrap" id="wkChart"></div></div>
    <div class="card"><h3>💪 Phân bố loại buổi</h3>${Object.keys(types).length?
      Object.entries(types).map(([t,c])=>`<div class="list-item"><div class="grow"><div class="name"><span class="badge ${t==='Push'?'push':t==='Pull'?'pull':t==='Legs'?'legs':'gray'}">${t}</span></div></div><span class="badge gray">${c} buổi</span></div>`).join('')
      :'<div class="empty">Chưa có dữ liệu</div>'}</div>`;
  const c=document.getElementById('wkChart'); c.innerHTML='';
  const max=Math.max(...cals,1);
  days.forEach((d,i)=>{
    const b=document.createElement('div'); b.className='bar'; b.style.height='100%';
    b.innerHTML=`<div class="tip">${d===today()?'Hôm nay':vnDate(d)} · ${fmt(cals[i])} kcal</div><div class="fill" style="height:${cals[i]/max*100}%"></div><div class="bar-label">${d===today()?'Hôm nay':vnDate(d)}</div>`;
    c.appendChild(b);
  });
}
function renderExercise(){
  const el=document.getElementById('prog-exercise');
  const exNames=[...new Set(workouts.flatMap(w=>w.exs).map(e=>e.name))];
  if(!exNames.length){ el.innerHTML='<div class="empty">Chưa có bài tập nào để phân tích</div>'; return; }
  el.innerHTML = `<table><thead><tr><th>Bài tập</th><th>Lần tập</th><th>PR (max kg)</th><th>Best set</th></tr></thead><tbody>`+
    exNames.map(n=>{ const pr=calcPR(n); return `<tr><td>${n}</td><td>${workouts.filter(w=>w.exs.some(e=>e.name.toLowerCase()===n.toLowerCase())).length}</td><td class="weight-cell">${pr.w?pr.w+' kg':'-'}</td><td>${pr.w?`${pr.reps} reps`:''}</td></tr>`; }).join('')+
    `</tbody></table>`;
}
function renderPlan(){
  const el=document.getElementById('prog-plan');
  const [ws,we]=weekRange();
  const wk=workouts.filter(w=>w.date>=ws&&w.date<=we);
  const split={}; wk.forEach(w=>split[w.type]=(split[w.type]||0)+1);
  const order=['Push','Pull','Legs','Cardio','Full body'];
  const avgCal=dayTotals(today()).cal;
  const deficit=goals.cal-avgCal;
  const wTarget = deficit>250 ? '🥗 Calo hôm nay thấp hơn mục tiêu ' + fmt(deficit)+' kcal → hôm sau ăn thêm hoặc giảm tập' : deficit<-250 ? '🔥 Ăn vượt '+fmt(-deficit)+' kcal → tăng thêm cardio hoặc siết lại phần ăn vặt' : '✅ Calo đang cân bằng tốt, giữ nhịp!';
  const nextType = order.find(t=>!split[t]) || order[(order.findIndex(t=>split[t])+1)%order.length];
  let plan='';
  plan += `<div class="card"><h3>💪 Gợi ý lịch tập tuần này</h3><div class="list-item"><div class="grow"><div class="name">Nếu hôm nay chưa tập, hãy thử: <b>${nextType}</b></div><div class="meta">Duy trì 3-4 buổi/tuần (Push → Pull → Legs → nghỉ → lặp lại)</div></div></div>`;
  plan += `<div class="card"><h3>🍎 Gợi ý meal plan hôm nay</h3><div class="list-item"><div class="grow"><div class="name">${wTarget}</div></div></div><div class="list-item"><div class="grow"><div class="name">Mục tiêu protein: <b>${goals.pro}g</b></div></div></div><div class="list-item"><div class="grow"><div class="name">Nước: uống 2-3L/ngày</div></div></div></div>`;
  plan += `<div class="card"><h3>📊 Nhận xét tiến độ</h3>`;
  const wLast=weights.filter(w=>w.date<=today()).sort((a,b)=>b.date.localeCompare(a.date));
  if(wLast.length>=2){
    const diff=wLast[0].v-wLast[1].v;
    plan += `<div class="list-item"><div class="grow"><div class="name">Cân nặng gần nhất: <b>${wLast[0].v} kg</b> ${diff>0?'(▲ tăng '+diff.toFixed(1)+'kg)':diff<0?'(▼ giảm '+Math.abs(diff).toFixed(1)+'kg)':'(không đổi)'}</div></div></div>`;
  } else plan += `<div class="list-item"><div class="grow"><div class="name">Ghi cân nặng ít nhất 2 lần để theo dõi xu hướng</div></div></div>`;
  plan += `</div>`;
  el.innerHTML=plan;
}
document.querySelectorAll('#progTabs .tab').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#progTabs .tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  ['weekly','exercise','plan'].forEach(t=>document.getElementById('prog-'+t).style.display = t===b.dataset.tab?'block':'none');
  if(b.dataset.tab==='weekly') renderWeekly();
  if(b.dataset.tab==='exercise') renderExercise();
  if(b.dataset.tab==='plan') renderPlan();
}));

// ====== RENDER ALL ======
function renderAll(){
  renderHome(); renderRoutine(); renderWorkoutList(); renderDiet(); renderWeight(); renderWeekly(); renderExercise(); renderPlan();
}
renderAll();