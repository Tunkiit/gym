'use strict';
// ====== GYM TRACKER - Main Script ======

// ====== STATE ======
const LS = {
  goals:'gym_goals', workouts:'gym_workouts', meals:'gym_meals',
  weights:'gym_weights', name:'gym_name', theme:'gym_theme'
};
function load(k, fb){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?fb:v }catch(e){ return fb } }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(e){} }

let goals = load(LS.goals, {cal:2400, pro:150, carb:250, fat:70, mode:'maintain'});
if(!goals.mode) goals.mode='maintain';
let workouts = load(LS.workouts, []);
let meals = load(LS.meals, []);
let weights = load(LS.weights, []);
// Thông số cơ thể: chiều cao, tuổi, giới tính, mức vận động
let body = load('gym_body', {height:0, age:0, gender:'male', active:1.4});

// Ngày theo GIỜ ĐỊA PHƯƠNG (không dùng toISOString vì nó là UTC → 5-6h sáng bị lùi 1 ngày)
function localISO(d=new Date()){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
const clockNow = () => new Date().toTimeString().slice(0,5);
const today = () => localISO();
function mealTiming(m){
  if(!m.time) return '';
  const candidates=workouts.filter(w=>w.date===m.date&&w.time);
  if(!candidates.length) return '';
  const mt=m.time.split(':').reduce((a,v)=>a*60+Number(v),0);
  const nearest=candidates.map(w=>({w, diff:w.time.split(':').reduce((a,v)=>a*60+Number(v),0)-mt}))
    .sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff))[0];
  if(Math.abs(nearest.diff)>180) return '';
  const mins=Math.abs(nearest.diff);
  return nearest.diff>0 ? `Trước tập ${mins?mins+' phút':'ngay'}` : `Sau tập ${mins?mins+' phút':'ngay'}`;
}
const num = (v,d=0) => { const n=parseFloat(v); return isNaN(n)?d:n; };
const fmt = n => Math.round(n).toLocaleString('vi-VN');
// Escape chuỗi người dùng nhập trước khi chèn vào innerHTML (tránh chạy mã lạ từ file backup)
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function daysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return localISO(d); }
function weekRange(){
  const d=new Date(); const day=d.getDay()||7; const start=new Date(d); start.setDate(d.getDate()-day+1);
  const end=new Date(d); return [localISO(start), localISO(end)];
}
function vnDate(s){ const p=s.split('-'); return `${p[2]}/${p[1]}`; }
function vnDateFull(s){ const p=s.split('-'); const d=new Date(+p[0],+p[1]-1,+p[2]); return d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'}); }

// ====== NAME ======
let userName = localStorage.getItem(LS.name) || '';
function askName(){
  if(userName) return;
  const n = prompt('Bạn tên gì? (để trống nếu không muốn)');
  if(n){ userName=n.trim(); localStorage.setItem(LS.name,userName); }
}
askName();

// ====== NAV ======
const sidebar=document.getElementById('sidebar'), scrim=document.getElementById('scrim'), mobTitle=document.getElementById('mobTitle');
function openDrawer(){ sidebar.classList.add('open'); scrim.classList.add('open'); }
function closeDrawer(){ sidebar.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('mobMenu').addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
document.getElementById('mobHome').addEventListener('click', ()=>switchView('home'));
const VIEW_NAMES={home:'Trang chủ',workout:'Buổi tập',diet:'Ăn uống',weight:'Cơ thể',progress:'Tiến độ',guide:'Hướng dẫn'};
document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click',()=>{
    switchView(b.dataset.view);
    closeDrawer();
  });
});

// ====== THEME ======
const LIGHT = {
  '--bg':'#f6f7f9','--card':'#ffffff','--card2':'#eef1f5','--border':'#e0e5ec',
  '--fg':'#1a2029','--muted':'#64748b','--accent':'#f59e0b','--accent2':'#16a34a','--red':'#dc2626'
};
if(localStorage.getItem(LS.theme)==='light'){ applyTheme('light'); document.querySelector('#themeToggle .ic').textContent='☀️'; }
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


// ====== MODAL ======
function showExerciseModalEx(ex, dayName, emoji){
  document.getElementById('modalTitle').textContent = ex.name;
  const muscle = ex.muscle||'Nhóm cơ chính';
  const icon = ex.icon||'🏋️';
  const tip = ex.tip||'Giữ form ổn định, tập có kiểm soát.';
  document.getElementById('modalMG').textContent = muscle;
  const color = emoji==='🔴'?'var(--push)':emoji==='🔵'?'var(--pull)':emoji==='🟢'?'var(--legs)':'var(--accent)';
  document.getElementById('modalMG').style.background = color.replace('var(--push)','rgba(239,68,68,.15)').replace('var(--pull)','rgba(59,130,246,.15)').replace('var(--legs)','rgba(34,197,94,.15)').replace('var(--accent)','rgba(245,158,11,.15)');
  document.getElementById('modalMG').style.color = color;
  document.getElementById('modalSets').textContent = ex.sets;
  document.getElementById('modalReps').textContent = ex.reps;
  document.getElementById('modalMuscle').textContent = muscle;
  document.getElementById('modalDay').textContent = (emoji||'')+' '+(dayName||'');
  document.getElementById('modalTips').textContent = '💡 Mẹo: '+tip;

  // images: support multiple options (main + alt) + 0/1
  const opts = getExImgs(ex);
  const wrap = document.getElementById('modalImgWrap');

  function renderOpt(optIdx) {
    const opt = opts[optIdx];
    if (!opt || !opt.imgs.length) {
      wrap.innerHTML = `<div class="placeholder"><span class="big">${icon}</span><span>${ex.name}<br><small>Không có ảnh minh hoạ</small></span></div>`;
      return;
    }
    // show 2 images side by side
    const imgs = opt.imgs.map((src, i) => {
      const cls = i === 0 ? 'img-start' : 'img-end';
      const lbl = i === 0 ? 'Bắt đầu' : 'Kết thúc';
      return `<div class="img-col"><div class="img-frame"><img src="${src}" alt="${ex.name}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'height:160px\\'><span class=\\'big\\' style=\\'font-size:32px\\'>${icon}</span><span style=\\'font-size:12px\\'>Không tải được</span></div>'"></div><div class="img-label">${lbl}</div></div>`;
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

// ====== CHỌN BUỔI (1 giáo án: PPL + Upper/Lower) ======
const curSplit = 'PPLUpperLower';
localStorage.removeItem('gym_split'); // dọn lựa chọn giáo án cũ
// Lịch tuần: getDay() → vị trí buổi trong giáo án (T2 Push=0 … T7 Lower=4), null = ngày nghỉ
const WEEK_PLAN = {1:'Push',2:'Pull',3:'Legs',4:null,5:'Upper',6:'Lower',0:null};
const DAY_EMOJI = {push:'🔴', pull:'🔵', legs:'🟢', upper:'🟣', lower:'🟡'};
function getDayMeta(dayIdx){
  const day=EXTRA_SPLITS[curSplit].days[+dayIdx];
  const emoji=DAY_EMOJI[day.name.split(' ')[0].toLowerCase()]||'🏋️';
  return {label:emoji+' '+day.name, exs:getSplitDay(curSplit,+dayIdx), emoji, name:day.name, sets:day.exs.reduce((a,e)=>a+e.sets,0)};
}
// Buổi của hôm nay; ngày nghỉ → buổi kế tiếp trong tuần
function todayDayIdx(){
  const days=EXTRA_SPLITS[curSplit].days;
  for(let k=0;k<7;k++){
    const t=WEEK_PLAN[(new Date().getDay()+k)%7];
    const i=t?days.findIndex(d=>d.name.startsWith(t)):-1;
    if(i>=0) return i;
  }
  return 0;
}

const daySelect = document.getElementById('daySelect');
daySelect.innerHTML = EXTRA_SPLITS[curSplit].days.map((d,i)=>`<option value="${i}">${getDayMeta(i).label}</option>`).join('');
daySelect.value = String(todayDayIdx());
daySelect.addEventListener('change',()=>renderRoutine());

document.getElementById('fillDay').addEventListener('click',()=>{
  const dayKey = daySelect.value;
  const m = getDayMeta(dayKey);
  fillWorkoutFromRoutine(m.exs, m.name, m.emoji);
  updateCalPreview();
  document.getElementById('exerciseRows').scrollIntoView({behavior:'smooth', block:'start'});
});

// ====== ROUTINE VIEW ======
function renderRoutine(){
  const grid=document.getElementById('routineGrid');
  const dayKey = daySelect.value;
  const m = getDayMeta(dayKey);
  const nm = m.name.toLowerCase();
  const color = nm.startsWith('push')?'var(--push)':nm.startsWith('pull')?'var(--pull)':nm.startsWith('legs')?'var(--legs)':'var(--accent)';
  grid.innerHTML = `<div class="routine-card" style="border-top:3px solid ${color}">
    <div class="routine-header">
      <h2>${m.label}</h2>
      <span class="sets-count">${m.sets} sets</span>
    </div>
    <div class="routine-body">
      ${m.exs.map((ex,i)=>`
        <div class="routine-ex" data-idx="${i}">
          <span class="ex-icon">${ex.icon||'🏋️'}</span>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">${ex.sets}×${ex.reps} · ${ex.muscle||'Nhóm cơ chính'}</div>
          </div>
          <span class="ex-mg">${ex.muscle||'Tập sức mạnh'}</span>
          <button class="ex-view">🔍</button>
        </div>
      `).join('')}
    </div>
  </div>`;
  grid.querySelectorAll('.routine-ex').forEach(el=>{
    el.addEventListener('click',()=>{
      const idx=parseInt(el.dataset.idx);
      const dayKey2=daySelect.value;
      const m2=getDayMeta(dayKey2);
      showExerciseModalEx(m2.exs[idx], m2.name, m2.emoji);
    });
  });
}

function switchView(name){
  // 1) bỏ active toàn bộ nav + view (inline style không dùng nữa — trước đây display='block' dính lại gây lỗi chồng view)
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  // 2) bật view đích
  const v=document.getElementById('view-'+name);
  if(v) v.classList.add('active');
  const nav=document.querySelector('[data-view="'+name+'"]');
  if(nav) nav.classList.add('active');
  window.scrollTo(0,0);
  // cập nhật tiêu đề thanh mobile
  if(mobTitle) mobTitle.textContent = VIEW_NAMES[name] || name;
  renderAll();
}

function fillWorkoutFromRoutine(exs, dayName, emoji){
  document.getElementById('wDate').value = today();
  // đồng bộ nút loại buổi: PPL → Push/Pull/Legs; giáo án khác → tên giáo án
  const wbtns=[...document.querySelectorAll('#wTypeBtns .type-btn')];
  // tên buổi bắt đầu bằng loại buổi: "Push — T2…", "PUSH — Ngực…", "Lower — T7…"
  const hit = wbtns.find(b=>dayName.toLowerCase().startsWith(b.dataset.type.toLowerCase()));
  const target = hit ? hit.dataset.type : 'Push';
  wbtns.forEach(b=>b.classList.toggle('active', b.dataset.type===target));
  wType = target;
  document.getElementById('intensityField').style.display = '';
  updateIntensityHint();
  const container=document.getElementById('exerciseRows');
  container.innerHTML='';
  exs.forEach(ex=>container.appendChild(exerciseRow(ex)));
  fillExList();
}

// ====== WORKOUT ======
let wType = 'Push'; // phải khai báo TRƯỚC khi dùng trong fillWorkoutFromRoutine
let editingWorkoutId = null;
let editingCardioId = null;
let editingMealId = null;
let mealBaseMacros = null;
document.getElementById('wDate').value = today();
document.getElementById('wTime').value = clockNow();
document.getElementById('mTime').value = clockNow();
document.querySelectorAll('#wTypeBtns .type-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#wTypeBtns .type-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); wType=b.dataset.type;
    fillExList(); // cập nhật gợi ý bài tập theo loại buổi vừa chọn
    updateCalPreview();
  });
});
// Cường độ: chọn mức → tính calo lại + hiện gợi ý
const INTENSITY_HINT = {
  '3.5': '🟢 Nhẹ: thở đều, nói chuyện thoải mái, nghỉ 2-3 phút giữa set',
  '4.5': '🟡 Vừa: thở gấp nhẹ, nói được nhưng ngắt quãng, nghỉ 1-2 phút',
  '5.5': '🔴 Nặng: thở gấp, chỉ nói được từng từ, nghỉ dưới 1 phút',
};
function updateIntensityHint(){
  const el = document.getElementById('intensityHint');
  if(!el) return;
  const active = document.querySelector('#intensityBtns .type-btn.active');
  const met = active?.dataset.met;
  el.textContent = INTENSITY_HINT[met] || '🟡 Vừa: thở gấp nhẹ, nói được nhưng ngắt quãng, nghỉ 1-2 phút';
}
document.querySelectorAll('#intensityBtns .type-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#intensityBtns .type-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    updateIntensityHint();
    updateCalPreview();
  });
});
updateIntensityHint(); // hiện hint mặc định khi load
// Gõ thời lượng → tính calo live
document.getElementById('wDur').addEventListener('input', updateCalPreview);

// Danh sách gợi ý bài tập (gộp tất cả giáo án + cardio)
const CARDIO_OPTIONS = ['Đi bộ trên máy','Đi bộ ngoài trời','Chạy bộ','Cầu lông','Bơi'];
const ALL_EX = (()=>{
  const names=new Set(CARDIO_OPTIONS);
  Object.values(ROUTINE).forEach(g=>g.exs.forEach(e=>names.add(e.name)));
  Object.values(EXTRA_SPLITS).forEach(s=>s.days.forEach(d=>d.exs.forEach(e=>names.add(e.name))));
  return [...names];
})();
// nhóm bài (Push/Pull/Legs) cho mọi bài — dùng để lọc gợi ý theo loại buổi
const GROUP = (()=>{
  const m={};
  Object.entries(ROUTINE).forEach(([k,g])=>g.exs.forEach(e=>m[e.name]=k));
  Object.entries(_G).forEach(([n,k])=>{ m[n]=k; });
  return m;
})();
// bài thuộc từng giáo án thêm (theo tên giáo án đang chọn trong ô loại buổi)
const SPLIT_EX = (()=>{
  const map={'Upper':'PPLUpperLower','Lower':'PPLUpperLower'};
  const o={};
  Object.entries(map).forEach(([label,key])=>{
    o[label]=new Set();
    EXTRA_SPLITS[key].days.forEach(d=>d.exs.forEach(e=>o[label].add(e.name)));
  });
  return o;
})();
// Cardio: MET từng môn (chuẩn ACSM)
const CARDIO_MET = {'Đi bộ trên máy':4.5,'Đi bộ ngoài trời':3.5,'Chạy bộ':9,'Cầu lông':7,'Bơi':8,'Đi bộ':3.5,'Đạp xe':6.5,'Máy chèo':7,'Jump Rope':11,'Cầu lông nhẹ':5.5,'Cầu lông vừa':7,'Cầu lông nặng':8};
const isCardio = n => !!CARDIO_MET[n];
// Cân nặng cơ thể: lấy mục gần nhất từ tab Cân nặng (localStorage), chưa có → 60
function getBodyWeight(){
  const ws = load(LS.weights, []);
  if(!ws.length) return 60;
  const sorted=[...ws].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const v = sorted[0].v != null ? sorted[0].v : sorted[0];
  return num(v, 60) || 60;
}
// ====== BODY (Cơ thể) ======
function getBMR(){
  const kg = getBodyWeight();
  const h = num(body.height), a = num(body.age);
  if(h>=100 && a>=10){ // Mifflin-St Jeor
    const base = 10*kg + 6.25*h - 5*a;
    return body.gender==='female' ? base-161 : base+5;
  }
  return 22*kg; // fallback đơn giản
}
function getTDEE(day=today()){
  const active = num(body.active, 1.4) || 1.4;
  const exercise = workouts.filter(w=>w.date===day).reduce((a,w)=>a+num(w.cal,0),0);
  return Math.round(getBMR()*active + exercise);
}
function renderTdee(){
  const el=document.getElementById('tdeeBox');
  const kg=getBodyWeight();
  const bmr=getBMR();
  const active=num(body.active,1.4)||1.4;
  const t=dayTotals(today());
  const exCal=workouts.filter(w=>w.date===today()).reduce((a,w)=>a+num(w.cal,0),0);
  const tdee=getTDEE();
  const balance=t.cal-tdee;
  const verdict = balance < -300 ? `🔥 Thâm hụt ${fmt(-balance)} kcal → đang giảm mỡ` : balance < 0 ? `🔥 Thâm hụt ${fmt(-balance)} kcal nhẹ → giữ nhịp` : balance > 300 ? `📈 Dư ${fmt(balance)} kcal → đang tăng cân` : `⚖️ Cân bằng (${fmt(balance)} kcal) — giữ nguyên`;
  el.innerHTML = `
    <div class="grid stats" style="grid-template-columns:repeat(2,1fr);margin-bottom:14px">
      <div class="stat"><div class="ic">⚖️</div><div class="val">${fmt(kg)}</div><div class="lbl">Cân nặng hiện tại</div></div>
      <div class="stat"><div class="ic">🛌</div><div class="val">${fmt(bmr)}</div><div class="lbl">BMR (calo nền)</div></div>
    </div>
    <div class="list-item">
      <div class="grow"><div class="name">Nạp vào hôm nay</div><div class="meta">Từ tab Ăn uống</div></div>
      <span class="badge gray">${fmt(t.cal)} kcal</span>
    </div>
    <div class="list-item">
      <div class="grow"><div class="name">Tiêu hao hôm nay (TDEE)</div><div class="meta">BMR × ${active} + tập luyện</div></div>
      <span class="badge gray">${fmt(tdee)} kcal</span>
    </div>
    ${exCal?`<div class="list-item"><div class="grow"><div class="name">Tập luyện hôm nay</div></div><span class="badge green">+${fmt(exCal)} kcal</span></div>`:''}
    <div class="list-item" style="border-color:var(--accent)">
      <div class="grow"><div class="name">Kết quả</div><div class="meta">Nạp − Tiêu hao</div></div>
      <span class="badge ${balance<0?'green':'red'}">${verdict}</span>
    </div>`;
}
document.getElementById('saveBody').addEventListener('click',()=>{
  body={height:num(document.getElementById('bHeight').value), age:num(document.getElementById('bAge').value),
    gender:document.getElementById('bGender').value, active:num(document.getElementById('bActive').value,1.4)};
  save('gym_body', body); renderAll(); alert('✅ Đã lưu thông số cơ thể');
});
// Calo buổi tập (chuẩn ACSM): MET × 3.5 × cân nặng × phút ÷ 200
function calcWorkoutKcal(){
  const dur = num(document.getElementById('wDur').value);
  if(dur<=0) return 0;
  const met = num(document.querySelector('#intensityBtns .type-btn.active')?.dataset.met, 4.5);
  return Math.round(met * 3.5 * getBodyWeight() * dur / 200);
}
function updateCalPreview(){
  const el = document.getElementById('calPreview');
  if(!el) return;
  const k = calcWorkoutKcal();
  el.textContent = k>0 ? '🔥 '+fmt(k)+' kcal' : '—';
  el.classList.toggle('has', k>0);
}
function calcCardioKcal(){
  const dur=num(document.getElementById('cDur').value);
  const met=CARDIO_MET[document.getElementById('cType').value]||0;
  return dur>0?Math.round(met*3.5*getBodyWeight()*dur/200):0;
}
function updateCardioPreview(){
  const el=document.getElementById('cCalPreview'); if(!el) return;
  const k=calcCardioKcal(); el.textContent=k?'🔥 '+fmt(k)+' kcal':'—'; el.classList.toggle('has',!!k);
}
function updateCardioFields(){
  const fields={
    'Đi bộ trên máy':['distance','speed','incline'],
    'Đi bộ ngoài trời':['distance','speed','elevation'],
    'Chạy bộ':['distance','pace','elevation'],
    'Cầu lông':['intensity'],
    'Bơi':['distance','pool','laps']
  };
  const active=new Set(fields[document.getElementById('cType').value]||[]);
  document.querySelectorAll('.cardio-field').forEach(el=>el.style.display=active.has(el.dataset.cardio)?'':'none');
  document.getElementById('cPoolOtherWrap').style.display=document.getElementById('cType').value==='Bơi'&&document.getElementById('cPool').value==='other'?'':'none';
}
['cType','cDur','cDistance','cSpeed','cIncline','cElevation','cPace','cIntensity','cPool','cPoolOther','cLaps'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{updateCardioFields();updateCardioPreview();}));
document.getElementById('cDate').value=today();
updateCardioFields();
document.getElementById('cTime').value=clockNow();
document.getElementById('saveCardio').addEventListener('click',()=>{
  const dur=num(document.getElementById('cDur').value);
  if(dur<=0){ alert('Nhập thời lượng cardio'); document.getElementById('cDur').focus(); return; }
  const name=document.getElementById('cType').value;
  const ex={name,sets:0,reps:0,w:dur,distance:num(document.getElementById('cDistance').value),speed:num(document.getElementById('cSpeed').value),incline:num(document.getElementById('cIncline').value),elevation:num(document.getElementById('cElevation').value),pace:num(document.getElementById('cPace').value),intensity:document.getElementById('cIntensity').value,poolLength:document.getElementById('cPool').value==='other'?num(document.getElementById('cPoolOther').value):num(document.getElementById('cPool').value),laps:num(document.getElementById('cLaps').value)};
  const cal=calcCardioKcal();
  const record={id:editingCardioId||Date.now(),date:document.getElementById('cDate').value||today(),time:document.getElementById('cTime').value||clockNow(),type:'Cardio',dur,cal,exs:[ex]};
  if(editingCardioId) workouts=workouts.map(w=>w.id===editingCardioId?record:w); else workouts.push(record);
  editingCardioId=null;
  save(LS.workouts,workouts); renderAll();
  alert('✅ Đã lưu cardio! Đốt ~'+fmt(cal)+' kcal');
  ['cDur','cDistance','cSpeed','cIncline','cElevation','cPace','cLaps','cPoolOther'].forEach(id=>document.getElementById(id).value=''); updateCardioPreview();
});
// Đưa 1 buổi cardio đã lưu lên form cardio để sửa
function editCardio(w){
  const e=w.exs[0]||{};
  const set=(id,v)=>{ document.getElementById(id).value = v ? v : ''; };
  if(CARDIO_OPTIONS.includes(e.name)) document.getElementById('cType').value=e.name;
  document.getElementById('cDate').value=w.date||today();
  document.getElementById('cTime').value=w.time||'';
  set('cDur', w.dur||e.w);
  set('cDistance', e.distance); set('cSpeed', e.speed); set('cIncline', e.incline);
  set('cElevation', e.elevation); set('cPace', e.pace); set('cLaps', e.laps);
  if(e.intensity) document.getElementById('cIntensity').value=e.intensity;
  if(e.poolLength){
    const std=['25','50'].includes(String(e.poolLength));
    document.getElementById('cPool').value = std ? String(e.poolLength) : 'other';
    set('cPoolOther', std ? '' : e.poolLength);
  }
  editingCardioId=w.id;
  updateCardioFields(); updateCardioPreview();
  document.getElementById('cardioCard').scrollIntoView({behavior:'smooth',block:'center'});
  alert('Đã đưa buổi cardio lên form — sửa rồi bấm Lưu cardio');
}
// Lần gần nhất đã tập bài này (bỏ qua buổi đang sửa) → {date, sets, reps, w}
function lastSet(name){
  const n=String(name||'').trim().toLowerCase();
  if(!n || isCardio(name)) return null;
  const past=workouts.filter(w=>w.id!==editingWorkoutId && w.type!=='Cardio')
    .sort((a,b)=>b.date.localeCompare(a.date) || (b.time||'').localeCompare(a.time||'') || b.id-a.id);
  for(const w of past){
    const e=(w.exs||[]).find(x=>String(x.name||'').trim().toLowerCase()===n);
    if(e) return {date:w.date, sets:e.sets, reps:e.reps, w:e.w};
  }
  return null;
}
function exerciseRow(ex){
  const cardio = ex && isCardio(ex.name);
  // bài điền từ giáo án / dòng mới chưa có kg → tự điền kg lần trước
  const prev = lastSet(ex&&ex.name);
  const startW = (ex&&ex.w!=null) ? ex.w : (prev&&prev.w) || 0;
  const d=document.createElement('div');
  d.className='form-row'; d.style.marginBottom='0'; d.style.alignItems='center';
  d.innerHTML = `
    <input type="text" class="ex-name" list="exList" placeholder="Bài tập" value="${esc((ex&&ex.name)||'')}" style="flex:1;min-width:120px">
    <div class="ex-fields" style="display:flex;gap:8px;align-items:flex-end">
      <div class="field ex-sets-field" style="${cardio?'display:none':''}"><label>Sets</label><input type="number" class="ex-sets" min="1" value="${(ex&&ex.sets)||3}" style="width:60px"></div>
      <div class="field ex-reps-field" style="${cardio?'display:none':''}"><label>Reps</label><input type="number" class="ex-reps" min="1" value="${parseInt((ex&&ex.reps)||10)||10}" style="width:70px"></div>
      <div class="field ex-w-field"><label class="w-lbl">${cardio?'Phút':'Kg'}</label><input type="number" class="ex-w" min="0" step="0.5" value="${startW}" style="width:70px"></div>
    </div>
    <button class="btn danger ex-del">✕</button>
    <div class="ex-last"></div>`;
  const lastEl = d.querySelector('.ex-last');
  const showLast = ()=>{
    const p = lastSet(d.querySelector('.ex-name').value);
    if(!p){ lastEl.style.display='none'; lastEl.innerHTML=''; return; }
    lastEl.style.display='';
    lastEl.innerHTML = `↩ Lần trước (${vnDate(p.date)}): <b>${p.w?p.w+' kg':'không tạ'}</b> · ${p.sets||0}×${p.reps||0}`
      + (p.w?` <button type="button" class="btn ghost sm ex-last-use">Dùng lại</button>`:'');
    lastEl.querySelector('.ex-last-use')?.addEventListener('click',()=>{
      d.querySelector('.ex-w').value=p.w;
      if(p.sets) d.querySelector('.ex-sets').value=p.sets;
      if(p.reps) d.querySelector('.ex-reps').value=p.reps;
    });
  };
  const sync = ()=>{
    const name = d.querySelector('.ex-name').value.trim();
    const c = isCardio(name);
    d.querySelector('.ex-sets-field').style.display = c ? 'none' : '';
    d.querySelector('.ex-reps-field').style.display = c ? 'none' : '';
    d.querySelector('.w-lbl').textContent = c ? 'Phút' : 'Kg';
  };
  d.sync=sync;
  d.querySelector('.ex-del').addEventListener('click',()=>{ d.remove(); });
  d.querySelector('.ex-name').addEventListener('input',()=>{
    sync(); fillExList(); showLast();
    // gõ tên bài mà ô kg đang trống → tự điền kg lần trước
    const p=lastSet(d.querySelector('.ex-name').value), wEl=d.querySelector('.ex-w');
    if(p&&p.w&&!num(wEl.value)) wEl.value=p.w;
  });
  showLast();
  return d;
}
function fillExList(){
  const dl=document.getElementById('exList'); dl.innerHTML='';
  const seen=new Set();
  // lọc theo loại buổi đang chọn: Push → chỉ bài Push; Full Body → chỉ bài trong giáo án đó; Cardio → bài cardio
  let pool=ALL_EX;
  if(SPLIT_EX[wType]) pool=[...SPLIT_EX[wType]];
  else if(wType==='Push'||wType==='Pull'||wType==='Legs') pool=ALL_EX.filter(n=>GROUP[n]===wType);
  pool.forEach(e=>{ const o=document.createElement('option'); o.value=e; dl.appendChild(o); seen.add(e); });
  document.querySelectorAll('#exerciseRows .ex-name').forEach(i=>{ const v=i.value.trim(); if(v&&!seen.has(v)){ const o=document.createElement('option'); o.value=v; dl.appendChild(o); seen.add(v); } });
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
  updateCalPreview();
});
document.getElementById('saveWorkout').addEventListener('click',()=>{
  const date=document.getElementById('wDate').value||today();
  const dur=num(document.getElementById('wDur').value);
  if(!dur||dur<=0){ alert('Bắt buộc nhập thời lượng (phút)'); document.getElementById('wDur').focus(); return; }
  const exs=[...document.querySelectorAll('#exerciseRows .form-row')]
      .map(r=>({name:r.querySelector('.ex-name').value.trim(),sets:num(r.querySelector('.ex-sets').value),reps:num(r.querySelector('.ex-reps').value),w:num(r.querySelector('.ex-w').value)}))
      .filter(e=>e.name);
  if(!exs.length){ alert('Thêm ít nhất 1 bài tập'); return; }
  // calo đốt: tự tính theo chuẩn ACSM (MET × 3.5 × cân nặng × phút ÷ 200)
  const cal = calcWorkoutKcal();
  // lưu cả cường độ (MET) để khi sửa buổi tập, calo không bị tính lại theo mức đang chọn trên form
  const met = num(document.querySelector('#intensityBtns .type-btn.active')?.dataset.met, 4.5);
  const record={id:editingWorkoutId||Date.now(), date, time:document.getElementById('wTime').value, type:wType, dur, met, cal, exs};
  if(editingWorkoutId) workouts=workouts.map(w=>w.id===editingWorkoutId?record:w); else workouts.push(record);
  editingWorkoutId=null;
  save(LS.workouts, workouts);
  renderAll();
  alert('✅ Đã lưu buổi tập! Đốt ~'+fmt(cal)+' kcal');
});
function renderWorkoutList(){
  const el=document.getElementById('workoutList');
  const sorted=[...workouts].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){ el.innerHTML='<div class="empty">Chưa có buổi tập nào</div>'; return; }
  el.innerHTML = sorted.slice(0,20).map(w=>`
    <div class="wk-card">
      <div class="wk-head">
        <span class="badge ${w.type==='Push'?'push':w.type==='Pull'?'pull':w.type==='Legs'?'legs':'gray'}">${esc(w.type)}</span>
        <span class="wk-date">${vnDateFull(w.date)}${w.time?' · '+w.time:''}${w.dur?' · '+w.dur+' phút':''}</span>
        ${w.cal?`<span class="badge green">🔥 ${fmt(w.cal)} kcal</span>`:''}
        <button class="btn ghost sm" data-edit-w="${w.id}">✏️</button><button class="btn danger" data-del="${w.id}">✕</button>
      </div>
      <div class="wk-chips">${w.exs.map(e=>{
              const c=isCardio(e.name);
              const n=esc(e.name);
              if(w.preset) return `<span class="chip">${n}</span>`;
              return c
                ? `<span class="chip">${n} ${e.w||0} phút${e.distance?' · '+e.distance+' km':''}${e.speed?' · '+e.speed+' km/h':''}${e.pace?' · pace '+e.pace:''}${e.incline?' · dốc '+e.incline+'%':''}${e.elevation?' · +'+e.elevation+' m':''}${e.intensity?' · '+esc(e.intensity):''}${e.poolLength?' · hồ '+e.poolLength+'m':''}${e.laps?' · '+e.laps+' vòng':''}</span>`
                : `<span class="chip">${n} ${e.sets}×${e.reps}${e.w?' @'+e.w+'kg':''}</span>`;
            }).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('[data-edit-w]').forEach(b=>b.addEventListener('click',()=>{
    const w=workouts.find(x=>String(x.id)===b.dataset.editW); if(!w) return;
    if(w.type==='Cardio'){ editCardio(w); return; }
    document.getElementById('wDate').value=w.date; document.getElementById('wTime').value=w.time||''; document.getElementById('wDur').value=w.dur;
    editingWorkoutId=w.id;
    document.querySelector(`#wTypeBtns .type-btn[data-type="${w.type}"]`)?.click();
    // khôi phục cường độ đã lưu (buổi cũ chưa có met → giữ mặc định Vừa)
    const met=String(w.met||4.5);
    document.querySelectorAll('#intensityBtns .type-btn').forEach(x=>x.classList.toggle('active', x.dataset.met===met));
    updateIntensityHint();
    const c=document.getElementById('exerciseRows'); c.innerHTML=''; w.exs.forEach(e=>{ const row=exerciseRow(e); c.appendChild(row); }); fillExList(); updateCalPreview();
    document.getElementById('wDate').scrollIntoView({behavior:'smooth',block:'center'}); alert('Đã đưa buổi tập lên form — sửa rồi bấm Lưu');
  }));
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá buổi tập này?')){ workouts=workouts.filter(w=>w.id!=b.dataset.del); save(LS.workouts,workouts); renderAll(); }
  }));
}


// ====== MEALS ======
// Nạp database món ăn
let FOOD_DB = [];
(async function loadFoods(){
  try{ const r=await fetch('data/foods.json'); FOOD_DB=await r.json(); renderHome(); }catch(e){ console.log('Không tải được foods.json'); }
})();
// Món yêu thích (lưu localStorage)
let favFoods = load('gym_fav_foods', []);
function allFoods(){ return [...FOOD_DB, ...favFoods.map(f=>({...f, fav:true}))]; }
// Gõ tên món → gợi ý; bấm vào ô → xổ danh sách sẵn (yêu thích + món phổ biến)
const foodInput=document.getElementById('mName'), sugBox=document.getElementById('foodSuggestions');
function showSugs(v){
  sugBox.innerHTML=''; sugBox.style.display='none';
  const q=v.trim().toLowerCase();
  let hits;
  if(q){
    hits=allFoods().filter(f=>f.n.toLowerCase().includes(q)).slice(0,12);
  }else{
    // chưa gõ: yêu thích trước, rồi món phổ biến (theo thứ tự db)
    hits=[...favFoods.map(f=>({...f,fav:true})), ...FOOD_DB.filter(f=>!favFoods.some(x=>x.n===f.n))].slice(0,24);
  }
  if(!hits.length) return;
  sugBox.style.display='block';
  hits.forEach(f=>{
    const d=document.createElement('div');
    d.className='food-sug';
    d.textContent=f.n+(f.fav?' ⭐':'')+' · '+(f.unit==='g'?f.kcal+' kcal/100g':'1 suất '+f.kcal+' kcal');
    d.addEventListener('click', ()=>{ foodInput.value=f.n; sugBox.style.display='none';
      document.getElementById('mQty').value = f.unit==='g' ? 100 : 1;
      fillMacros(f); });
    sugBox.appendChild(d);
  });
}
foodInput.addEventListener('focus', ()=>showSugs(foodInput.value));
foodInput.addEventListener('input', ()=>showSugs(foodInput.value));
// Bấm ✕ → xoá món, xoá macro, focus lại input
document.getElementById('foodClear').addEventListener('click', ()=>{
  foodInput.value=''; mealBaseMacros=null; sugBox.style.display='none';
  document.getElementById('mCalV').value=''; document.getElementById('mProV').value='';
  document.getElementById('mCarbV').value=''; document.getElementById('mFatV').value='';
  document.getElementById('mQty').value=1; document.getElementById('mQtyLbl').textContent='Số suất';
  foodInput.focus();
});
document.addEventListener('click', e=>{ if(!e.target.closest('.food-search-wrap')) sugBox.style.display='none'; });
// Tự đoán buổi theo giờ hiện tại (tránh quên chọn → sai buổi)
(function autoMeal(){
  const h=new Date().getHours();
  const m=document.getElementById('mMeal');
  const guess = h>=5&&h<10 ? 'Sáng' : h>=10&&h<14 ? 'Trưa' : h>=14&&h<17 ? 'Chiều' : h>=17&&h<23 ? 'Tối' : 'Ăn vặt';
  [...m.options].forEach(o=>{ if(o.text===guess) m.value=o.value; });
})();
document.getElementById('mQty').addEventListener('input', ()=>{
  if(mealBaseMacros){
    const q=Math.max(0,num(document.getElementById('mQty').value,1));
    setMealMacros(mealBaseMacros,q);
    return;
  }
  const v=foodInput.value.trim().replace(' ⭐','');
  const hit=allFoods().find(f=>f.n.toLowerCase()===v.toLowerCase());
  if(hit) fillMacros(hit);
});
function setMealMacros(base, qty){
  document.getElementById('mCalV').value=Math.round(base.cal*qty);
  document.getElementById('mProV').value=Math.round(base.pro*qty);
  document.getElementById('mCarbV').value=Math.round(base.carb*qty);
  document.getElementById('mFatV').value=Math.round(base.fat*qty);
}
// Điền macro theo món + khối lượng/số suất
function fillMacros(hit){
  if(/cơm/i.test(hit.n)) document.getElementById('mMeal').value='Bữa chính';
  const qty=num(document.getElementById('mQty').value,100);
  const ratio=hit.unit==='g' ? qty/100 : qty;
  const factor=hit.unit==='g'?100:1;
  mealBaseMacros={cal:hit.kcal/factor,pro:hit.p/factor,carb:hit.c/factor,fat:hit.f/factor};
  setMealMacros(mealBaseMacros,qty);
  document.getElementById('mQtyLbl').textContent=hit.unit==='g' ? 'Khối lượng (g)' : 'Số suất';
}
// Lưu món yêu thích
document.getElementById('saveFavFood').addEventListener('click',()=>{
  const name=document.getElementById('mName').value.trim().replace(' ⭐','');
  if(!name) return;
  if(FOOD_DB.find(f=>f.n.toLowerCase()===name.toLowerCase())){ alert('Món này đã có sẵn trong danh sách'); return; }
  if(favFoods.find(f=>f.n.toLowerCase()===name.toLowerCase())){ alert('Món này đã có trong yêu thích'); return; }
  const cal=num(document.getElementById('mCalV').value), p=num(document.getElementById('mProV').value);
  const c=num(document.getElementById('mCarbV').value), f=num(document.getElementById('mFatV').value);
  const hit = allFoods().find(f=>f.n.toLowerCase()===name.toLowerCase());
  const qty=num(document.getElementById('mQty').value,100);
  const unit = hit ? hit.unit : (qty===1 ? 'suat' : 'g');
  const ratio = unit==='g' ? qty/100 : qty;
  const item={n:name, kcal:Math.round(cal/ratio)||1, p:Math.round(p/ratio)||0, c:Math.round(c/ratio)||0, f:Math.round(f/ratio)||0, unit};
  favFoods.push(item); save('gym_fav_foods', favFoods); alert('✅ Đã lưu "'+name+'" vào mục yêu thích ⭐');
});
function addMeal(){
  const date = today();
  const name=document.getElementById('mName').value.trim().replace(' ⭐','');
  // tìm món trong DB → nếu chưa điền calo, tự tính theo khối lượng/suất
  const all=[...FOOD_DB, ...favFoods.map(f=>({...f, fav:true}))];
  const hit=all.find(f=>f.n.toLowerCase()===name.toLowerCase());
  if(hit){
    const qty=num(document.getElementById('mQty').value,100);
    const ratio=hit.unit==='g' ? qty/100 : qty;
    if(!num(document.getElementById('mCalV').value)) document.getElementById('mCalV').value=Math.round(hit.kcal*ratio);
    if(!num(document.getElementById('mProV').value)) document.getElementById('mProV').value=Math.round(hit.p*ratio);
    if(!num(document.getElementById('mCarbV').value)) document.getElementById('mCarbV').value=Math.round(hit.c*ratio);
    if(!num(document.getElementById('mFatV').value)) document.getElementById('mFatV').value=Math.round(hit.f*ratio);
  }
  const cal=num(document.getElementById('mCalV').value);
  if(!name&&cal<=0){ alert('Nhập tên món hoặc calo'); return; }
  const m={id:Date.now(), date, time:document.getElementById('mTime').value||clockNow(), meal:document.getElementById('mMeal').value,
    name:name||'Món ăn', cal, pro:num(document.getElementById('mProV').value),
    carb:num(document.getElementById('mCarbV').value), fat:num(document.getElementById('mFatV').value),
    qty:num(document.getElementById('mQty').value,1), unit:hit?.unit||'suat',
    base:{cal:cal/Math.max(0.001,num(document.getElementById('mQty').value,1)),pro:num(document.getElementById('mProV').value)/Math.max(0.001,num(document.getElementById('mQty').value,1)),carb:num(document.getElementById('mCarbV').value)/Math.max(0.001,num(document.getElementById('mQty').value,1)),fat:num(document.getElementById('mFatV').value)/Math.max(0.001,num(document.getElementById('mQty').value,1))}};
  if(editingMealId) meals=meals.map(x=>x.id===editingMealId?{...m,id:editingMealId}:x); else meals.push(m);
  editingMealId=null; mealBaseMacros=null; save(LS.meals, meals);
  document.getElementById('mName').value=''; document.getElementById('mTime').value=clockNow(); ['mCalV','mProV','mCarbV','mFatV'].forEach(i=>document.getElementById(i).value='');
  renderAll();
}
document.getElementById('addMeal').addEventListener('click', addMeal);
document.getElementById('mName').addEventListener('keydown', e=>{ if(e.key==='Enter') addMeal(); });

function dayTotals(day){
  return meals.filter(m=>m.date===day).reduce((a,m)=>({cal:a.cal+m.cal,pro:a.pro+m.pro,carb:a.carb+m.carb,fat:a.fat+m.fat}),{cal:0,pro:0,carb:0,fat:0});
}
let proteinSuggestions=[];
function renderProteinAlert(t, goalPro){
  const card=document.getElementById('proteinAlertCard');
  const out=document.getElementById('proteinAlert');
  const deficit=Math.max(0,goalPro-t.pro);
  const hour=new Date().getHours();
  if(!card||!out||hour<20||deficit<=0){ if(card) card.style.display='none'; return; }
  const eaten=new Set(meals.filter(m=>m.date===today()).map(m=>String(m.name||'').toLowerCase()));
  proteinSuggestions=allFoods().filter(f=>f.p>10&&!eaten.has(f.n.toLowerCase()))
    .sort((a,b)=>(b.p/(b.kcal||1))-(a.p/(a.kcal||1))).slice(0,3);
  card.style.display='block';
  document.getElementById('proteinAlertTime').textContent='Đã '+String(hour).padStart(2,'0')+'h';
  out.innerHTML=`<div class="protein-alert-copy"><b>Còn thiếu khoảng ${fmt(deficit)}g protein</b><br><span class="muted">Đã ăn ${fmt(t.pro)} / ${fmt(goalPro)}g hôm nay. Nên bổ sung một bữa giàu đạm.</span></div>`+
    (proteinSuggestions.length?`<div class="protein-suggestions">${proteinSuggestions.map((f,i)=>{
      const qty=f.unit==='g'?150:1;
      const p=Math.round(f.p*(f.unit==='g'?qty/100:qty));
      const cal=Math.round(f.kcal*(f.unit==='g'?qty/100:qty));
      return `<div class="protein-suggestion"><div><b>${esc(f.n)}</b><span class="muted"> · ${qty}${f.unit==='g'?'g':' suất'} ≈ ${p}g protein · ${cal} kcal</span></div><button class="btn ghost sm" data-protein-sug="${i}">Thêm vào form</button></div>`;
    }).join('')}</div>`:'<div class="muted" style="margin-top:8px">Chưa tải được danh sách món giàu protein.</div>');
  out.querySelectorAll('[data-protein-sug]').forEach(btn=>btn.addEventListener('click',()=>{
    const f=proteinSuggestions[Number(btn.dataset.proteinSug)]; if(!f) return;
    document.getElementById('mName').value=f.n; document.getElementById('mQty').value=f.unit==='g'?150:1; fillMacros(f);
    switchView('diet'); document.getElementById('mName').scrollIntoView({behavior:'smooth',block:'center'});
  }));
}
function renderDiet(){
  const t=dayTotals(today());
  const pct=(v,g)=>g>0?Math.min(100,v/g*100):0;
  // đọc mục tiêu từ ô input (đã nhập hoặc tự điền, chưa cần Lưu)
  const goalCal = num(document.getElementById('gCal').value, 2400);
  const goalPro = num(document.getElementById('gPro').value, 150);
  const goalCarb = num(document.getElementById('gCarb').value, 250);
  const goalFat = num(document.getElementById('gFat').value, 70);
  document.getElementById('mCal').textContent=fmt(t.cal);
  document.getElementById('mCalG').textContent=fmt(goalCal);
  document.getElementById('mPro').textContent=fmt(t.pro);
  document.getElementById('mCarb').textContent=fmt(t.carb);
  document.getElementById('mFat').textContent=fmt(t.fat);
  // Gợi ý mục tiêu theo TDEE
  const sug=document.getElementById('goalSug');
  const tdee=getTDEE();
  const g=document.getElementById('goalSelect')?.value||'maintain';
  if(sug && tdee>0){
    const rec = g==='cut' ? Math.round(tdee-400) : g==='bulk' ? Math.round(tdee+250) : tdee;
    const left=Math.max(0, rec-t.cal);
    sug.innerHTML = `📌 Mục tiêu <b>${g==='cut'?'⚡ Siết':g==='bulk'?'💪 Tăng cơ':'⚖️ Giữ cân'}</b>: TDEE ${fmt(tdee)} kcal → <b>hôm nay nên ăn ~${fmt(rec)} kcal</b>${left>0?`. Còn có thể ăn thêm ${fmt(left)} kcal`:'. Đã đạt/ăn đủ!'}`;
  }
  // Cập nhật vòng tròn
  const rings=[['mCal','mCalG',t.cal,goalCal],['mPro','mProG',t.pro,goalPro],['mCarb','mCarbG',t.carb,goalCarb],['mFat','mFatG',t.fat,goalFat]];
  rings.forEach(([idV,idG,val,goal])=>{
    document.getElementById(idV).textContent=fmt(val);
    document.getElementById(idG).textContent=fmt(goal);
    const pct=goal>0?Math.min(100,val/goal*100):0;
    const box=document.getElementById(idV).closest('.ring-box');
    if(box) box.querySelector('.ring-fg').style.strokeDasharray = `${pct} 100`;
  });

  const el=document.getElementById('mealList');
  const tMeals=meals.filter(m=>m.date===today()).sort((a,b)=>a.id-b.id);
  el.innerHTML = tMeals.length? tMeals.map(m=>`
    <div class="list-item">
      <div class="grow"><div class="name">${esc(m.meal)} · ${esc(m.name)}</div>
      <div class="meta">${m.time?'🕒 '+m.time+' · ':''}${mealTiming(m)?' '+mealTiming(m)+' · ':''}P ${m.pro}g · C ${m.carb}g · F ${m.fat}g</div></div>
      <span class="badge gray">${fmt(m.cal)} kcal</span>
      <button class="btn ghost sm" data-edit-m="${m.id}">✏️</button><button class="btn danger" data-del="${m.id}">✕</button>
    </div>`).join('') : '<div class="empty">Chưa có bữa ăn nào hôm nay</div>';
  el.querySelectorAll('[data-edit-m]').forEach(b=>b.addEventListener('click',()=>{
    const m=meals.find(x=>String(x.id)===b.dataset.editM); if(!m) return;
    document.getElementById('mMeal').value=m.meal; document.getElementById('mTime').value=m.time||''; document.getElementById('mName').value=m.name;
    document.getElementById('mCalV').value=m.cal; document.getElementById('mProV').value=m.pro; document.getElementById('mCarbV').value=m.carb; document.getElementById('mFatV').value=m.fat;
    document.getElementById('mQty').value=m.qty||1;
    document.getElementById('mQtyLbl').textContent=m.unit==='g'?'Khối lượng (g)':'Số suất';
    mealBaseMacros=m.base||{cal:num(m.cal)/(m.qty||1),pro:num(m.pro)/(m.qty||1),carb:num(m.carb)/(m.qty||1),fat:num(m.fat)/(m.qty||1)};
    editingMealId=m.id; document.getElementById('mName').scrollIntoView({behavior:'smooth',block:'center'}); alert('Đã đưa bữa ăn lên form — sửa rồi bấm Thêm');
  }));
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá bữa ăn này?')){ meals=meals.filter(m=>m.id!=b.dataset.del); save(LS.meals,meals); renderAll(); }
  }));

  const hist=document.getElementById('dietHistory');
  const days=[...Array(7)].map((_,i)=>daysAgo(6-i));
  const rows=days.map(d=>{ const x=dayTotals(d); return `<tr><td>${d===today()?'Hôm nay':vnDate(d)}</td><td class="weight-cell">${fmt(x.cal)}</td><td>${fmt(x.pro)}g</td><td>${fmt(x.carb)}g</td><td>${fmt(x.fat)}g</td></tr>`; }).join('');
  const sums=days.reduce((a,d)=>{ const x=dayTotals(d); return {cal:a.cal+x.cal,pro:a.pro+x.pro,carb:a.carb+x.carb,fat:a.fat+x.fat}; },{cal:0,pro:0,carb:0,fat:0});
  hist.innerHTML = `<table><thead><tr><th>Ngày</th><th>Calo</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Tổng 7 ngày</td><td class="weight-cell">${fmt(sums.cal)}</td><td>${fmt(sums.pro)}g</td><td>${fmt(sums.carb)}g</td><td>${fmt(sums.fat)}g</td></tr></tfoot></table>
  <div style="font-size:11px;color:var(--muted);margin-top:6px">Tự động trượt theo ngày hiện tại — luôn hiện 7 ngày gần nhất.</div>`;
}
const goalSelect=document.getElementById('goalSelect');
goalSelect.value=goals.mode;
document.getElementById('gCal').value=goals.cal;
document.getElementById('gPro').value=goals.pro;
document.getElementById('gCarb').value=goals.carb;
document.getElementById('gFat').value=goals.fat;
goalSelect.addEventListener('change', ()=>{
  const tdee=getTDEE();
  const g=goalSelect.value;
  const rec = g==='cut' ? Math.round(tdee-400) : g==='bulk' ? Math.round(tdee+250) : Math.round(tdee);
  const kg=getBodyWeight();
  const pro = g==='bulk' ? Math.round(kg*2.2) : g==='cut' ? Math.round(kg*2.2) : Math.round(kg*2);
  document.getElementById('gCal').value = rec;
  document.getElementById('gPro').value = pro;
  renderDiet();
});
document.getElementById('saveGoals').addEventListener('click',()=>{
  goals={mode:goalSelect.value,cal:num(document.getElementById('gCal').value,2400),pro:num(document.getElementById('gPro').value,150),carb:num(document.getElementById('gCarb').value,250),fat:num(document.getElementById('gFat').value,70)};
  save(LS.goals, goals); renderAll(); alert('✅ Đã lưu mục tiêu');
});
// ====== WEIGHT ======
// nạp sẵn thông số cơ thể vào form
document.getElementById('bHeight').value = body.height||'';
document.getElementById('bAge').value = body.age||'';
document.getElementById('bGender').value = body.gender||'male';
document.getElementById('bActive').value = String(body.active||1.4);
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
    // đáy biểu đồ: làm tròn xuống bội số 5 (thấp hơn min) → cột thấp nhất vẫn nhìn thấy, không vượt khung
    const base=Math.floor(min/5)*5; const range=Math.max(max-base,0.5);
    el.innerHTML = '<div class="chart-wrap" style="height:200px;align-items:flex-start">'+
      sorted.map(w=>{
        const h=((w.v-base)/range*100)+4;
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
        <div class="grow"><div class="name">${vnDateFull(w.date)}${w.date===today()?' (hôm nay)':''}</div></div>
        <span class="weight-cell" style="font-size:16px">${w.v} kg</span>
        ${i<list.length-1?`<span class="badge ${w.v<=list[i+1].v?'green':'red'}">${w.v<=list[i+1].v?'▼':'▲'} ${Math.abs(w.v-list[i+1].v).toFixed(1)}</span>`:''}
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
  if(!set.has(localISO(d))) d.setDate(d.getDate()-1);
  while(set.has(localISO(d))){ streak++; d.setDate(d.getDate()-1); }
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
  const t=dayTotals(today());
  document.getElementById('stKcalIn').textContent=fmt(t.cal);

  const todayWorkouts=wk.filter(w=>w.date===today());
  const latestMeal=meals.filter(m=>m.date===today()).sort((a,b)=>(b.time||'').localeCompare(a.time||''))[0];
  const goalCal=num(document.getElementById('gCal').value,goals.cal||2400);
  const goalPro=num(document.getElementById('gPro').value,goals.pro||150);
  document.getElementById('todaySummary').innerHTML=`<div class="today-summary-grid"><div><b>🥗 Calo</b><br>${fmt(t.cal)} / ${fmt(goalCal)} kcal<br><span class="muted">Còn ${fmt(Math.max(0,goalCal-t.cal))} kcal</span></div><div><b>🍗 Protein</b><br>${fmt(t.pro)} / ${fmt(goalPro)}g<br><span class="muted">Còn ${fmt(Math.max(0,goalPro-t.pro))}g</span></div><div><b>💪 Tập hôm nay</b><br>${todayWorkouts.length?todayWorkouts.map(w=>`${esc(w.type)}${w.time?' lúc '+w.time:''}`).join(', '):'Chưa tập'}</div><div><b>🕒 Bữa gần nhất</b><br>${latestMeal?`${latestMeal.time||'?'} · ${esc(latestMeal.name)}`:'Chưa ghi'}</div></div>`;

  const hour=new Date().getHours();
  renderProteinAlert(t, goalPro);
  const g=hour<12?'Chúc buổi sáng':hour<17?'Chúc buổi chiều':hour<21?'Chúc buổi tối':'Chúc bạn ngủ ngon';
  const todayW=todayWorkouts[0];
  const msg = todayW? `💪 ${g}! Hôm nay bạn đã tập ${todayW.type} ${todayW.dur?todayW.dur+' phút':''}. ${t.cal?`Đã nạp ${fmt(t.cal)}/${fmt(goals.cal)} kcal.`:''} Cố lên!`
    : `💪 ${g}! Hôm nay bạn chưa tập. ${t.cal?`Đã nạp ${fmt(t.cal)}/${fmt(goals.cal)} kcal.`:''} Xem giáo án và tập ngay nhé!`;
  document.getElementById('greetMsg').textContent=msg;

  document.getElementById('weekWorkouts').innerHTML = wk.length?
    [...wk].sort((a,b)=>b.date.localeCompare(a.date)).map(w=>`
      <div class="list-item">
        <div class="grow"><div class="name"><span class="badge ${w.type==='Push'?'push':w.type==='Pull'?'pull':w.type==='Legs'?'legs':'gray'}">${esc(w.type)}</span> ${w.date===today()?'Hôm nay':vnDate(w.date)}</div>
        <div class="meta">${w.exs.length} bài tập ${w.dur?'· '+w.dur+' phút':''}</div></div>
        ${w.cal?`<span class="badge green">${fmt(w.cal)} kcal</span>`:''}
      </div>`).join('')
    : '<div class="empty">Chưa có buổi tập tuần này</div>';

  const tMeals=meals.filter(m=>m.date===today());
  document.getElementById('todayMeals').innerHTML = tMeals.length?
    tMeals.map(m=>`<div class="list-item"><div class="grow"><div class="name">${esc(m.meal)} · ${esc(m.name)}</div><div class="meta">${m.time?'🕒 '+m.time+' · ':''}${mealTiming(m)?mealTiming(m)+' · ':''}${m.pro||0}g protein</div></div><span class="badge gray">${fmt(m.cal)} kcal</span></div>`).join('')
    : '<div class="empty">Chưa có bữa ăn nào</div>';
}

// ====== MONTH CHART (lật tháng ← →) ======
let monthOff=0;
function renderMonth(){
  const now=new Date();
  const d0=new Date(now.getFullYear(), now.getMonth()+monthOff, 1);
  const ym=`${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}`;
  const label=d0.toLocaleDateString('vi-VN',{month:'long',year:'numeric'});
  document.getElementById('monthLabel').textContent=label;
  const isCur = monthOff===0;
  document.getElementById('monthPrev').disabled=monthOff<=-24; // xem tối đa 2 năm trước
  document.getElementById('monthNext').disabled=monthOff>=0;   // không xem tương lai
  const mWs=meals.filter(m=>m.date.startsWith(ym)).reduce((a,m)=>a+m.cal,0);
  const mWk=workouts.filter(w=>w.date.startsWith(ym)).length;
  document.getElementById('monthSummary').textContent=`Nạp ${fmt(mWs)} kcal · ${mWk} buổi tập`;
  const daysInMonth=new Date(d0.getFullYear(), d0.getMonth()+1, 0).getDate();
  const chart=document.getElementById('monthChart'); chart.innerHTML='';
  const dayCals=[...Array(daysInMonth)].map((_,i)=>{
    const dd=`${ym}-${String(i+1).padStart(2,'0')}`;
    return {d:dd, cal:meals.filter(m=>m.date===dd).reduce((a,m)=>a+m.cal,0), w:workouts.filter(w=>w.date===dd).length};
  });
  const maxC=Math.max(...dayCals.map(x=>x.cal),1);
  dayCals.forEach(x=>{
    const b=document.createElement('div'); b.className='bar'; b.style.height='100%';
    b.innerHTML=`<div class="tip">${vnDate(x.d)} · ${fmt(x.cal)} kcal${x.w?' · 💪'+x.w:''}</div><div class="fill" style="height:${x.cal/maxC*100}%\"></div><div class="bar-label">${x.d.slice(8)}</div>`;
    chart.appendChild(b);
  });
  if(isCur){ const t=new Date(); if(t.getDate()<=daysInMonth) chart.children[t.getDate()-1].style.background='var(--accent)'; }
}
document.getElementById('monthPrev').addEventListener('click', ()=>{ monthOff--; renderMonth(); });
document.getElementById('monthNext').addEventListener('click', ()=>{ monthOff++; renderMonth(); });
// Bấm vào cột biểu đồ → hiện/ẩn tooltip số kcal + buổi tập (mobile không có hover)
document.addEventListener('click', e=>{
  const bar = e.target.closest('.bar');
  document.querySelectorAll('.bar .tip.show').forEach(t=>{ if(!bar || t.parentElement!==bar) t.classList.remove('show'); });
  if(bar){ const t=bar.querySelector('.tip'); if(t) t.classList.toggle('show'); }
});

// ====== PROGRESS ======
function calcPR(exName){
  return workouts.flatMap(w=>w.exs.map(e=>({date:w.date,type:w.type,name:e.name,sets:e.sets,reps:e.reps,w:e.w,isCardio:isCardio(e.name)})))
    .filter(e=>e.name.toLowerCase()===exName.toLowerCase() && (!e.isCardio) && e.w>0)
    .reduce((best,e)=> e.w>best.w?e:best, {w:0});
}
let weekOff=0;
function renderWeekly(){
  const el=document.getElementById('prog-weekly');
  // Tuần T2→CN, offset weekOff (0=tuần này, -1=tuần trước...)
  const base=new Date();
  const day=base.getDay()||7;
  const start=new Date(base); start.setDate(start.getDate()-day+1 + weekOff*7);
  const ws=localISO(start);
  const days=[...Array(7)].map((_,i)=>{ const d=new Date(start); d.setDate(d.getDate()+i); return localISO(d); });
  const we=days[6];
  const wk=workouts.filter(w=>w.date>=ws&&w.date<=we);
  const totalCal=wk.reduce((a,w)=>a+w.cal,0);
  const totalMin=wk.reduce((a,w)=>a+w.dur,0);
  const types={}; wk.forEach(w=>types[w.type]=(types[w.type]||0)+1);
  const cals=days.map(d=>dayTotals(d).cal);
  const avgCal=cals.reduce((a,b)=>a+b,0)/7;
  const label = weekOff===0 ? `Tuần này (${vnDate(ws)} – ${vnDate(we)})` : `${vnDate(ws)} – ${vnDate(we)}`;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <button class="btn ghost sm" id="wkPrev">←</button>
      <b style="flex:1;text-align:center">${label}</b>
      <button class="btn ghost sm" id="wkNext">→</button>
    </div>
    <div class="grid stats" style="margin-bottom:16px">
      <div class="stat"><div class="ic">🏋️</div><div class="val">${wk.length}</div><div class="lbl">Buổi tập</div></div>
      <div class="stat"><div class="ic">🔥</div><div class="val">${fmt(totalCal)}</div><div class="lbl">Kcal đốt</div></div>
      <div class="stat"><div class="ic">⏱️</div><div class="val">${totalMin}</div><div class="lbl">Phút tập</div></div>
      <div class="stat"><div class="ic">🍗</div><div class="val">${fmt(avgCal)}</div><div class="lbl">Kcal/ngày nạp</div></div>
    </div>
    <div class="card"><h3>🥗 Calo nạp 7 ngày</h3><div class="chart-wrap" id="wkChart"></div></div>
    <div class="card"><h3>💪 Phân bố loại buổi</h3>${Object.keys(types).length?
      Object.entries(types).map(([t,c])=>`<div class="list-item"><div class="grow"><div class="name"><span class="badge ${t==='Push'?'push':t==='Pull'?'pull':t==='Legs'?'legs':'gray'}">${esc(t)}</span></div></div><span class="badge gray">${c} buổi</span></div>`).join('')
      :'<div class="empty">Chưa có dữ liệu</div>'}</div>`;
  const c=document.getElementById('wkChart'); c.innerHTML='';
  const max=Math.max(...cals,1);
  days.forEach((d,i)=>{
    const b=document.createElement('div'); b.className='bar'; b.style.height='100%';
    b.innerHTML=`<div class="tip">${d===today()?'Hôm nay':vnDate(d)} · ${fmt(cals[i])} kcal</div><div class="fill" style="height:${cals[i]/max*100}%"></div><div class="bar-label">${d===today()?'Hôm nay':vnDate(d)}</div>`;
    c.appendChild(b);
  });
  document.getElementById('wkPrev').onclick=()=>{ weekOff--; renderWeekly(); };
  document.getElementById('wkNext').onclick=()=>{ weekOff++; renderWeekly(); };
  document.getElementById('wkNext').disabled = weekOff>=0; // không xem tương lai
}
function renderExercise(){
  const el=document.getElementById('prog-exercise');
  const exNames=[...new Set(workouts.flatMap(w=>w.exs).map(e=>e.name))].filter(n=>!isCardio(n));
  if(!exNames.length){ el.innerHTML='<div class="empty">Chưa có bài tập nào để phân tích</div>'; return; }
  // Bài tập trong 7 ngày gần nhất (bỏ bài cardio — volume/best set không áp dụng cho cardio)
  const since=daysAgo(6);
  const weekExs=workouts.filter(w=>w.date>=since).flatMap(w=>w.exs.map(e=>({date:w.date,name:e.name,sets:e.sets||0,reps:e.reps||0,w:e.w||0,isCardio:isCardio(e.name)})));
  const weekNames=[...new Set(weekExs.map(e=>e.name))].filter(n=>!isCardio(n));
  const volSum=(arr)=>arr.reduce((a,e)=>a+(e.isCardio?0:e.sets*e.reps*e.w),0);
  const bestSet=(arr)=>arr.filter(e=>!e.isCardio&&e.w>0).reduce((b,e)=> (e.w>b.w || (e.w===b.w&&e.reps>b.reps))?e:b, {w:0,reps:0});
  const rows=weekNames.map(n=>{
    const arr=weekExs.filter(e=>e.name.toLowerCase()===n.toLowerCase());
    const bs=bestSet(arr);
    return {n, count:new Set(arr.map(e=>e.date)).size, vol:volSum(arr), bs};
  }).sort((a,b)=>b.vol-a.vol);
  el.innerHTML = (weekNames.length?`
    <h3 style="margin:4px 0 10px;font-size:15px">📅 Tuần này (7 ngày)</h3>
    <table><thead><tr><th>Bài tập</th><th>Số lần</th><th>Volume (kg)</th><th>Best set</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${esc(r.n)}</td><td>${r.count}</td><td class="weight-cell">${fmt(r.vol)}</td><td>${r.bs.w?r.bs.w+' kg × '+r.bs.reps:''}</td></tr>`).join('')}
    </tbody></table>`:'<div class="empty">Chưa có bài tập nào trong 7 ngày qua</div>')+
  `<h3 style="margin:16px 0 10px;font-size:15px">📚 Tất cả (mọi thời điểm)</h3>
  <table><thead><tr><th>Bài tập</th><th>Tổng lần</th><th>PR (max kg)</th><th>Best set</th></tr></thead><tbody>`+
    exNames.map(n=>{ const pr=calcPR(n); return `<tr><td>${esc(n)}</td><td>${workouts.filter(w=>w.exs.some(e=>e.name.toLowerCase()===n.toLowerCase())).length}</td><td class="weight-cell">${pr.w?pr.w+' kg':'-'}</td><td>${pr.w?`${pr.reps} reps`:''}</td></tr>`; }).join('')+
    `</tbody></table>`;
}
function renderPlan(){
  const el=document.getElementById('prog-plan');
  const [ws,we]=weekRange();
  const wk=workouts.filter(w=>w.date>=ws&&w.date<=we);
  const split={}; wk.forEach(w=>split[w.type]=(split[w.type]||0)+1);
  const avgCal=dayTotals(today()).cal;
  const deficit=goals.cal-avgCal;
  const wTarget = deficit>250 ? '🥗 Calo hôm nay thấp hơn mục tiêu ' + fmt(deficit)+' kcal → hôm sau ăn thêm hoặc giảm tập' : deficit<-250 ? '🔥 Ăn vượt '+fmt(-deficit)+' kcal → tăng thêm cardio hoặc siết lại phần ăn vặt' : '✅ Calo đang cân bằng tốt, giữ nhịp!';
  const todayPlan = WEEK_PLAN[new Date().getDay()];
  const missed = ['Push','Pull','Legs','Upper','Lower'].filter(t=>!split[t]);
  const todayMsg = todayPlan
    ? (split[todayPlan] ? `Buổi hôm nay (<b>${todayPlan}</b>) đã xong ✅` : `Hôm nay theo lịch: <b>${todayPlan}</b>`)
    : 'Hôm nay là ngày nghỉ — đi bộ nhẹ 30–45 phút hoặc nghỉ hẳn';
  let plan='';
  plan += `<div class="card"><h3>💪 Lịch tập tuần này</h3>
    <div class="list-item"><div class="grow"><div class="name">${todayMsg}</div><div class="meta">T2 Push · T3 Pull · T4 Legs · T5 nghỉ/cardio · T6 Upper · T7 Lower · CN nghỉ</div></div></div>
    <div class="list-item"><div class="grow"><div class="name">${missed.length?`Còn thiếu tuần này: <b>${missed.join(', ')}</b>`:'🎉 Đã đủ 5 buổi tuần này!'}</div><div class="meta">Lỡ 1 buổi thì tập bù vào ngày nghỉ T5, không dồn 2 buổi vào 1 ngày</div></div></div>
    <div class="list-item"><div class="grow"><div class="name">Tăng tạ: đủ số rep cao nhất ở mọi set → buổi sau tăng tạ</div><div class="meta">Thân trên +1–2.5kg, chân +2.5–5kg · Tuần 6 &amp; 12 deload: giữ tạ, bớt ~1/3 số set</div></div></div></div>`;
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

// ====== BACKUP (xuất/nhập dữ liệu) — nút ở sidebar ======
function showMsg(txt){
  const m=document.getElementById('backupMsg');
  m.textContent=txt; m.classList.add('show');
  clearTimeout(showMsg._t);
  showMsg._t=setTimeout(()=>m.classList.remove('show'), 4000);
}
function collectData(){
  return {
    app:'gym-tracker', version:1, exported:new Date().toISOString(),
    workouts:load(LS.workouts,[]), meals:load(LS.meals,[]), weights:load(LS.weights,[]),
    goals:load(LS.goals,{cal:2400,pro:150,carb:250,fat:70}), name:localStorage.getItem(LS.name)||'',
    favFoods:load('gym_fav_foods',[]), body:load('gym_body',null)
  };
}
document.getElementById('exportBtn').addEventListener('click',()=>{
  const data=collectData();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='gym-backup-'+today()+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showMsg('✅ Đã tải backup');
});
document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const d=JSON.parse(reader.result);
      if(!d||d.app!=='gym-tracker') throw new Error('File không phải backup của app này');
      if(!confirm('Nhập dữ liệu này sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?')) return;
      save(LS.workouts,d.workouts||[]); save(LS.meals,d.meals||[]); save(LS.weights,d.weights||[]);
      save(LS.goals,d.goals||{cal:2400,pro:150,carb:250,fat:70});
      if(d.name) localStorage.setItem(LS.name,d.name);
      save('gym_fav_foods',d.favFoods||[]); if(d.body) save('gym_body',d.body);
      location.reload();
    }catch(err){ showMsg('❌ '+err.message); }
  };
  reader.readAsText(f);
  e.target.value='';
});
// Xoá toàn bộ dữ liệu
document.getElementById('resetAllBtn').addEventListener('click',()=>{
  if(!confirm('⚠️ Bạn có chắc muốn XOÁ TOÀN BỘ dữ liệu? (buổi tập, bữa ăn, cân nặng, mục tiêu, món yêu thích — tất cả)\n\nKhuyến nghị: xuất backup trước khi xoá.')) return;
  if(!confirm('❌ Lần cuối: XOÁ SẠCH toàn bộ dữ liệu, không thể khôi phục nếu chưa backup. Tiếp tục?')) return;
  localStorage.removeItem(LS.workouts); localStorage.removeItem(LS.meals);
  localStorage.removeItem(LS.weights); localStorage.removeItem(LS.goals);
  localStorage.removeItem(LS.name); localStorage.removeItem('gym_fav_foods');
  localStorage.removeItem('gym_body');
  alert('✅ Đã xoá sạch toàn bộ dữ liệu. Trang sẽ tải lại.');
  location.reload();
});

// ====== RENDER ALL ======
function renderAll(){
  renderHome(); renderMonth(); renderRoutine(); renderWorkoutList(); renderDiet(); renderWeight(); renderTdee(); renderWeekly(); renderExercise(); renderPlan();
}
renderAll();