export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", path: "/student/dashboard", icon: "🏠" },
  { label: "My Profile", path: "/student/profile", icon: "👤" },
  { label: "My Courses", path: "/student/courses", icon: "📚" },
  { label: "Assignments", path: "/student/assignments", icon: "📝" },
  { label: "Gradebook", path: "/student/gradebook", icon: "📊" },
  { label: "AI Whiteboard", path: "/student/whiteboard", icon: "🧠" },
  { label: "My Progress", path: "/student/progress", icon: "🏆" },
  { label: "Progress Dashboard", path: "/student/analytics", icon: "📈" },
  { label: "Attendance", path: "/student/attendance", icon: "🗓️" },
  { label: "Certificates", path: "/student/certificates", icon: "🎓" },
  { label: "Announcements", path: "/student/announcements", icon: "📢" },
  { label: "Discussion Board", path: "/student/discussion", icon: "💬" },
  { label: "Messages", path: "/student/messages", icon: "✉️" },
];

export const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", path: "/teacher/dashboard", icon: "🏠" },
  { label: "My Classes", path: "/teacher/classes", icon: "📚" },
  { label: "Assignments", path: "/teacher/assignments", icon: "📝" },
  { label: "Gradebook", path: "/teacher/gradebook", icon: "📊" },
  { label: "Attendance", path: "/teacher/attendance", icon: "🗓️" },
  { label: "Interventions", path: "/teacher/interventions", icon: "🧭" },
  { label: "Announcements", path: "/teacher/announcements", icon: "📢" },
  { label: "Discussion Board", path: "/teacher/discussion", icon: "💬" },
  { label: "Messages", path: "/teacher/messages", icon: "✉️" },
];

export const MOBILE_TAB_COUNT = 5;
