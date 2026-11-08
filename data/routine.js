// ====== BỘ TẬP CỦA BẠN ======
// Giáo án 12 tuần — tăng cơ giảm mỡ (recomp), 5 buổi tạ/tuần:
//   T2 Push · T3 Pull · T4 Legs · T5 nghỉ/cardio nhẹ · T6 Upper · T7 Lower · CN nghỉ
// Tăng tạ theo luật kép: đủ số rep cao nhất ở MỌI set → buổi sau tăng tạ
// (thân trên +1–2.5kg, chân +2.5–5kg). Mỗi set dừng khi còn sức làm thêm 1–2 rep.
// Tuần 6 và 12: deload — giữ tạ, bớt ~1/3 số set.

// Thông tin từng bài (định nghĩa 1 lần). img/alt = tên file ảnh trong img/ (…_0.jpg bắt đầu, …_1.jpg kết thúc)
// LƯU Ý: giữ nguyên tên bài cũ để mục "↩ Lần trước" vẫn tìm được lịch sử.
const EX = {
  // --- Ngực / vai / tay sau ---
  'Bench Press':            { icon:'🏋️', muscle:'Ngực giữa',          tip:'Tạ đòn, khuỷu tay ~45°, hạ chạm ngực có kiểm soát, đẩy mạnh lên',     img:'Barbell_Bench_Press_-_Medium_Grip', alt:'Machine_Bench_Press' },
  'Incline Dumbbell Press': { icon:'🏋️', muscle:'Ngực trên',          tip:'Ghế dốc 30°, tạ đơn, hạ sâu ngang ngực, không đập tạ vào nhau',       img:'Incline_Dumbbell_Press', alt:'Leverage_Incline_Chest_Press' },
  'Chest Press Machine':    { icon:'🏋️', muscle:'Ngực',               tip:'Ép tay ngang ngực, giữ vai ép xuống ghế, không khoá khuỷu',           img:'Machine_Bench_Press' },
  'Chest Fly':              { icon:'🦅', muscle:'Ngực (ép trong)',     tip:'Máy fly, khuỷu hơi cong, ép ngực vào giữa, siết 1 giây',              img:'Butterfly' },
  'Shoulder Press':         { icon:'⬆️', muscle:'Vai trước',          tip:'Ngồi tựa lưng, đẩy tạ qua đầu, không ưỡn lưng',                       img:'Seated_Dumbbell_Press', alt:'Machine_Shoulder_Military_Press' },
  'Lateral Raise':          { icon:'🔺', muscle:'Vai giữa',           tip:'Tạ nhẹ, khuỷu hơi cong, nâng ngang vai, hạ chậm',                     img:'Side_Lateral_Raise' },
  'Tricep Pushdown':        { icon:'💪', muscle:'Tay sau',            tip:'Cáp, khuỷu khép sát người, duỗi hết biên độ',                         img:'Triceps_Pushdown', alt:'Machine_Triceps_Extension' },
  // --- Lưng / vai sau / tay trước ---
  'Lat Pulldown':           { icon:'🔽', muscle:'Xô',                 tip:'Kéo thanh về ngực trên, ép bả vai xuống, không ngả người quá nhiều',  img:'Close-Grip_Front_Lat_Pulldown' },
  'Seated Cable Row':       { icon:'➡️', muscle:'Lưng giữa',          tip:'Kéo cáp về bụng, ép hai bả vai lại, lưng thẳng',                      img:'Seated_Cable_Rows' },
  'One-Arm Cable Lat Pulldown': { icon:'↘️', muscle:'Xô',             tip:'Từng tay, kéo khuỷu xuống sát hông, siết xô',                         img:'One_Arm_Lat_Pulldown' },
  'Face Pull':              { icon:'🎯', muscle:'Vai sau, cầu vai',   tip:'Dây thừng ngang mặt, kéo về trán, khuỷu cao, xoay tay ra sau',        img:'Face_Pull' },
  'Preacher Curl':          { icon:'💪', muscle:'Tay trước',          tip:'Ghế preacher, khuỷu cố định, hạ gần thẳng tay',                       img:'Preacher_Curl', alt:'Machine_Preacher_Curls' },
  'Hammer Curl':            { icon:'🔨', muscle:'Tay trước, cẳng tay', tip:'Tạ đơn, lòng bàn tay hướng vào nhau, không vung người',             img:'Alternate_Hammer_Curl', alt:'Machine_Bicep_Curl' },
  // --- Chân / mông / bụng ---
  'Squat':                  { icon:'🦵', muscle:'Đùi trước, mông',    tip:'Tạ đòn sau vai, hạ hông ngang gối hoặc thấp hơn, lưng thẳng',         img:'Barbell_Full_Squat', alt:'Smith_Machine_Squat' },
  'Hack Squat':             { icon:'🦵', muscle:'Đùi trước',          tip:'Tựa lưng vào máy, hạ sâu có kiểm soát, đẩy bằng cả bàn chân',         img:'Smith_Machine_Squat' },
  'Leg Press':              { icon:'🦿', muscle:'Đùi trước, mông',    tip:'Hạ đến khi gối gần ngực, không nhấc mông khỏi ghế, không khoá gối',   img:'Leg_Press' },
  'Bulgarian Split Squat':  { icon:'🦵', muscle:'Đùi trước, mông',    tip:'Chân sau gác ghế, hạ thẳng xuống, tạ đơn hai tay. Số rep tính MỖI chân', img:'Split_Squat_with_Dumbbells', alt:'Smith_Single-Leg_Split_Squat' },
  'Back Extension':         { icon:'🙇', muscle:'Đùi sau, mông, lưng dưới', tip:'Ghế 45°, gập ở hông (không gù lưng), lên đến khi người thẳng hàng chân, siết mông. Nhẹ quá thì ôm bánh tạ', img:'Hyperextensions_Back_Extensions' },
  'Leg Extension':          { icon:'⬆️', muscle:'Đùi trước',          tip:'Duỗi thẳng chân, siết đùi 1 giây ở đỉnh, hạ chậm',                    img:'Leg_Extensions' },
  'Leg Curl':               { icon:'⬇️', muscle:'Đùi sau',            tip:'Nằm sấp, cuộn gót về mông, hạ chậm',                                  img:'Lying_Leg_Curls' },
  'Walking Lunge':          { icon:'🚶', muscle:'Mông, đùi trước',    tip:'Tạ đơn hai tay, bước dài, gối sau gần chạm sàn, đẩy bằng gót chân trước. Số rep tính MỖI chân', img:'Dumbbell_Lunges' },
  'Abductor':               { icon:'🦵', muscle:'Mông bên',           tip:'Máy, đẩy hai chân ra ngoài, giữ 1 giây',                              img:'Thigh_Abductor' },
  'Calf Raise':             { icon:'🦶', muscle:'Bắp chân',           tip:'Kiễng gót hết cỡ, giữ 1 giây, hạ sâu dưới mặt bậc',                   img:'Standing_Calf_Raises' },
  'Abdominal Crunch Machine': { icon:'🎯', muscle:'Bụng',             tip:'Gập bụng, thở ra khi gập, không kéo bằng tay',                        img:'Ab_Crunch_Machine' },
  'Leg Raise':              { icon:'⬆️', muscle:'Bụng dưới',          tip:'Nằm ngửa, nâng chân, giữ lưng dưới sát ghế',                          img:'Flat_Bench_Lying_Leg_Raise' },
};

// Ghép danh sách [tên, sets, reps] với thông tin bài
const day = list => list.map(([name, sets, reps]) => ({ name, sets, reps, ...EX[name] }));
const sumSets = exs => exs.reduce((a, e) => a + e.sets, 0);

const ROUTINE = {
  Push: {
    color: 'var(--push)', emoji: '🔴', name: 'PUSH — Ngực / Vai / Tay sau',
    exs: day([
      ['Bench Press',            4, '6–8'],
      ['Incline Dumbbell Press', 3, '8–10'],
      ['Shoulder Press',         3, '8–10'],
      ['Lateral Raise',          4, '12–15'],
      ['Chest Fly',              2, '12–15'],
      ['Tricep Pushdown',        3, '10–12'],
    ])
  },
  Pull: {
    color: 'var(--pull)', emoji: '🔵', name: 'PULL — Lưng / Vai sau / Tay trước',
    exs: day([
      ['Lat Pulldown',               4, '8–10'],
      ['Seated Cable Row',           4, '8–10'],
      ['One-Arm Cable Lat Pulldown', 2, '10–12'],
      ['Face Pull',                  3, '15–20'],
      ['Preacher Curl',              3, '10–12'],
      ['Hammer Curl',                2, '10–12'],
    ])
  },
  Legs: {
    color: 'var(--legs)', emoji: '🟢', name: 'LEGS — Thiên đùi trước',
    exs: day([
      ['Squat',                    4, '6–8'],
      ['Leg Press',                3, '10–12'],
      ['Bulgarian Split Squat',    3, '8–10'],
      ['Leg Extension',            3, '12–15'],
      ['Leg Curl',                 3, '10–12'],
      ['Calf Raise',               3, '12–15'],
      ['Abdominal Crunch Machine', 3, '12–15'],
    ])
  }
};
Object.values(ROUTINE).forEach(r => { r.sets = sumSets(r.exs); });

// ====== GIÁO ÁN CHÍNH: PPL + UPPER / LOWER ======
const UPPER = day([
  ['Chest Press Machine',    3, '8–10'],
  ['Lat Pulldown',           3, '10–12'],
  ['Seated Cable Row',       3, '10–12'],
  ['Incline Dumbbell Press', 2, '10–12'],
  ['Lateral Raise',          4, '12–15'],
  ['Face Pull',              2, '15–20'],
  ['Preacher Curl',          2, '10–12'],
  ['Tricep Pushdown',        2, '10–12'],
]);
const LOWER = day([
  ['Back Extension',    3, '10–15'],
  ['Hack Squat',        3, '8–10'],
  ['Leg Curl',          3, '10–12'],
  ['Walking Lunge',     3, '10–12'],
  ['Abductor',          2, '12–15'],
  ['Calf Raise',        4, '12–15'],
  ['Leg Raise',         3, '10–15'],
]);
const EXTRA_SPLITS = {
  PPLUpperLower: {
    emoji: '📅', name: 'PPL + UPPER / LOWER — 5 buổi/tuần',
    days: [
      { name: 'Push — T2: Ngực / Vai / Tay sau',     exs: ROUTINE.Push.exs },
      { name: 'Pull — T3: Lưng / Vai sau / Tay trước', exs: ROUTINE.Pull.exs },
      { name: 'Legs — T4: Thiên đùi trước',          exs: ROUTINE.Legs.exs },
      { name: 'Upper — T6: Thân trên',               exs: UPPER },
      { name: 'Lower — T7: Đùi sau / Mông',          exs: LOWER },
    ]
  }
};

// Nhóm Push/Pull/Legs cho bài chỉ có trong Upper/Lower — dùng để lọc gợi ý khi gõ tên bài
const _G = {
  'Chest Press Machine':'Push',
  'Back Extension':'Legs',
  'Hack Squat':'Legs',
  'Walking Lunge':'Legs',
  'Abductor':'Legs',
  'Leg Raise':'Legs',
};

// Helper: lấy danh sách ảnh cho 1 bài (0 = bắt đầu, 1 = kết thúc)
// Nếu bài có `alt` (ví dụ Bench Press: tạ đòn hoặc máy) thì trả về 2 bộ ảnh
function getExImgs(ex) {
  const base = (folder, idx) => `img/${folder}_${idx}.jpg`;
  const one = f => f ? [base(f,0), base(f,1)] : [];
  const main = one(ex.img);
  function guessLabel(f) {
    const l = f.toLowerCase();
    if (l.includes('dumbbell')) return 'Tạ đơn';
    if (l.includes('barbell') || l.includes('_bar')) return 'Tạ đòn';
    if (l.includes('cable') || l.includes('triceps')) return 'Cáp';
    if (l.includes('machine') || l.includes('smith') || l.includes('leverage')) return 'Máy';
    return 'Tạ đơn';
  }
  if (ex.alt) {
    return [
      { label: guessLabel(ex.img), imgs: main },
      { label: 'Máy', imgs: one(ex.alt) }
    ];
  }
  return [{ label: null, imgs: main }];
}

// Helper: bài tập của 1 buổi trong giáo án (bản sao để không sửa nhầm dữ liệu gốc)
function getSplitDay(splitKey, dayIdx){
  return EXTRA_SPLITS[splitKey].days[dayIdx].exs.map(e => ({ ...e }));
}
