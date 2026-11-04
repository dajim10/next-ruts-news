/**
 * Sustainable Development Goals (SDGs)
 *
 * API ส่งเป้าหมาย SDG มาปนอยู่ใน field `slug` เป็น token ตัวเลขเปล่า ๆ เช่น
 *   "%e0%b8%aa...-11,4,9,apps,goal,tv-th,public-relations-th"
 *                     ^ ^
 *                 SDG 4, SDG 9
 *
 * ระวัง: token ตัวเลขใน slug ไม่ได้เป็น SDG ทั้งหมด ในคลังข่าวมี slug ของโพสต์
 * ที่เป็นตัวเลขล้วนปนอยู่ด้วย เช่น 16092569 (วันที่ไทย) หรือ 118374 (WordPress post id)
 * แต่ค่าพวกนั้นเริ่มที่ 3397 ขึ้นไป ไม่คาบเกี่ยวกับช่วง 1-17 จึงกรองด้วยช่วงได้อย่างปลอดภัย
 *
 * และตำแหน่งของ token ใน slug ไม่แน่นอน — บางข่าว element แรกเป็น slug ของโพสต์
 * บางข่าวเป็น taxonomy เลย จึงต้องสแกนทุก token ห้าม skip ตัวแรก
 */

/** ตรงกับ 1-17 เท่านั้น ปฏิเสธ "016", "170", "3397" และค่าที่มีศูนย์นำหน้า */
const SDG_SLUG_PATTERN = /^([1-9]|1[0-7])$/;

export const SDG_COUNT = 17;

/** สีประจำเป้าหมายตามคู่มือ UN */
export const SDG_COLORS: Record<number, string> = {
  1: '#E5243B',
  2: '#DDA63A',
  3: '#4C9F38',
  4: '#C5192D',
  5: '#FF3A21',
  6: '#26BDE2',
  7: '#FCC30B',
  8: '#A21942',
  9: '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
};

/** ชื่อเป้าหมายภาษาไทย ใช้เป็น tooltip และ aria-label */
export const SDG_NAMES_TH: Record<number, string> = {
  1: 'ขจัดความยากจน',
  2: 'ขจัดความหิวโหย',
  3: 'สุขภาพและความเป็นอยู่ที่ดี',
  4: 'การศึกษาที่มีคุณภาพ',
  5: 'ความเท่าเทียมทางเพศ',
  6: 'น้ำสะอาดและสุขาภิบาล',
  7: 'พลังงานสะอาดที่เข้าถึงได้',
  8: 'งานที่มีคุณค่าและการเติบโตทางเศรษฐกิจ',
  9: 'อุตสาหกรรม นวัตกรรม และโครงสร้างพื้นฐาน',
  10: 'ลดความเหลื่อมล้ำ',
  11: 'เมืองและชุมชนที่ยั่งยืน',
  12: 'การผลิตและการบริโภคที่ยั่งยืน',
  13: 'การรับมือการเปลี่ยนแปลงสภาพภูมิอากาศ',
  14: 'การใช้ประโยชน์จากทรัพยากรทางทะเล',
  15: 'การใช้ประโยชน์จากระบบนิเวศทางบก',
  16: 'สังคมสงบสุข ยุติธรรม และสถาบันที่เข้มแข็ง',
  17: 'ความร่วมมือเพื่อการพัฒนาที่ยั่งยืน',
};

/**
 * ดึงหมายเลข SDG ออกจาก field slug ของข่าว
 * คืนค่าเรียงจากน้อยไปมากและไม่ซ้ำ ถ้าไม่มีจะได้ array ว่าง
 */
export function extractSdgs(slug: string | null | undefined): number[] {
  if (!slug) return [];

  const goals = new Set<number>();
  for (const token of slug.split(',')) {
    const trimmed = token.trim();
    if (SDG_SLUG_PATTERN.test(trimmed)) {
      goals.add(Number(trimmed));
    }
  }

  return Array.from(goals).sort((a, b) => a - b);
}

/** ชื่อเต็มสำหรับแสดงผล เช่น "SDG 4: การศึกษาที่มีคุณภาพ" */
export function sdgLabel(goal: number): string {
  const name = SDG_NAMES_TH[goal];
  return name ? `SDG ${goal}: ${name}` : `SDG ${goal}`;
}
