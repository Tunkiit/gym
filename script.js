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
  document.getElementById('modalMG').textContent = ex.muscle;
  const color = emoji==='🔴'?'var(--push)':emoji==='🔵'?'var(--pull)':emoji==='🟢'?'var(--legs)':'var(--accent)';
  document.getElementById('modalMG').style.background = color.replace('var(--push)','rgba(239,68,68,.15)').replace('var(--pull)','rgba(59,130,246,.15)').replace('var(--legs)','rgba(34,197,94,.15)').replace('var(--accent)','rgba(245,158,11,.15)');
  document.getElementById('modalMG').style.color = color;
  document.getElementById('modalSets').textContent = ex.sets;
  document.getElementById('modalReps').textContent = ex.reps;
  document.getElementById('modalMuscle').textContent = ex.muscle;
  document.getElementById('modalDay').textContent = (emoji||'')+' '+(dayName||'');
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

// ====== SPLIT SELECTOR (Giáo án + buổi) ======
let curSplit = localStorage.getItem('gym_split') || 'PPL';
// Cấu trúc danh sách buổi theo giáo án: PPL dùng ROUTINE, còn lại dùng EXTRA_SPLITS
function getSplitDays(key){
  if(key==='PPL') return ['Push','Pull','Legs'];
  return (EXTRA_SPLITS[key]||EXTRA_SPLITS.FullBody).days.map((d,i)=>key+'_'+i);
}
function getDayMeta(key, dayKey){
  if(key==='PPL'){ const rt=ROUTINE[dayKey]; return {label:rt.emoji+' '+rt.name, exs:rt.exs, emoji:rt.emoji, name:rt.name, sets:rt.sets}; }
  const [sk,di]=dayKey.split('_'); const day=EXTRA_SPLITS[sk].days[+di];
  return {label:EXTRA_SPLITS[sk].emoji+' '+day.name, exs:getSplitDay(sk,+di), emoji:EXTRA_SPLITS[sk].emoji, name:day.name, sets:day.exs.reduce((a,e)=>a+e.sets,0)};
}

const splitSelect = document.getElementById('splitSelect');
const daySelect = document.getElementById('daySelect');
function fillDayOptions(){
  splitSelect.value = curSplit;
  const days = getSplitDays(curSplit);
  daySelect.innerHTML = days.map(d=>{ const m=getDayMeta(curSplit,d); return `<option value="${d}">${m.label}</option>`; }).join('');
}
splitSelect.addEventListener('change',()=>{
  curSplit = splitSelect.value;
  localStorage.setItem('gym_split', curSplit);
  fillDayOptions();
  renderRoutine();
});
daySelect.addEventListener('change',()=>renderRoutine());
fillDayOptions();

document.getElementById('fillDay').addEventListener('click',()=>{
  const dayKey = daySelect.value;
  const m = getDayMeta(curSplit, dayKey);
  fillWorkoutFromRoutine(m.exs, m.name, m.emoji);
  updateCalPreview();
  document.getElementById('exerciseRows').scrollIntoView({behavior:'smooth', block:'start'});
});

// ====== ROUTINE VIEW ======
function renderRoutine(){
  const grid=document.getElementById('routineGrid');
  const dayKey = daySelect.value;
  const m = getDayMeta(curSplit, dayKey);
  const color = curSplit==='PPL' ? (dayKey==='Push'?'var(--push)':dayKey==='Pull'?'var(--pull)':'var(--legs)') : 'var(--accent)';
  grid.innerHTML = `<div class="routine-card" style="border-top:3px solid ${color}">
    <div class="routine-header">
      <h2>${m.label}</h2>
      <span class="sets-count">${m.sets} sets</span>
    </div>
    <div class="routine-body">
      ${m.exs.map((ex,i)=>`
        <div class="routine-ex" data-key="${curSplit}" data-idx="${i}">
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
  grid.querySelectorAll('.routine-ex').forEach(el=>{
    el.addEventListener('click',()=>{
      const idx=parseInt(el.dataset.idx);
      const dayKey2=daySelect.value;
      const m2=getDayMeta(curSplit, dayKey2);
      showExerciseModalEx(m2.exs[idx], m2.name, m2.emoji, curSplit);
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
  const hit = wbtns.find(b=>b.dataset.type===dayName);
  const target = hit ? dayName : (curSplit==='PPL' ? (dayName.includes('PUSH')?'Push':dayName.includes('PULL')?'Pull':'Legs') : (curSplit==='FullBody'?'Full Body':curSplit==='UpperLower'?'Upper/Lower':'Bro Split'));
  wbtns.forEach(b=>b.classList.toggle('active', b.dataset.type===target));
  wType = target;
  // đồng bộ ẩn/hiện trường cường độ / cardio
  const isCardioType = wType==='Cardio';
  document.getElementById('intensityField').style.display = isCardioType?'none':'';
  document.getElementById('cardioField').style.display = isCardioType?'':'none';
  updateIntensityHint();
  const container=document.getElementById('exerciseRows');
  container.innerHTML='';
  exs.forEach(ex=>container.appendChild(exerciseRow(ex)));
  fillExList();
}

// ====== WORKOUT ======
let wType = 'Push'; // phải khai báo TRƯỚC khi dùng trong fillWorkoutFromRoutine
document.getElementById('wDate').value = today();
document.getElementById('wTime').value = clockNow();
document.getElementById('mTime').value = clockNow();
document.querySelectorAll('#wTypeBtns .type-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#wTypeBtns .type-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); wType=b.dataset.type;
    fillExList(); // cập nhật gợi ý bài tập theo loại buổi vừa chọn
    // Cardio: ẩn cường độ, hiện chọn môn; còn lại: ngược lại
    const isCardioType = wType==='Cardio';
    document.getElementById('intensityField').style.display = isCardioType?'none':'';
    document.getElementById('cardioField').style.display = isCardioType?'':'none';
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
// Đổi môn cardio → tính calo lại
document.getElementById('cardioSelect').addEventListener('change', updateCalPreview);
// Gõ thời lượng → tính calo live
document.getElementById('wDur').addEventListener('input', updateCalPreview);

// Danh sách gợi ý bài tập (gộp tất cả giáo án + cardio)
const ALL_EX = (()=>{
  const names=new Set(['Chạy bộ','Đi bộ','Đạp xe','Máy chèo','Jump Rope']);
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
  const map={'Full Body':'FullBody','Upper/Lower':'UpperLower','Bro Split':'BroSplit'};
  const o={};
  Object.entries(map).forEach(([label,key])=>{
    o[label]=new Set();
    EXTRA_SPLITS[key].days.forEach(d=>d.exs.forEach(e=>o[label].add(e.name)));
  });
  return o;
})();
// Cardio: MET từng môn (chuẩn ACSM)
const CARDIO_MET = {'Chạy bộ':9,'Đi bộ':3.5,'Đạp xe':6.5,'Máy chèo':7,'Jump Rope':11};
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
  const met = wType==='Cardio'
    ? (CARDIO_MET[document.getElementById('cardioSelect').value]||6.5)
    : num(document.querySelector('#intensityBtns .type-btn.active')?.dataset.met, 4.5);
  return Math.round(met * 3.5 * getBodyWeight() * dur / 200);
}
function updateCalPreview(){
  const el = document.getElementById('calPreview');
  if(!el) return;
  const k = calcWorkoutKcal();
  el.textContent = k>0 ? '🔥 '+fmt(k)+' kcal' : '—';
  el.classList.toggle('has', k>0);
}
function exerciseRow(ex){
  const cardio = ex && isCardio(ex.name);
  const d=document.createElement('div');
  d.className='form-row'; d.style.marginBottom='0'; d.style.alignItems='center';
  d.innerHTML = `
    <input type="text" class="ex-name" list="exList" placeholder="Bài tập" value="${(ex&&ex.name)||''}" style="flex:1;min-width:120px">
    <div class="ex-fields" style="display:flex;gap:8px;align-items:flex-end">
      <div class="field ex-sets-field" style="${cardio?'display:none':''}"><label>Sets</label><input type="number" class="ex-sets" min="1" value="${(ex&&ex.sets)||3}" style="width:60px"></div>
      <div class="field ex-reps-field" style="${cardio?'display:none':''}"><label>Reps</label><input type="number" class="ex-reps" min="1" value="${parseInt((ex&&ex.reps)||10)||10}" style="width:70px"></div>
      <div class="field ex-w-field"><label class="w-lbl">${cardio?'Phút':'Kg'}</label><input type="number" class="ex-w" min="0" step="0.5" value="${(ex&&ex.w)||0}" style="width:70px"></div>
      <div class="field ex-speed-field" style="${cardio?'':'display:none'}"><label>Km/h</label><input type="number" class="ex-speed" min="0" step="0.5" value="${(ex&&ex.speed)||0}" style="width:65px"></div>
      <div class="field ex-incline-field" style="${cardio?'':'display:none'}"><label>Dốc %</label><input type="number" class="ex-incline" min="0" step="0.5" value="${(ex&&ex.incline)||0}" style="width:65px"></div>
    </div>
    <button class="btn danger ex-del">✕</button>`;
  const sync = ()=>{
    const name = d.querySelector('.ex-name').value.trim();
    const c = isCardio(name);
    d.querySelector('.ex-sets-field').style.display = c ? 'none' : '';
    d.querySelector('.ex-reps-field').style.display = c ? 'none' : '';
    d.querySelector('.ex-speed-field').style.display = c ? '' : 'none';
    d.querySelector('.ex-incline-field').style.display = c ? '' : 'none';
    d.querySelector('.w-lbl').textContent = c ? 'Phút' : 'Kg';
  };
  d.querySelector('.ex-del').addEventListener('click',()=>{ d.remove(); });
  d.querySelector('.ex-name').addEventListener('input',()=>{ sync(); fillExList(); });
  return d;
}
function fillExList(){
  const dl=document.getElementById('exList'); dl.innerHTML='';
  const seen=new Set();
  // lọc theo loại buổi đang chọn: Push → chỉ bài Push; Full Body → chỉ bài trong giáo án đó; Cardio → bài cardio
  let pool=ALL_EX;
  if(wType==='Cardio') pool=['Chạy bộ','Đi bộ','Đạp xe','Máy chèo','Jump Rope'];
  else if(SPLIT_EX[wType]) pool=[...SPLIT_EX[wType]];
  else if(wType==='Push'||wType==='Pull'||wType==='Legs') pool=ALL_EX.filter(n=>GROUP[n]===wType);
  pool.forEach(e=>{ const o=document.createElement('option'); o.value=e; dl.appendChild(o); seen.add(e); });
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
  updateCalPreview();
});
document.getElementById('saveWorkout').addEventListener('click',()=>{
  const date=document.getElementById('wDate').value||today();
  const dur=num(document.getElementById('wDur').value);
  if(!dur||dur<=0){ alert('Bắt buộc nhập thời lượng (phút)'); document.getElementById('wDur').focus(); return; }
  const exs=[...document.querySelectorAll('#exerciseRows .form-row')]
      .map(r=>({name:r.querySelector('.ex-name').value.trim(),sets:num(r.querySelector('.ex-sets').value),reps:num(r.querySelector('.ex-reps').value),w:num(r.querySelector('.ex-w').value),speed:num(r.querySelector('.ex-speed')?.value),incline:num(r.querySelector('.ex-incline')?.value)}))
      .filter(e=>e.name);
  if(!exs.length){ alert('Thêm ít nhất 1 bài tập'); return; }
  // calo đốt: tự tính theo chuẩn ACSM (MET × 3.5 × cân nặng × phút ÷ 200)
  const cal = calcWorkoutKcal();
  workouts.push({id:Date.now(), date, time:document.getElementById('wTime').value, type:wType, dur, cal, exs});
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
        <span class="badge ${w.type==='Push'?'push':w.type==='Pull'?'pull':w.type==='Legs'?'legs':'gray'}">${w.type}</span>
        <span class="wk-date">${vnDateFull(w.date)}${w.time?' · '+w.time:''}${w.dur?' · '+w.dur+' phút':''}</span>
        ${w.cal?`<span class="badge green">🔥 ${fmt(w.cal)} kcal</span>`:''}
        <button class="btn danger" data-del="${w.id}">✕</button>
      </div>
      <div class="wk-chips">${w.exs.map(e=>{
              const c=isCardio(e.name);
              return c
                ? `<span class="chip">${e.name} ${e.w||0} phút${e.speed?' @'+e.speed+'km/h':''}${e.incline?' dốc'+e.incline+'%':''}</span>`
                : `<span class="chip">${e.name} ${e.sets}×${e.reps}${e.w?' @'+e.w+'kg':''}</span>`;
            }).join('')}</div>
    </div>`).join('');
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Xoá buổi tập này?')){ workouts=workouts.filter(w=>w.id!=b.dataset.del); save(LS.workouts,workouts); renderAll(); }
  }));
}

// ====== MEALS ======
// Nạp database món ăn
let FOOD_DB = [];
(async function loadFoods(){
  try{ const r=await fetch('data/foods.json'); FOOD_DB=await r.json(); }catch(e){ console.log('Không tải được foods.json'); }
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
  foodInput.value=''; sugBox.style.display='none';
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
  const v=foodInput.value.trim().replace(' ⭐','');
  const hit=allFoods().find(f=>f.n.toLowerCase()===v.toLowerCase());
  if(hit) fillMacros(hit);
});
// Điền macro theo món + khối lượng
function fillMacros(hit){
  const qty=num(document.getElementById('mQty').value,100);
  const ratio=hit.unit==='g' ? qty/100 : qty;
  document.getElementById('mCalV').value=Math.round(hit.kcal*ratio);
  document.getElementById('mProV').value=Math.round(hit.p*ratio);
  document.getElementById('mCarbV').value=Math.round(hit.c*ratio);
  document.getElementById('mFatV').value=Math.round(hit.f*ratio);
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
    carb:num(document.getElementById('mCarbV').value), fat:num(document.getElementById('mFatV').value)};
  meals.push(m); save(LS.meals, meals);
  document.getElementById('mName').value=''; document.getElementById('mTime').value=clockNow(); ['mCalV','mProV','mCarbV','mFatV'].forEach(i=>document.getElementById(i).value='');
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
      <div class="grow"><div class="name">${m.meal} · ${m.name}</div>
      <div class="meta">${m.time?'🕒 '+m.time+' · ':''}${mealTiming(m)?' '+mealTiming(m)+' · ':''}P ${m.pro}g · C ${m.carb}g · F ${m.fat}g</div></div>
      <span class="badge gray">${fmt(m.cal)} kcal</span>
      <button class="btn danger" data-del="${m.id}">✕</button>
    </div>`).join('') : '<div class="empty">Chưa có bữa ăn nào hôm nay</div>';
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
// ====== AI PARSE (bữa ăn) ======
// Key: chỉ từ config.js (GitHub Actions chèn từ Secret khi deploy). KHÔNG đọc localStorage cũ.
const AI_CFG = {key:(window.AI_CONFIG&&window.AI_CONFIG.key)||'', endpoint:(window.AI_CONFIG&&window.AI_CONFIG.endpoint)||'https://api.b.ai/v1', model:(window.AI_CONFIG&&window.AI_CONFIG.model)||'glm-5.3-flash', visionModel:(window.AI_CONFIG&&window.AI_CONFIG.visionModel)||'glm-5.3-flash'};
localStorage.removeItem('gym_ai_cfg'); localStorage.removeItem('gym_ai_provs'); // dọn cấu hình cũ gây lỗi
// Trạng thái ảnh đã chọn (base64 data URL) cho AI phân tích
let aiPhotoData = null;
document.getElementById('aiUploadImg').addEventListener('change', e=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const img = new Image();
  const url = URL.createObjectURL(f);
  img.onload = ()=>{
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    aiPhotoData = cv.toDataURL('image/jpeg', 0.85);
    // hiện thumbnail
    document.getElementById('aiPhotoThumb').src = aiPhotoData;
    document.getElementById('aiPhotoName').textContent = f.name;
    document.getElementById('aiPhotoBox').style.display = 'flex';
    document.getElementById('aiResult').textContent = '';
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); document.getElementById('aiResult').textContent='❌ Không đọc được ảnh'; };
  img.src = url;
  e.target.value = '';
});
// Nút bỏ ảnh
document.getElementById('aiPhotoClear').addEventListener('click', ()=>{
  aiPhotoData = null;
  document.getElementById('aiPhotoBox').style.display = 'none';
  document.getElementById('aiPhotoThumb').src = '';
  document.getElementById('aiResult').textContent = '';
});
function aiParse(){
  const prompt=document.getElementById('aiPrompt').value.trim();
  const out=document.getElementById('aiResult');
  if(!prompt && !aiPhotoData){ out.textContent='⚠️ Nhập mô tả bữa ăn hoặc chụp ảnh món ăn trước'; return; }
  if(!AI_CFG.key){ out.textContent='⚠️ Bản này chưa có key AI. Bản deploy từ GitHub sẽ có sẵn.'; return; }
  out.textContent='⏳ Đang phân tích'+(aiPhotoData?' ảnh...':'...');
  const sys = `Bạn là chuyên gia dinh dưỡng. Người dùng gửi ảnh món ăn (hoặc mô tả bằng tiếng Việt kiểu "1 chén cơm, 300g ức gà, 2 quả trứng ốp la").
Hãy NHẬN DIỆN món ăn trong ảnh và trả về CHỈ MỘT JSON array, mỗi phần tử: {"name":"tên món","qty":số lượng,"unit":"g hoặc suat","kcal":số,"p":protein g,"c":carbs g,"f":fat g}.
QUAN TRỌNG: kcal/p/c/f là TỔNG giá trị của món đó với ĐÚNG số lượng qty đã cho (không phải per 100g).
Nếu không chắc khối lượng thì ước lượng suất ăn điển hình (VD 1 tô phở bò ≈ 450 kcal, 20g P, 50g C, 15g F) rồi ghi rõ trong name.
Ví dụ: "300g ức gà luộc" → {"name":"ức gà luộc","qty":300,"unit":"g","kcal":495,"p":93,"c":0,"f":9} (vì 100g ức gà ≈ 165 kcal, 31g P → 300g ≈ 495 kcal, 93g P).
"2 quả trứng ốp la" → {"name":"trứng ốp la","qty":2,"unit":"qua","kcal":180,"p":14,"c":1,"f":13} (1 quả ≈ 90 kcal).
"1 tô phở bò" → {"name":"phở bò","qty":1,"unit":"suat","kcal":450,"p":20,"c":50,"f":15}.
Ước lượng dinh dưỡng hợp lý. KHÔNG thêm text nào ngoài JSON.`;
  const userMsg = aiPhotoData
    ? [
        {type:'text', text: prompt || 'Phân tích món ăn trong ảnh này. Trả JSON như hướng dẫn.'},
        {type:'image_url', image_url:{url: aiPhotoData}}
      ]
    : prompt;
  const ep = (AI_CFG.endpoint||'https://api.b.ai/v1').replace(/\/+$/,'');
  fetch(ep+'/chat/completions', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+AI_CFG.key},
    body:JSON.stringify({model:aiPhotoData ? (AI_CFG.visionModel||'glm-5.3-flash') : (AI_CFG.model||'glm-5.3-flash'), messages:[{role:'system',content:sys},{role:'user',content:userMsg}], temperature:0.2})})
    .then(r=>r.json())
    .then(data=>{
      if(data.error){ out.textContent='❌ Lỗi: '+(data.error.message||data.error); return; }
      const txt=data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      if(!txt){ out.textContent='❌ Không nhận được kết quả từ AI'; return; }
      const m=txt.match(/\[[\s\S]*\]/);
      if(!m){ out.textContent='❌ AI trả về không phải JSON: '+txt.slice(0,120); return; }
      const items=JSON.parse(m[0]);
      if(!items.length){ out.textContent='❌ Không nhận diện được món nào'; return; }
      items.forEach(it=>{
        // AI đã trả TỔNG kcal/p/c/f cho đúng số lượng → dùng thẳng, không nhân ratio nữa
        meals.push({id:Date.now()+Math.random(), date:today(), meal:document.getElementById('mMeal').value,
          name:it.name||'Món ăn', cal:Math.round(num(it.kcal,0)), pro:Math.round(num(it.p,0)),
          carb:Math.round(num(it.c,0)), fat:Math.round(num(it.f,0))});
      });
      save(LS.meals, meals);
      out.innerHTML='✅ Đã thêm <b>'+items.length+'</b> món: '+items.map(x=>x.name+(x.qty?` (${x.qty}${x.unit==='g'?'g':''})`:'')).join(', ');
      document.getElementById('aiPrompt').value='';
      aiPhotoData = null; // xoá ảnh sau khi thêm thành công
      renderAll();
    })
    .catch(e=>{ out.textContent='❌ Lỗi kết nối: '+e.message; });
}
document.getElementById('aiParseBtn').addEventListener('click', aiParse);
document.getElementById('aiPrompt').addEventListener('keydown', e=>{ if(e.key==='Enter') aiParse(); });

// ====== AI CHUNG (gọi 1 lần, dùng cho thực đơn / nhận xét / hỏi đáp) ======
function aiCall(sys, user){
  if(!AI_CFG.key) return Promise.reject(new Error('Bản này chưa có key AI. Bản deploy từ GitHub sẽ có sẵn.'));
  const ep=(AI_CFG.endpoint||'https://api.b.ai/v1').replace(/\/+$/,'');
  return fetch(ep+'/chat/completions', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+AI_CFG.key},
    body:JSON.stringify({model:AI_CFG.model||'glm-5.3-flash', messages:[{role:'system',content:sys},{role:'user',content:user}], temperature:0.4})})
    .then(r=>r.json())
    .then(data=>{
      if(data.error) throw new Error(data.error.message||data.error);
      const txt=data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      if(!txt) throw new Error('Không nhận được kết quả từ AI');
      return txt.trim();
    });
}
// Hiện kết quả AI (xuống dòng thành <br>)
const aiShow = (el, txt) => el.innerHTML = txt.replace(/\n/g,'<br>');

// ====== AI 2: GỢI Ý THỰC ĐƠN HÔM NAY ======
document.getElementById('aiPlanBtn').addEventListener('click', ()=>{
  const out=document.getElementById('aiPlanOut');
  const t=dayTotals(today());
  const goalCal=num(document.getElementById('gCal').value,2400);
  const goalPro=num(document.getElementById('gPro').value,150);
  const tdee=getTDEE();
  const favs=favFoods.map(f=>f.n).slice(0,15);
  const time=document.getElementById('aiPlanTime').value; // "17:30" hoặc ""
  out.textContent='⏳ Đang xếp thực đơn...';
  const sys='Bạn là chuyên gia dinh dưỡng thể thao. Trả lời bằng tiếng Việt, ngắn gọn, thực tế, không dùng bảng phức tạp.';
  const user=`Tôi tập gym. Mục tiêu: ${goalCal} kcal/ngày, protein ${goalPro}g. TDEE: ${tdee} kcal. Hôm nay đã nạp ${t.cal} kcal.
Món tôi hay ăn (ưu tiên chọn trong đây): ${favs.length?favs.join(', '):'chưa có — chọn món Việt phổ biến'}.
${time?`Hôm nay tôi tập lúc ${time} (${time} giờ).`:''}
Gợi ý thực đơn hôm nay: bữa Sáng, Trưa, Tối (mỗi bữa: món + khẩu lượng + ~calo), tổng ~${goalCal} kcal, đủ protein. ${time?`Kèm mục "TRƯỚC TẬP": nên ăn gì, ăn cách giờ tập bao lâu (tập lúc ${time}), và sau tập nên nạp gì.`:''}`;
  aiCall(sys,user).then(txt=>{ aiShow(out,txt); }).catch(e=>{ out.textContent='❌ '+e.message; });
});
// Bỏ chọn giờ tập
document.getElementById('aiPlanNoTime').addEventListener('click', ()=>{
  document.getElementById('aiPlanTime').value='';
});

// ====== AI 1: NHẬN XÉT TUẦN ======
document.getElementById('aiReviewBtn').addEventListener('click', ()=>{
  const out=document.getElementById('aiReviewOut');
  out.textContent='⏳ AI đang đọc dữ liệu 7 ngày...';
  const days=[...Array(7)].map((_,i)=>daysAgo(6-i));
  const wk=workouts.filter(w=>w.date>=days[0]);
  const wl=weights.filter(w=>w.date>=days[0]).sort((a,b)=>a.date.localeCompare(b.date));
  const sys='Bạn là huấn luyện viên gym chuyên nghiệp. Nhận xét ngắn gọn, cụ thể, có số liệu, tiếng Việt. Không chê bai — luôn kèm hướng khắc phục.';
  const user=`Dữ liệu 7 ngày qua (${vnDate(days[0])} → ${vnDate(days[6])}):
- Buổi tập: ${wk.length} buổi. ${wk.map(w=>`${vnDate(w.date)} ${w.type} ${w.dur} phút ${w.cal} kcal`).join('; ')||'không có'}
- Calo nạp từng ngày: ${days.map(d=>`${vnDate(d)} ${dayTotals(d).cal} kcal`).join(', ')}
- Cân nặng: ${wl.length?wl.map(w=>`${vnDate(w.date)} ${w.v} kg`).join(' → '):'chưa ghi'}
- Mục tiêu: ${num(document.getElementById('gCal').value,2400)} kcal/ngày, TDEE ${getTDEE()} kcal.
Nhận xét: 1) điểm tốt 2) điểm cần cải thiện 3) 3 gợi ý cụ thể cho tuần tới.`;
  aiCall(sys,user).then(txt=>{ aiShow(out,txt); }).catch(e=>{ out.textContent='❌ '+e.message; });
});

// ====== AI 3: HỎI AI VỀ TẬP LUYỆN / ĂN UỐNG ======
function aiAsk(){
  const q=document.getElementById('aiAsk').value.trim();
  const out=document.getElementById('aiAskOut');
  if(!q){ out.textContent='⚠️ Nhập câu hỏi trước'; return; }
  out.textContent='⏳ Đang trả lời...';
  const wk=workouts.slice(-10).reverse();
  // Hôm nay đã ăn gì (từng bữa) + tổng
  const tMeals=meals.filter(m=>m.date===today());
  const tTotal=dayTotals(today());
  const todayEat = tMeals.length
    ? tMeals.map(m=>`${m.time||'?'} ${m.meal}: ${m.name} (${m.cal} kcal, P ${m.pro}g, C ${m.carb}g, F ${m.fat}g)`).join('; ')
    : 'chưa ghi bữa nào';
  // Hôm nay đã tập gì (loại + thời lượng + từng bài)
  const tWks=workouts.filter(w=>w.date===today());
  const todayTrain = tWks.length
    ? tWks.map(w=>`${w.time||'?'} ${w.type} ${w.dur||0} phút (${w.cal||0} kcal): ${w.exs.map(e=>isCardio(e.name)
        ? `${e.name} ${e.w||0} phút${e.speed?' @'+e.speed+'km/h':''}`
        : `${e.name} ${e.sets||0}×${e.reps||0}${e.w?' @'+e.w+'kg':''}`).join(', ')}`).join('; ')
    : 'chưa tập';
  const sys='Bạn là huấn luyện viên gym. Trả lời tiếng Việt, ngắn gọn, dễ hiểu, dựa trên dữ liệu người dùng nếu liên quan.';
  const user=`Giáo án đang theo: ${curSplit} (${getDayMeta(curSplit,daySelect.value).label}). Lịch tập gần đây: ${wk.map(w=>`${vnDate(w.date)} ${w.type}`).join('; ')||'chưa có'}. Cân nặng: ${getBodyWeight()} kg. Mục tiêu: ${num(document.getElementById('gCal').value,2400)} kcal/ngày.
HÔM NAY đã ăn (tổng ${tTotal.cal} kcal): ${todayEat}.
HÔM NAY đã tập: ${todayTrain}.
Câu hỏi: ${q}`;
  aiCall(sys,user).then(txt=>{ aiShow(out,txt); }).catch(e=>{ out.textContent='❌ '+e.message; });
}
document.getElementById('aiAskBtn').addEventListener('click', aiAsk);
document.getElementById('aiAsk').addEventListener('keydown', e=>{ if(e.key==='Enter') aiAsk(); });
// Câu hỏi mẫu bấm nhanh: điền vào ô + hỏi luôn
document.querySelectorAll('.qi-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.getElementById('aiAsk').value = b.dataset.q;
    aiAsk();
  });
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
  document.getElementById('stKcalIn').textContent=fmt(dayTotals(today()).cal);

  const hour=new Date().getHours();
  const g=hour<12?'Chúc buổi sáng':hour<17?'Chúc buổi chiều':hour<21?'Chúc buổi tối':'Chúc bạn ngủ ngon';
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
    tMeals.map(m=>`<div class="list-item"><div class="grow"><div class="name">${m.meal} · ${m.name}</div><div class="meta">${m.time?'🕒 '+m.time+' · ':''}${mealTiming(m)?mealTiming(m)+' · ':''}${m.pro||0}g protein</div></div><span class="badge gray">${fmt(m.cal)} kcal</span></div>`).join('')
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
      Object.entries(types).map(([t,c])=>`<div class="list-item"><div class="grow"><div class="name"><span class="badge ${t==='Push'?'push':t==='Pull'?'pull':t==='Legs'?'legs':'gray'}">${t}</span></div></div><span class="badge gray">${c} buổi</span></div>`).join('')
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
    ${rows.map(r=>`<tr><td>${r.n}</td><td>${r.count}</td><td class="weight-cell">${fmt(r.vol)}</td><td>${r.bs.w?r.bs.w+' kg × '+r.bs.reps:''}</td></tr>`).join('')}
    </tbody></table>`:'<div class="empty">Chưa có bài tập nào trong 7 ngày qua</div>')+
  `<h3 style="margin:16px 0 10px;font-size:15px">📚 Tất cả (mọi thời điểm)</h3>
  <table><thead><tr><th>Bài tập</th><th>Tổng lần</th><th>PR (max kg)</th><th>Best set</th></tr></thead><tbody>`+
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
  ['weekly','exercise','plan','ai'].forEach(t=>document.getElementById('prog-'+t).style.display = t===b.dataset.tab?'block':'none');
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
  localStorage.removeItem('gym_body'); localStorage.removeItem('gym_split');
  alert('✅ Đã xoá sạch toàn bộ dữ liệu. Trang sẽ tải lại.');
  location.reload();
});

// ====== RENDER ALL ======
function renderAll(){
  renderHome(); renderMonth(); renderRoutine(); renderWorkoutList(); renderDiet(); renderWeight(); renderTdee(); renderWeekly(); renderExercise(); renderPlan();
}
renderAll();