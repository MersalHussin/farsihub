import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface AppUser extends FirebaseUser {
  name: string;
  role: 'student' | 'admin';
  approved: boolean;
  createdAt: Timestamp;
  year?: LectureYear;
}

export type LectureYear = "first" | "second" | "third" | "fourth";
export type Semester = "first" | "second";

export type Question = {
  text: string;
  options: string[];
  correctAnswer: string;
};

export type Quiz = {
    title: string;
    questions: Question[];
};

export type Subject = {
  id: string;
  name: string;
  year: LectureYear;
  semester: Semester;
  createdAt: Timestamp;
}

export type Lecture = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  subjectId: string;
  subjectName: string; // For easy display
  year: LectureYear;
  semester: Semester;
  createdAt: Timestamp;
  quiz?: Quiz;
  youtubeVideoUrl?: string;
};

export type Student = {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    approved: boolean;
    createdAt: Date;
    year?: LectureYear;
}

export interface QuizSubmission {
    id: string;
    quizId: string;
    quizTitle: string;
    lectureId: string;
    subjectId: string;
    userId: string;
    userName: string;
    score: number;
    answers: Record<number, string>;
    submittedAt: Timestamp;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    date: Date;
    type: 'quiz' | 'lecture';
    icon: React.ReactNode;
}
