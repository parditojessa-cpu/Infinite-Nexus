import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthBootstrap } from "./AuthBootstrap";
import { RequireAuth } from "./RequireAuth";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { TeacherSignupPage } from "../features/auth/TeacherSignupPage";
import { SetPasswordPage } from "../features/auth/SetPasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { CoursesPage } from "../features/courses/CoursesPage";
import { CourseDetailPage } from "../features/courses/CourseDetailPage";
import { LessonPage } from "../features/lessons/LessonPage";
import { ManageContentPage } from "../features/manageContent/ManageContentPage";
import { AssignmentsPage } from "../features/assignments/AssignmentsPage";
import { QuizPage } from "../features/quizzes/QuizPage";
import { QuizReviewPage } from "../features/quizzes/QuizReviewPage";
import { GradebookPage } from "../features/gradebook/GradebookPage";
import { GamificationPage } from "../features/gamification/GamificationPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { AttendancePage } from "../features/attendance/AttendancePage";
import { InterventionsPage } from "../features/interventions/InterventionsPage";
import { CertificatesPage } from "../features/certificates/CertificatesPage";
import { AnnouncementsPage } from "../features/announcements/AnnouncementsPage";
import { DiscussionBoardPage } from "../features/discussions/DiscussionBoardPage";
import { MessagesPage } from "../features/messages/MessagesPage";
import { WhiteboardPage } from "../features/whiteboard/WhiteboardPage";

function studentRoutes() {
  return [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },
    { path: "profile", element: <ProfilePage /> },
    { path: "courses", element: <CoursesPage /> },
    { path: "courses/:courseId", element: <CourseDetailPage /> },
    { path: "courses/:courseId/lessons/:lessonId", element: <LessonPage /> },
    { path: "assignments", element: <AssignmentsPage /> },
    { path: "quizzes/:quizId", element: <QuizPage /> },
    { path: "quizzes/attempts/:attemptId/review", element: <QuizReviewPage /> },
    { path: "gradebook", element: <GradebookPage /> },
    { path: "whiteboard", element: <WhiteboardPage /> },
    { path: "whiteboard/:sessionId", element: <WhiteboardPage /> },
    { path: "progress", element: <GamificationPage /> },
    { path: "analytics", element: <AnalyticsPage /> },
    { path: "attendance", element: <AttendancePage /> },
    { path: "certificates", element: <CertificatesPage /> },
    { path: "announcements", element: <AnnouncementsPage /> },
    { path: "discussion", element: <DiscussionBoardPage /> },
    { path: "messages", element: <MessagesPage /> },
  ];
}

function teacherRoutes() {
  return [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },
    { path: "classes", element: <CoursesPage /> },
    { path: "classes/:courseId/manage", element: <ManageContentPage /> },
    { path: "assignments", element: <AssignmentsPage /> },
    { path: "gradebook", element: <GradebookPage /> },
    { path: "attendance", element: <AttendancePage /> },
    { path: "interventions", element: <InterventionsPage /> },
    { path: "announcements", element: <AnnouncementsPage /> },
    { path: "discussion", element: <DiscussionBoardPage /> },
    { path: "messages", element: <MessagesPage /> },
  ];
}

export const router = createBrowserRouter([
  {
    element: <AuthBootstrap />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/teacher-signup", element: <TeacherSignupPage /> },
      { path: "/", element: <Navigate to="/login" replace /> },
      {
        element: <RequireAuth />,
        children: [{ path: "/set-password", element: <SetPasswordPage /> }],
      },
      {
        element: <RequireAuth role="student" />,
        children: [{ path: "/student", element: <AppShell />, children: studentRoutes() }],
      },
      {
        element: <RequireAuth role="teacher" />,
        children: [{ path: "/teacher", element: <AppShell />, children: teacherRoutes() }],
      },
    ],
  },
]);
