/**
 * User information from elogin API
 */

export interface UserInfo {
  // เพิ่ม fields ตาม response จาก API จริง
  // ตัวอย่าง fields ที่อาจมี:
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  faculty?: string;
  department?: string;
  studentId?: string;
  employeeId?: string;
  [key: string]: any; // สำหรับ fields อื่นๆ ที่อาจมี
}

export interface TokenValidationResponse {
  success: boolean;
  user?: UserInfo;
  error?: string;
  message?: string;
}
