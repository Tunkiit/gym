// ====== BỘ TẬP CỦA BẠN ======
// Mỗi bài tập gồm: tên, icon, nhóm cơ, sets, reps, mẹo, và folder ảnh
const ROUTINE = {
  Push: {
    color: 'var(--push)',
    emoji: '🔴',
    name: 'PUSH — Ngực / Vai / Tay sau',
    sets: 20,
    exs: [
      { name: 'Bench Press',              icon: '🏋️', muscle: 'Ngực giữa',        sets: 4, reps: '8–10',  tip: 'Tạ đòn, khuỷu tay 45°, hít sâu xuống',                     img: 'Barbell_Bench_Press_-_Medium_Grip', alt: 'Machine_Bench_Press' },
      { name: 'Incline Dumbbell Press',    icon: '🏋️', muscle: 'Ngực trên',        sets: 4, reps: '8–10',  tip: 'Ghế dốc 30°, tạ đơn, hít sâu xuống',                     img: 'Incline_Dumbbell_Press', alt: 'Leverage_Incline_Chest_Press' },
      { name: 'Chest Fly',                   icon: '🦅',  muscle: 'Ngực sâu',        sets: 3, reps: '12–15', tip: 'Máy fly, ép ngực vào trong, khuỷu hơi cong',                img: 'Butterfly' },
      { name: 'Lateral Raise',             icon: '🔺',  muscle: 'Vai giữa',        sets: 3, reps: '12–15', tip: 'Tạ nhẹ, khuỷu hơi cong, lên đến vai',                     img: 'Side_Lateral_Raise' },
      { name: 'Shoulder Press',            icon: '⬆️',  muscle: 'Vai trước',       sets: 3, reps: '8–10',  tip: 'Đẩy tạ đơn/đòn qua đầu, siết cơ vai',                      img: 'Seated_Dumbbell_Press', alt: 'Machine_Shoulder_Military_Press' },
      { name: 'Tricep Pushdown',           icon: '💪',  muscle: 'Tay sau',         sets: 3, reps: '10–15', tip: 'Cáp, khuỷu cố định, xuống hết biên độ',                    img: 'Triceps_Pushdown', alt: 'Machine_Triceps_Extension' },
    ]
  },
  Pull: {
    color: 'var(--pull)',
    emoji: '🔵',
    name: 'PULL — Lưng / Tay trước',
    sets: 20,
    exs: [
      { name: 'Lat Pulldown',              icon: '🔽',  muscle: 'Xô rộng',         sets: 4, reps: '8–10',  tip: 'Cầm rộng, kéo xuống ngực, siết xô',                       img: 'Close-Grip_Front_Lat_Pulldown' },
      { name: 'Seated Cable Row',          icon: '➡️',  muscle: 'Lưng giữa',       sets: 4, reps: '8–10',  tip: 'Kéo cáp về bụng, hít vai về sau',                          img: 'Seated_Cable_Rows' },
      { name: 'One-Arm Cable Lat Pulldown',icon: '↘️',  muscle: 'Xô sâu',          sets: 3, reps: '10–12', tip: 'Từng tay, kéo chéo xuống, siết lưng dưới',                 img: 'One_Arm_Lat_Pulldown' },
      { name: 'Straight-Arm Pulldown',     icon: '⬇️',  muscle: 'Lưng dưới',       sets: 3, reps: '12–15', tip: 'Tay thẳng, cáp từ trên, đẩy xuống đùi',                    img: 'Straight-Arm_Pulldown' },
      { name: 'Preacher Curl',             icon: '💪',  muscle: 'Tay trước (dài)',  sets: 3, reps: '10–12', tip: 'Ghế preacher, khuỷu cố định, cuộn lên',                    img: 'Preacher_Curl', alt: 'Machine_Preacher_Curls' },
      { name: 'Hammer Curl',               icon: '🔨',  muscle: 'Tay trước (cánh)', sets: 3, reps: '10–12', tip: 'Tạ đơn, lòng bàn tay hướng vào, cuộn lên',                  img: 'Alternate_Hammer_Curl', alt: 'Machine_Bicep_Curl' },
    ]
  },
  Legs: {
    color: 'var(--legs)',
    emoji: '🟢',
    name: 'LEGS + ABS — Chân / Bụng',
    sets: 25,
    exs: [
      { name: 'Squat',                    icon: '🦵',  muscle: 'Đùi trước',        sets: 4, reps: '8–10',  tip: 'Tạ đòn sau cổ, hông xuống gối, lưng thẳng',                img: 'Barbell_Full_Squat', alt: 'Smith_Machine_Squat' },
      { name: 'Leg Press',                icon: '🦿',  muscle: 'Đùi trước',        sets: 3, reps: '10–12', tip: 'Máy, đẩy bằng gót, không khoá gối',                        img: 'Leg_Press' },
      { name: 'Bulgarian Split Squat',    icon: '🦵',  muscle: 'Đùi sau',          sets: 3, reps: '8–12',  tip: 'Một chân sau ghế, squats 1 chân, tạ tay',                   img: 'Split_Squat_with_Dumbbells', alt: 'Smith_Single-Leg_Split_Squat' },
      { name: 'Leg Extension',            icon: '⬆️',  muscle: 'Đùi trước cô lập', sets: 3, reps: '12–15', tip: 'Máy, duỗi thẳng chân, siết đỉnh',                            img: 'Leg_Extensions' },
      { name: 'Leg Curl',                 icon: '⬇️',  muscle: 'Đùi sau',          sets: 3, reps: '10–15', tip: 'Máy, cuộn chân về mông, siết đùi sau',                     img: 'Ball_Leg_Curl' },
      { name: 'Abductor',                 icon: '🦵',  muscle: 'Đùi ngoài',        sets: 3, reps: '12–15', tip: 'Máy, đẩy hai chân ra ngoài',                                 img: 'Thigh_Abductor' },
      { name: 'Abdominal Crunch Machine',  icon: '🧠',  muscle: 'Bụng trên',        sets: 3, reps: '12–15', tip: 'Máy crunch, gập bụng, thở ra khi gập',                       img: 'Ab_Crunch_Machine' },
      { name: 'Leg Raise',                icon: '⬆️',  muscle: 'Bụng dưới',        sets: 3, reps: '10–15', tip: 'Nằm ngửa, nâng chân thẳng, lưng dưới sát đất',              img: 'Flat_Bench_Lying_Leg_Raise' },
    ]
  }
};

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