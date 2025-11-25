// Placeholder mockData. Replace with your actual front-end data/mockData.ts if available.
export const users = [
  { name: "Admin", email: "admin@example.com", phone: "+1-555-1000", password: "password123", type: "Admin", groups: ["Central Campus"] },
  { name: "Alice Teacher", email: "alice.teacher@example.com", phone: "+1-555-2000", password: "password123", type: "Teacher", groups: ["Central Campus"] },
  { name: "Bob Student", email: "bob.student@example.com", phone: "+1-555-3000", password: "password123", type: "Student", groups: ["Central Campus"] }
];

export const groups = [
  { name: "Central Campus", color: "#2563eb" },
  { name: "North Campus", color: "#f97316" }
];

export const chapters = [
  { title: "Algebra I", description: "Basics of Algebra", status: "pending", orderIndex: 0 },
  { title: "Geometry", description: "Triangles & Circles", status: "in_progress", orderIndex: 1 }
];

export const reports = [
  { studentId: "", teacherId: "", date: "2025-10-01", type: "text", content: "Doing great!" }
];

export const homework = [
  { studentId: "", chapter: "Algebra I", content: "x+2=5 => x=3", submissionDate: "2025-10-02" }
];

