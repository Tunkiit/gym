// ====== BỘ TẬP CỦA BẠN ======
// Mỗi bài tập gồm: tên, icon, nhóm cơ, sets, reps, mẹo, folder ảnh, và kcal (calo ước mỗi set)
const ROUTINE = {
  Push: {
    color: 'var(--push)',
    emoji: '🔴',
    name: 'PUSH — Ngực / Vai / Tay sau',
    sets: 20,
    exs: [
      { name: 'Bench Press',              icon: '🏋️', muscle: 'Ngực giữa',        sets: 4, reps: '8–10',  kcal: 12, tip: 'Tạ đòn, khuỷu tay 45°, hít sâu xuống',                     img: 'Barbell_Bench_Press_-_Medium_Grip', alt: 'Machine_Bench_Press' },
      { name: 'Incline Dumbbell Press',    icon: '🏋️', muscle: 'Ngực trên',        sets: 4, reps: '8–10',  kcal: 10, tip: 'Ghế dốc 30°, tạ đơn, hít sâu xuống',                     img: 'Incline_Dumbbell_Press', alt: 'Leverage_Incline_Chest_Press' },
      { name: 'Chest Fly',                   icon: '🦅',  muscle: 'Ngực sâu',        sets: 3, reps: '12–15', kcal: 6,  tip: 'Máy fly, ép ngực vào trong, khuỷu hơi cong',                img: 'Butterfly' },
      { name: 'Lateral Raise',             icon: '🔺',  muscle: 'Vai giữa',        sets: 3, reps: '12–15', kcal: 5,  tip: 'Tạ nhẹ, khuỷu hơi cong, lên đến vai',                     img: 'Side_Lateral_Raise' },
      { name: 'Shoulder Press',            icon: '⬆️',  muscle: 'Vai trước',       sets: 3, reps: '8–10',  kcal: 9,  tip: 'Đẩy tạ đơn/đòn qua đầu, siết cơ vai',                      img: 'Seated_Dumbbell_Press', alt: 'Machine_Shoulder_Military_Press' },
      { name: 'Tricep Pushdown',           icon: '💪',  muscle: 'Tay sau',         sets: 3, reps: '10–15', kcal: 5,  tip: 'Cáp, khuỷu cố định, xuống hết biên độ',                    img: 'Triceps_Pushdown', alt: 'Machine_Triceps_Extension' },
    ]
  },
  Pull: {
    color: 'var(--pull)',
    emoji: '🔵',
    name: 'PULL — Lưng / Tay trước',
    sets: 20,
    exs: [
      { name: 'Lat Pulldown',              icon: '🔽',  muscle: 'Xô rộng',         sets: 4, reps: '8–10',  kcal: 8,  tip: 'Cầm rộng, kéo xuống ngực, siết xô',                       img: 'Close-Grip_Front_Lat_Pulldown' },
      { name: 'Seated Cable Row',          icon: '➡️',  muscle: 'Lưng giữa',       sets: 4, reps: '8–10',  kcal: 8,  tip: 'Kéo cáp về bụng, hít vai về sau',                          img: 'Seated_Cable_Rows' },
      { name: 'One-Arm Cable Lat Pulldown',icon: '↘️',  muscle: 'Xô sâu',          sets: 3, reps: '10–12', kcal: 6,  tip: 'Từng tay, kéo chéo xuống, siết lưng dưới',                 img: 'One_Arm_Lat_Pulldown' },
      { name: 'Straight-Arm Pulldown',     icon: '⬇️',  muscle: 'Lưng dưới',       sets: 3, reps: '12–15', kcal: 5,  tip: 'Tay thẳng, cáp từ trên, đẩy xuống đùi',                    img: 'Straight-Arm_Pulldown' },
      { name: 'Preacher Curl',             icon: '💪',  muscle: 'Tay trước (dài)',  sets: 3, reps: '10–12', kcal: 5,  tip: 'Ghế preacher, khuỷu cố định, cuộn lên',                    img: 'Preacher_Curl', alt: 'Machine_Preacher_Curls' },
      { name: 'Hammer Curl',               icon: '🔨',  muscle: 'Tay trước (cánh)', sets: 3, reps: '10–12', kcal: 5,  tip: 'Tạ đơn, lòng bàn tay hướng vào, cuộn lên',                  img: 'Alternate_Hammer_Curl', alt: 'Machine_Bicep_Curl' },
    ]
  },
  Legs: {
    color: 'var(--legs)',
    emoji: '🟢',
    name: 'LEGS + ABS — Chân / Bụng',
    sets: 25,
    exs: [
      { name: 'Squat',                    icon: '🦵',  muscle: 'Đùi trước',        sets: 4, reps: '8–10',  kcal: 15, tip: 'Tạ đòn sau cổ, hông xuống gối, lưng thẳng',                img: 'Barbell_Full_Squat', alt: 'Smith_Machine_Squat' },
      { name: 'Leg Press',                icon: '🦿',  muscle: 'Đùi trước',        sets: 3, reps: '10–12', kcal: 10, tip: 'Máy, đẩy bằng gót, không khoá gối',                        img: 'Leg_Press' },
      { name: 'Bulgarian Split Squat',    icon: '🦵',  muscle: 'Đùi sau',          sets: 3, reps: '8–12',  kcal: 9,  tip: 'Một chân sau ghế, squats 1 chân, tạ tay',                   img: 'Split_Squat_with_Dumbbells', alt: 'Smith_Single-Leg_Split_Squat' },
      { name: 'Leg Extension',            icon: '⬆️',  muscle: 'Đùi trước cô lập', sets: 3, reps: '12–15', kcal: 6,  tip: 'Máy, duỗi thẳng chân, siết đỉnh',                            img: 'Leg_Extensions' },
      { name: 'Leg Curl',                 icon: '⬇️',  muscle: 'Đùi sau',          sets: 3, reps: '10–15', kcal: 6,  tip: 'Máy, nằm sấp trên ghế, cuộn chân về mông, siết đùi sau',  img: 'Lying_Leg_Curls' },
      { name: 'Abductor',                 icon: '🦵',  muscle: 'Đùi ngoài',        sets: 3, reps: '12–15', kcal: 5,  tip: 'Máy, đẩy hai chân ra ngoài',                                 img: 'Thigh_Abductor' },
      { name: 'Abdominal Crunch Machine',  icon: '🧠',  muscle: 'Bụng trên',        sets: 3, reps: '12–15', kcal: 4,  tip: 'Máy crunch, gập bụng, thở ra khi gập',                       img: 'Ab_Crunch_Machine' },
      { name: 'Leg Raise',                icon: '⬆️',  muscle: 'Bụng dưới',        sets: 3, reps: '10–15', kcal: 4,  tip: 'Nằm ngửa, nâng chân thẳng, lưng dưới sát đất',              img: 'Flat_Bench_Lying_Leg_Raise' },
    ]
  }
};

// ====== GIÁO ÁN THÊM ======
// Các buổi tập khác. exs dùng lại bài từ ROUTINE (nếu trùng tên) hoặc định nghĩa mới
const EXTRA_SPLITS = {
  FullBody: {
    emoji: '🟡', name: 'FULL BODY — 3 buổi/tuần (A/B/C)',
    days: [
      { name: 'Full Body A — Squat focus', exs: [
        { name: 'Squat', sets: 4, reps: '8–10', kcal: 15 },
        { name: 'Bench Press', sets: 4, reps: '8–10', kcal: 12 },
        { name: 'Bent Over Barbell Row', icon: '🏋️', muscle: 'Lưng giữa', sets: 4, reps: '8–10', kcal: 10, tip: 'Cúi người 45°, kéo tạ về bụng, lưng thẳng', img: 'Bent_Over_Barbell_Row' },
        { name: 'Lat Pulldown', sets: 3, reps: '10–12', kcal: 8 },
        { name: 'Shoulder Press', sets: 3, reps: '8–10', kcal: 9 },
        { name: 'Leg Curl', sets: 3, reps: '10–15', kcal: 6 },
        { name: 'Tricep Pushdown', sets: 3, reps: '10–15', kcal: 5 },
      ]},
      { name: 'Full Body B — Incline + Legs', exs: [
        { name: 'Romanian Deadlift', icon: '🏋️', muscle: 'Đùi sau, mông', sets: 3, reps: '8–10', kcal: 12, tip: 'Tạ đòn, hạ tạ dọc đùi, đẩy hông ra sau, lưng thẳng', img: 'Romanian_Deadlift' },
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8–10', kcal: 10 },
        { name: 'Seated Cable Row', sets: 4, reps: '8–10', kcal: 8 },
        { name: 'Leg Press', sets: 3, reps: '10–12', kcal: 10 },
        { name: 'Lateral Raise', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Leg Extension', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Abdominal Crunch Machine', sets: 3, reps: '12–15', kcal: 4 },
      ]},
      { name: 'Full Body C — Compound + Tay', exs: [
        { name: 'Bulgarian Split Squat', sets: 3, reps: '8–12', kcal: 9 },
        { name: 'Pull-ups', icon: '⬆️', muscle: 'Xô', sets: 4, reps: '8–10', kcal: 10, tip: 'Bám xà rộng hơn vai, kéo cằm qua xà', img: 'Pullups' },
        { name: 'Chest Fly', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Straight-Arm Pulldown', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Tricep Pushdown', sets: 3, reps: '10–15', kcal: 5 },
        { name: 'Hammer Curl', sets: 3, reps: '10–12', kcal: 5 },
        { name: 'Leg Raise', sets: 3, reps: '10–15', kcal: 4 },
      ]}
    ]
  },
  UpperLower: {
    emoji: '🔵', name: 'UPPER / LOWER — 4 buổi/tuần',
    days: [
      { name: 'Upper A — Nặng ngang', exs: [
        { name: 'Bench Press', sets: 4, reps: '8–10', kcal: 12 },
        { name: 'Seated Cable Row', sets: 4, reps: '8–10', kcal: 8 },
        { name: 'Shoulder Press', sets: 3, reps: '8–10', kcal: 9 },
        { name: 'Lat Pulldown', sets: 3, reps: '10–12', kcal: 8 },
        { name: 'Lateral Raise', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Tricep Pushdown', sets: 3, reps: '10–15', kcal: 5 },
        { name: 'Preacher Curl', sets: 3, reps: '10–12', kcal: 5 },
      ]},
      { name: 'Lower A — Nặng squat', exs: [
        { name: 'Squat', sets: 4, reps: '8–10', kcal: 15 },
        { name: 'Leg Press', sets: 3, reps: '10–12', kcal: 10 },
        { name: 'Leg Curl', sets: 3, reps: '10–15', kcal: 6 },
        { name: 'Leg Extension', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '8–12', kcal: 9 },
        { name: 'Abductor', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Leg Raise', sets: 3, reps: '10–15', kcal: 4 },
      ]},
      { name: 'Upper B — Nặng dọc', exs: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8–10', kcal: 10 },
        { name: 'Lat Pulldown', sets: 4, reps: '8–10', kcal: 8 },
        { name: 'One-Arm Cable Lat Pulldown', sets: 3, reps: '10–12', kcal: 6 },
        { name: 'Lateral Raise', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Chest Fly', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Tricep Pushdown', sets: 3, reps: '10–15', kcal: 5 },
        { name: 'Hammer Curl', sets: 3, reps: '10–12', kcal: 5 },
      ]},
      { name: 'Lower B — Thiên đùi sau', exs: [
        { name: 'Romanian Deadlift', sets: 3, reps: '8–10', kcal: 12 },
        { name: 'Leg Press', sets: 3, reps: '10–12', kcal: 10 },
        { name: 'Leg Curl', sets: 3, reps: '10–15', kcal: 6 },
        { name: 'Leg Extension', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Abdominal Crunch Machine', sets: 3, reps: '12–15', kcal: 4 },
        { name: 'Leg Raise', sets: 3, reps: '10–15', kcal: 4 },
        { name: 'Abductor', sets: 3, reps: '12–15', kcal: 5 },
      ]}
    ]
  },
  BroSplit: {
    emoji: '🔴', name: 'BRO SPLIT — 5 buổi/tuần (1 nhóm cơ/ngày)',
    days: [
      { name: 'Ngực', exs: [
        { name: 'Bench Press', sets: 4, reps: '8–10', kcal: 12 },
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8–10', kcal: 10 },
        { name: 'Chest Fly', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Pushups', icon: '🙌', muscle: 'Ngực', sets: 3, reps: '12–15', kcal: 6, tip: 'Hít đất, lưng thẳng, ngực chạm đất', img: 'Pushups' },
      ]},
      { name: 'Lưng', exs: [
        { name: 'Lat Pulldown', sets: 4, reps: '8–10', kcal: 8 },
        { name: 'Seated Cable Row', sets: 4, reps: '8–10', kcal: 8 },
        { name: 'Straight-Arm Pulldown', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'One-Arm Cable Lat Pulldown', sets: 3, reps: '10–12', kcal: 6 },
        { name: 'Bent Over Barbell Row', sets: 3, reps: '10–12', kcal: 10 },
      ]},
      { name: 'Chân', exs: [
        { name: 'Squat', sets: 4, reps: '8–10', kcal: 15 },
        { name: 'Leg Press', sets: 3, reps: '10–12', kcal: 10 },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '8–12', kcal: 9 },
        { name: 'Leg Extension', sets: 3, reps: '12–15', kcal: 6 },
        { name: 'Leg Curl', sets: 3, reps: '10–15', kcal: 6 },
        { name: 'Abductor', sets: 3, reps: '12–15', kcal: 5 },
        { name: 'Leg Raise', sets: 3, reps: '10–15', kcal: 4 },
      ]},
      { name: 'Vai', exs: [
        { name: 'Shoulder Press', sets: 4, reps: '8–10', kcal: 9 },
        { name: 'Lateral Raise', sets: 4, reps: '12–15', kcal: 5 },
        { name: 'Cable Rear Delt Fly', icon: '🔻', muscle: 'Vai sau', sets: 3, reps: '12–15', kcal: 5, tip: 'Cáp, kéo dây về hai bên, siết vai sau', img: 'Cable_Rear_Delt_Fly' },
        { name: 'Face Pull', icon: '🎯', muscle: 'Vai sau, bẫy', sets: 3, reps: '15–20', kcal: 5, tip: 'Dây cáp, kéo về mặt, khuỷu cao', img: 'Face_Pull' },
        { name: 'Dumbbell Shrug', icon: '⛰️', muscle: 'Bẫy (trap)', sets: 3, reps: '12–15', kcal: 5, tip: 'Nhún vai với tạ đơn, siết đỉnh 1s', img: 'Dumbbell_Shrug' },
      ]},
      { name: 'Tay', exs: [
        { name: 'Tricep Pushdown', sets: 4, reps: '10–15', kcal: 5 },
        { name: 'Preacher Curl', sets: 4, reps: '10–12', kcal: 5 },
        { name: 'Hammer Curl', sets: 3, reps: '10–12', kcal: 5 },
        { name: 'Cable Rope Overhead Triceps Extension', icon: '💪', muscle: 'Tay sau (dài)', sets: 3, reps: '10–12', kcal: 5, tip: 'Cáp qua đầu, khuỷu cố định, duỗi thẳng', img: 'Cable_Rope_Overhead_Triceps_Extension' },
        { name: 'Standing Biceps Cable Curl', icon: '💪', muscle: 'Tay trước', sets: 3, reps: '10–12', kcal: 5, tip: 'Cáp, cuộn tay, không đánh lừa vai', img: 'Standing_Biceps_Cable_Curl' },
        { name: 'Dips - Triceps Version', icon: '🤸', muscle: 'Tay sau, ngực', sets: 3, reps: '8–12', kcal: 8, tip: 'Chống khuỷu trên xà kép, hạ người xuống', img: 'Dips_-_Triceps_Version' },
      ]},
      { name: 'Bụng + Bắp chân (tuỳ chọn)', exs: [
        { name: 'Abdominal Crunch Machine', sets: 3, reps: '12–15', kcal: 4 },
        { name: 'Leg Raise', sets: 3, reps: '10–15', kcal: 4 },
        { name: 'Standing Calf Raises', icon: '🦶', muscle: 'Bắp chân', sets: 4, reps: '12–15', kcal: 4, tip: 'Máy/mặt bậc, kiễng gót hết biên độ', img: 'Standing_Calf_Raises' },
        { name: 'Seated Calf Raise', icon: '🦶', muscle: 'Bắp chân (gối gập)', sets: 3, reps: '12–15', kcal: 4, tip: 'Máy ngồi, kiễng gót, siết đỉnh', img: 'Seated_Calf_Raise' },
      ]}
    ]
  }
};

// Tên các giáo án (cho dropdown chọn)
const SPLIT_NAMES = ['Push/Pull/Legs (PPL)', 'Full Body', 'Upper/Lower', 'Bro Split'];

// Helper: lấy danh sách ảnh cho 1 bài (0 = bắt đầu, 1 = kết thúc)
// Nếu bài có `alt` (ví dụ Bench Press: tạ đòn hoặc máy) thì trả về 2 bộ ảnh
function getExImgs(ex) {
  const base = (folder, idx) => `img/${folder}_${idx}.jpg`;
  const one = f => f ? [base(f,0), base(f,1)] : [];
  const main = one(ex.img);
  // guess label from folder name
  function guessLabel(f) {
    const l = f.toLowerCase();
    if (l.includes('dumbbell')) return 'Tạ đơn';
    if (l.includes('barbell') || l.includes('_bar')) return 'Tạ đòn';
    if (l.includes('cable') || l.includes('triceps')) return 'Cáp';
    if (l.includes('machine') || l.includes('smith') || l.includes('leverage')) return 'Máy';
    if (l.includes('side') || l.includes('seated') || l.includes('split')) return 'Tạ đơn';
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

// Helper: tìm bài gốc theo tên (PPL trước, rồi bài định nghĩa đầy đủ trong EXTRA_SPLITS)
const _pplByName = {};
Object.values(ROUTINE).forEach(g=>g.exs.forEach(e=>{ _pplByName[e.name]=e; }));
Object.values(EXTRA_SPLITS).forEach(s=>s.days.forEach(d=>d.exs.forEach(e=>{
  if(e.img) _pplByName[e.name]=e; // bài định nghĩa đầy đủ (có ảnh) ghi đè
})));

// Helper: lấy bài tập đầy đủ (có ảnh) cho 1 buổi của giáo án thêm
function getSplitDay(splitKey, dayIdx){
  const day = EXTRA_SPLITS[splitKey].days[dayIdx];
  return day.exs.map(e => Object.assign({}, _pplByName[e.name] || {}, e));
}
