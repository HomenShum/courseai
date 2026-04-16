import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const hasUsers = Boolean(await ctx.db.query("users").first());
    const hasPrograms = Boolean(await ctx.db.query("programs").first());
    const hasCourses = Boolean(await ctx.db.query("courses").first());
    const hasEnrollment = Boolean(await ctx.db.query("enrollment").first());
    const hasFaculty = Boolean(await ctx.db.query("faculty").first());
    const hasPolicies = Boolean(await ctx.db.query("curricularPolicies").first());
    const hasReviews = Boolean(await ctx.db.query("reviews").first());
    const hasActionItems = Boolean(await ctx.db.query("actionItems").first());

    // === USERS ===
    const users = [
      {
        operatorId: "OP-PROF-CS",
        name: "Dr. Sarah Mitchell",
        email: "sarah.mitchell@university.edu",
        role: "professor",
        programIds: ["PRG-CS-BS"],
        campusIds: ["Main Campus"],
      },
      {
        operatorId: "OP-PROF-DS",
        name: "Dr. David Chen",
        email: "david.chen@university.edu",
        role: "professor",
        programIds: ["PRG-DS-MS"],
        campusIds: ["Main Campus"],
      },
      {
        operatorId: "OP-CHAIR",
        name: "Dr. Lisa Ramirez",
        email: "lisa.ramirez@university.edu",
        role: "department_chair",
        programIds: [],
        campusIds: ["Main Campus", "Satellite Campus", "ALL"],
      },
      {
        operatorId: "OP-ADVISOR",
        name: "Jordan Hayes",
        email: "jordan.hayes@university.edu",
        role: "academic_advisor",
        programIds: ["PRG-CS-BS", "PRG-DS-MS", "PRG-AI-CERT", "PRG-SE-BS", "PRG-CS-SAT", "PRG-SE-SAT"],
        campusIds: ["Main Campus", "Satellite Campus", "ALL"],
      },
    ];
    if (!hasUsers) {
      for (const user of users) await ctx.db.insert("users", user);
    }

    // === PROGRAMS ===
    const programs = [
      { programId: "PRG-CS-BS", name: "Computer Science BS", department: "Computer Science", degreeType: "BS", accreditationStatus: "accredited", totalCredits: 120, campus: "Main Campus", chairId: "OP-CHAIR" },
      { programId: "PRG-DS-MS", name: "Data Science MS", department: "Computer Science", degreeType: "MS", accreditationStatus: "accredited", totalCredits: 36, campus: "Main Campus", chairId: "OP-CHAIR" },
      { programId: "PRG-AI-CERT", name: "AI Certificate", department: "Computer Science", degreeType: "certificate", accreditationStatus: "provisional", totalCredits: 18, campus: "Main Campus", chairId: "OP-CHAIR" },
      { programId: "PRG-SE-BS", name: "Software Engineering BS", department: "Computer Science", degreeType: "BS", accreditationStatus: "accredited", totalCredits: 124, campus: "Main Campus", chairId: "OP-CHAIR" },
      { programId: "PRG-CS-SAT", name: "Computer Science BS (Satellite)", department: "Computer Science", degreeType: "BS", accreditationStatus: "under_review", totalCredits: 120, campus: "Satellite Campus", chairId: "OP-CHAIR" },
      { programId: "PRG-SE-SAT", name: "Software Engineering BS (Satellite)", department: "Computer Science", degreeType: "BS", accreditationStatus: "accredited", totalCredits: 124, campus: "Satellite Campus", chairId: "OP-CHAIR" },
    ];
    if (!hasPrograms) {
      for (const program of programs) await ctx.db.insert("programs", program);
    }

    // === COURSES ===
    const courses = [
      { courseId: "CRS-001", programId: "PRG-CS-BS", courseCode: "CS101", title: "Introduction to Computer Science", credits: 3, description: "Foundational course covering computational thinking, algorithms, and Python programming basics.", type: "core", status: "active", prerequisites: [], semester: "Fall 2026", enrollmentCap: 120, learningOutcomes: ["Understand algorithmic thinking", "Write basic Python programs", "Analyze problem complexity"], instructorName: "Dr. Sarah Mitchell" },
      { courseId: "CRS-002", programId: "PRG-CS-BS", courseCode: "CS201", title: "Data Structures and Algorithms", credits: 4, description: "In-depth study of data structures including trees, graphs, hash tables, and algorithm design paradigms.", type: "core", status: "active", prerequisites: ["CS101"], semester: "Spring 2026", enrollmentCap: 80, learningOutcomes: ["Implement core data structures", "Analyze time and space complexity", "Apply dynamic programming"], instructorName: "Dr. Sarah Mitchell" },
      { courseId: "CRS-003", programId: "PRG-CS-BS", courseCode: "CS301", title: "Operating Systems", credits: 3, description: "Process management, memory management, file systems, and concurrent programming.", type: "core", status: "active", prerequisites: ["CS201"], semester: "Fall 2026", enrollmentCap: 60, learningOutcomes: ["Understand process scheduling", "Implement synchronization primitives", "Design memory management schemes"], instructorName: "Dr. Robert Kim" },
      { courseId: "CRS-004", programId: "PRG-CS-BS", courseCode: "CS310", title: "Database Systems", credits: 3, description: "Relational databases, SQL, normalization, transaction processing, and NoSQL alternatives.", type: "core", status: "active", prerequisites: ["CS201"], semester: "Spring 2026", enrollmentCap: 70, learningOutcomes: ["Design normalized schemas", "Write complex SQL queries", "Evaluate NoSQL tradeoffs"], instructorName: "Dr. Emily Wang" },
      { courseId: "CRS-005", programId: "PRG-CS-BS", courseCode: "CS350", title: "Software Engineering", credits: 3, description: "Software development lifecycle, agile methodologies, testing strategies, and team collaboration.", type: "core", status: "active", prerequisites: ["CS201"], semester: "Fall 2026", enrollmentCap: 60, learningOutcomes: ["Apply agile development practices", "Write comprehensive test suites", "Conduct code reviews"], instructorName: "Dr. James Park" },
      { courseId: "CRS-006", programId: "PRG-CS-BS", courseCode: "CS401", title: "Machine Learning Fundamentals", credits: 3, description: "Supervised and unsupervised learning, neural networks, model evaluation, and ethical AI.", type: "elective", status: "active", prerequisites: ["CS201", "MATH301"], semester: "Fall 2026", enrollmentCap: 45, learningOutcomes: ["Train and evaluate ML models", "Apply regularization techniques", "Assess model fairness"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-007", programId: "PRG-CS-BS", courseCode: "CS410", title: "Computer Networks", credits: 3, description: "Network protocols, TCP/IP stack, routing algorithms, and network security fundamentals.", type: "elective", status: "active", prerequisites: ["CS301"], semester: "Spring 2026", enrollmentCap: 50, learningOutcomes: ["Analyze protocol behavior", "Design network architectures", "Implement socket programming"], instructorName: "Dr. Robert Kim" },
      { courseId: "CRS-008", programId: "PRG-CS-BS", courseCode: "CS490", title: "Senior Capstone Project", credits: 4, description: "Team-based capstone integrating knowledge from core courses into a substantial software project.", type: "capstone", status: "active", prerequisites: ["CS350", "CS310"], semester: "Spring 2026", enrollmentCap: 30, learningOutcomes: ["Deliver production-quality software", "Present technical work professionally", "Manage project scope and timeline"], instructorName: "Dr. Sarah Mitchell" },
      { courseId: "CRS-009", programId: "PRG-CS-BS", courseCode: "CS210", title: "Computer Architecture", credits: 3, description: "Digital logic, processor design, memory hierarchy, and instruction set architectures.", type: "core", status: "active", prerequisites: ["CS101"], semester: "Fall 2026", enrollmentCap: 65, learningOutcomes: ["Design basic processor pipelines", "Analyze cache performance", "Understand ISA tradeoffs"], instructorName: "Dr. Angela Torres" },
      { courseId: "CRS-010", programId: "PRG-CS-BS", courseCode: "CS420", title: "Cybersecurity", credits: 3, description: "Threat modeling, cryptography, secure software development, and incident response.", type: "elective", status: "under_review", prerequisites: ["CS301", "CS410"], semester: "Fall 2026", enrollmentCap: 40, learningOutcomes: ["Perform threat analysis", "Apply cryptographic primitives", "Design secure systems"], instructorName: "Dr. Robert Kim" },
      { courseId: "CRS-011", programId: "PRG-DS-MS", courseCode: "DS501", title: "Statistical Learning", credits: 3, description: "Advanced regression, classification, dimensionality reduction, and Bayesian methods for data science.", type: "core", status: "active", prerequisites: [], semester: "Fall 2026", enrollmentCap: 35, learningOutcomes: ["Apply advanced regression models", "Implement Bayesian inference", "Evaluate model selection criteria"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-012", programId: "PRG-DS-MS", courseCode: "DS510", title: "Big Data Systems", credits: 3, description: "Distributed computing frameworks, data pipelines, and scalable storage architectures.", type: "core", status: "active", prerequisites: [], semester: "Spring 2026", enrollmentCap: 30, learningOutcomes: ["Design MapReduce pipelines", "Optimize Spark workloads", "Evaluate storage tradeoffs"], instructorName: "Dr. Emily Wang" },
      { courseId: "CRS-013", programId: "PRG-DS-MS", courseCode: "DS520", title: "Natural Language Processing", credits: 3, description: "Text processing, language models, transformers, and applications in information extraction.", type: "elective", status: "active", prerequisites: ["DS501"], semester: "Fall 2026", enrollmentCap: 25, learningOutcomes: ["Fine-tune language models", "Build text classification pipelines", "Evaluate NLP metrics"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-014", programId: "PRG-DS-MS", courseCode: "DS530", title: "Data Visualization and Communication", credits: 3, description: "Principles of effective data visualization, storytelling with data, and interactive dashboards.", type: "elective", status: "active", prerequisites: [], semester: "Spring 2026", enrollmentCap: 30, learningOutcomes: ["Create effective visualizations", "Design interactive dashboards", "Present data-driven insights"], instructorName: "Dr. Maria Santos" },
      { courseId: "CRS-015", programId: "PRG-DS-MS", courseCode: "DS590", title: "Data Science Capstone", credits: 4, description: "Applied research project solving a real-world data science problem with industry partnership.", type: "capstone", status: "active", prerequisites: ["DS501", "DS510"], semester: "Spring 2026", enrollmentCap: 20, learningOutcomes: ["Deliver end-to-end data project", "Communicate results to stakeholders", "Handle messy real-world data"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-016", programId: "PRG-AI-CERT", courseCode: "AI450", title: "Applied Deep Learning", credits: 3, description: "Convolutional and recurrent networks, transfer learning, and deployment of deep learning models.", type: "core", status: "active", prerequisites: [], semester: "Fall 2026", enrollmentCap: 30, learningOutcomes: ["Train deep neural networks", "Apply transfer learning", "Deploy models to production"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-017", programId: "PRG-AI-CERT", courseCode: "AI460", title: "AI Ethics and Governance", credits: 3, description: "Fairness, accountability, transparency in AI systems, and regulatory frameworks.", type: "core", status: "active", prerequisites: [], semester: "Spring 2026", enrollmentCap: 35, learningOutcomes: ["Assess algorithmic bias", "Apply fairness metrics", "Navigate AI regulations"], instructorName: "Dr. Lisa Ramirez" },
      { courseId: "CRS-018", programId: "PRG-AI-CERT", courseCode: "AI470", title: "Reinforcement Learning", credits: 3, description: "Markov decision processes, Q-learning, policy gradient methods, and multi-agent systems.", type: "elective", status: "proposed", prerequisites: ["AI450"], semester: "Fall 2026", enrollmentCap: 25, learningOutcomes: ["Implement Q-learning agents", "Apply policy gradient methods", "Design reward functions"], instructorName: "Dr. David Chen" },
      { courseId: "CRS-019", programId: "PRG-SE-BS", courseCode: "SE200", title: "Object-Oriented Design", credits: 3, description: "Design patterns, SOLID principles, UML modeling, and refactoring techniques.", type: "core", status: "active", prerequisites: ["CS101"], semester: "Spring 2026", enrollmentCap: 55, learningOutcomes: ["Apply design patterns", "Model systems with UML", "Refactor legacy code"], instructorName: "Dr. James Park" },
      { courseId: "CRS-020", programId: "PRG-SE-BS", courseCode: "SE340", title: "DevOps and Cloud Computing", credits: 3, description: "CI/CD pipelines, containerization, infrastructure as code, and cloud platform services.", type: "elective", status: "active", prerequisites: ["CS350"], semester: "Fall 2026", enrollmentCap: 40, learningOutcomes: ["Build CI/CD pipelines", "Deploy containerized applications", "Manage cloud infrastructure"], instructorName: "Dr. James Park" },
      { courseId: "CRS-021", programId: "PRG-SE-BS", courseCode: "SE400", title: "Software Architecture", credits: 3, description: "Architectural styles, microservices, event-driven design, and quality attribute tradeoffs.", type: "core", status: "under_review", prerequisites: ["SE200", "CS350"], semester: "Fall 2026", enrollmentCap: 35, learningOutcomes: ["Evaluate architectural styles", "Design microservice systems", "Analyze quality attribute tradeoffs"], instructorName: "Dr. Angela Torres" },
      { courseId: "CRS-022", programId: "PRG-CS-SAT", courseCode: "CS101S", title: "Introduction to Computer Science (Satellite)", credits: 3, description: "Same curriculum as CS101 delivered at the satellite campus with evening sections.", type: "core", status: "active", prerequisites: [], semester: "Fall 2026", enrollmentCap: 60, learningOutcomes: ["Understand algorithmic thinking", "Write basic Python programs", "Analyze problem complexity"], instructorName: "Dr. Michael Torres" },
      { courseId: "CRS-023", programId: "PRG-CS-SAT", courseCode: "CS201S", title: "Data Structures (Satellite)", credits: 4, description: "Data structures and algorithms for the satellite campus program.", type: "core", status: "active", prerequisites: ["CS101S"], semester: "Spring 2026", enrollmentCap: 40, learningOutcomes: ["Implement core data structures", "Analyze time and space complexity", "Apply dynamic programming"], instructorName: "Dr. Michael Torres" },
      { courseId: "CRS-024", programId: "PRG-SE-SAT", courseCode: "SE200S", title: "Object-Oriented Design (Satellite)", credits: 3, description: "Design patterns and OO principles for satellite campus SE students.", type: "core", status: "active", prerequisites: ["CS101S"], semester: "Fall 2026", enrollmentCap: 35, learningOutcomes: ["Apply design patterns", "Model systems with UML", "Refactor legacy code"], instructorName: "Dr. Ana Lopez" },
      { courseId: "CRS-025", programId: "PRG-CS-BS", courseCode: "CS430", title: "Cloud-Native Application Development", credits: 3, description: "Serverless computing, edge functions, and modern web application architectures.", type: "elective", status: "proposed", prerequisites: ["CS350"], semester: "Spring 2026", enrollmentCap: 35, learningOutcomes: ["Build serverless applications", "Design event-driven architectures", "Optimize for edge deployment"], instructorName: "Dr. James Park" },
    ];
    if (!hasCourses) {
      for (const course of courses) await ctx.db.insert("courses", course);
    }

    // === ENROLLMENT ===
    const enrollmentRecords = [
      // Fall 2025
      { courseId: "CRS-001", semester: "Fall 2025", enrolled: 115, capacity: 120, waitlist: 8, completionRate: 0.91, avgGrade: 3.2, dropRate: 0.06 },
      { courseId: "CRS-002", semester: "Fall 2025", enrolled: 72, capacity: 80, waitlist: 3, completionRate: 0.85, avgGrade: 2.9, dropRate: 0.10 },
      { courseId: "CRS-003", semester: "Fall 2025", enrolled: 55, capacity: 60, waitlist: 5, completionRate: 0.82, avgGrade: 2.8, dropRate: 0.12 },
      { courseId: "CRS-006", semester: "Fall 2025", enrolled: 42, capacity: 45, waitlist: 12, completionRate: 0.88, avgGrade: 3.4, dropRate: 0.07 },
      { courseId: "CRS-009", semester: "Fall 2025", enrolled: 58, capacity: 65, waitlist: 0, completionRate: 0.79, avgGrade: 2.7, dropRate: 0.14 },
      { courseId: "CRS-011", semester: "Fall 2025", enrolled: 32, capacity: 35, waitlist: 6, completionRate: 0.90, avgGrade: 3.5, dropRate: 0.05 },
      { courseId: "CRS-013", semester: "Fall 2025", enrolled: 22, capacity: 25, waitlist: 4, completionRate: 0.86, avgGrade: 3.3, dropRate: 0.09 },
      { courseId: "CRS-016", semester: "Fall 2025", enrolled: 28, capacity: 30, waitlist: 7, completionRate: 0.92, avgGrade: 3.6, dropRate: 0.04 },
      { courseId: "CRS-022", semester: "Fall 2025", enrolled: 45, capacity: 60, waitlist: 0, completionRate: 0.83, avgGrade: 3.0, dropRate: 0.11 },
      // Spring 2026
      { courseId: "CRS-002", semester: "Spring 2026", enrolled: 78, capacity: 80, waitlist: 5, completionRate: 0.87, avgGrade: 3.0, dropRate: 0.08 },
      { courseId: "CRS-004", semester: "Spring 2026", enrolled: 65, capacity: 70, waitlist: 2, completionRate: 0.89, avgGrade: 3.1, dropRate: 0.07 },
      { courseId: "CRS-007", semester: "Spring 2026", enrolled: 38, capacity: 50, waitlist: 0, completionRate: 0.84, avgGrade: 2.9, dropRate: 0.11 },
      { courseId: "CRS-008", semester: "Spring 2026", enrolled: 28, capacity: 30, waitlist: 3, completionRate: 0.93, avgGrade: 3.5, dropRate: 0.03 },
      { courseId: "CRS-012", semester: "Spring 2026", enrolled: 27, capacity: 30, waitlist: 2, completionRate: 0.90, avgGrade: 3.4, dropRate: 0.06 },
      { courseId: "CRS-014", semester: "Spring 2026", enrolled: 25, capacity: 30, waitlist: 0, completionRate: 0.92, avgGrade: 3.6, dropRate: 0.04 },
      { courseId: "CRS-015", semester: "Spring 2026", enrolled: 18, capacity: 20, waitlist: 4, completionRate: 0.95, avgGrade: 3.7, dropRate: 0.02 },
      { courseId: "CRS-017", semester: "Spring 2026", enrolled: 30, capacity: 35, waitlist: 0, completionRate: 0.94, avgGrade: 3.5, dropRate: 0.03 },
      { courseId: "CRS-019", semester: "Spring 2026", enrolled: 48, capacity: 55, waitlist: 0, completionRate: 0.88, avgGrade: 3.1, dropRate: 0.08 },
      { courseId: "CRS-023", semester: "Spring 2026", enrolled: 32, capacity: 40, waitlist: 0, completionRate: 0.81, avgGrade: 2.8, dropRate: 0.13 },
      // Fall 2026
      { courseId: "CRS-001", semester: "Fall 2026", enrolled: 118, capacity: 120, waitlist: 15, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-003", semester: "Fall 2026", enrolled: 58, capacity: 60, waitlist: 7, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-005", semester: "Fall 2026", enrolled: 52, capacity: 60, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-006", semester: "Fall 2026", enrolled: 44, capacity: 45, waitlist: 18, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-009", semester: "Fall 2026", enrolled: 60, capacity: 65, waitlist: 2, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-010", semester: "Fall 2026", enrolled: 22, capacity: 40, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-011", semester: "Fall 2026", enrolled: 34, capacity: 35, waitlist: 8, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-013", semester: "Fall 2026", enrolled: 24, capacity: 25, waitlist: 6, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-016", semester: "Fall 2026", enrolled: 29, capacity: 30, waitlist: 11, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-020", semester: "Fall 2026", enrolled: 38, capacity: 40, waitlist: 3, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-021", semester: "Fall 2026", enrolled: 15, capacity: 35, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-022", semester: "Fall 2026", enrolled: 50, capacity: 60, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-024", semester: "Fall 2026", enrolled: 28, capacity: 35, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      // Extra records for trends
      { courseId: "CRS-004", semester: "Fall 2025", enrolled: 60, capacity: 70, waitlist: 0, completionRate: 0.86, avgGrade: 3.0, dropRate: 0.09 },
      { courseId: "CRS-005", semester: "Fall 2025", enrolled: 50, capacity: 60, waitlist: 0, completionRate: 0.85, avgGrade: 3.0, dropRate: 0.10 },
      { courseId: "CRS-008", semester: "Fall 2025", enrolled: 25, capacity: 30, waitlist: 1, completionRate: 0.88, avgGrade: 3.3, dropRate: 0.08 },
      { courseId: "CRS-019", semester: "Fall 2025", enrolled: 50, capacity: 55, waitlist: 0, completionRate: 0.84, avgGrade: 3.0, dropRate: 0.10 },
      { courseId: "CRS-020", semester: "Spring 2026", enrolled: 35, capacity: 40, waitlist: 0, completionRate: 0.87, avgGrade: 3.2, dropRate: 0.08 },
      { courseId: "CRS-024", semester: "Spring 2026", enrolled: 30, capacity: 35, waitlist: 0, completionRate: 0.85, avgGrade: 3.0, dropRate: 0.10 },
      { courseId: "CRS-010", semester: "Fall 2025", enrolled: 35, capacity: 40, waitlist: 2, completionRate: 0.80, avgGrade: 3.1, dropRate: 0.12 },
      { courseId: "CRS-017", semester: "Fall 2025", enrolled: 28, capacity: 35, waitlist: 0, completionRate: 0.91, avgGrade: 3.4, dropRate: 0.05 },
      { courseId: "CRS-012", semester: "Fall 2025", enrolled: 25, capacity: 30, waitlist: 0, completionRate: 0.85, avgGrade: 3.2, dropRate: 0.10 },
      { courseId: "CRS-014", semester: "Fall 2025", enrolled: 22, capacity: 30, waitlist: 0, completionRate: 0.89, avgGrade: 3.4, dropRate: 0.06 },
      { courseId: "CRS-015", semester: "Fall 2025", enrolled: 16, capacity: 20, waitlist: 2, completionRate: 0.88, avgGrade: 3.5, dropRate: 0.06 },
      { courseId: "CRS-021", semester: "Spring 2026", enrolled: 30, capacity: 35, waitlist: 0, completionRate: 0.83, avgGrade: 3.0, dropRate: 0.10 },
      { courseId: "CRS-007", semester: "Fall 2025", enrolled: 40, capacity: 50, waitlist: 0, completionRate: 0.80, avgGrade: 2.8, dropRate: 0.14 },
      { courseId: "CRS-025", semester: "Spring 2026", enrolled: 12, capacity: 35, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-018", semester: "Fall 2026", enrolled: 10, capacity: 25, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-023", semester: "Fall 2026", enrolled: 35, capacity: 40, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
      { courseId: "CRS-025", semester: "Fall 2026", enrolled: 20, capacity: 35, waitlist: 0, completionRate: 0.0, avgGrade: 0.0, dropRate: 0.0 },
    ];
    if (!hasEnrollment) {
      for (const record of enrollmentRecords) await ctx.db.insert("enrollment", record);
    }

    // === FACULTY ===
    const facultyMembers = [
      { facultyId: "FAC-001", programId: "PRG-CS-BS", name: "Dr. Sarah Mitchell", expertise: ["algorithms", "theory of computation", "Python"], courseLoad: 3, maxLoad: 3, rank: "Associate Professor", status: "active" },
      { facultyId: "FAC-002", programId: "PRG-DS-MS", name: "Dr. David Chen", expertise: ["machine learning", "NLP", "deep learning", "statistics"], courseLoad: 4, maxLoad: 3, rank: "Professor", status: "active" },
      { facultyId: "FAC-003", programId: "PRG-CS-BS", name: "Dr. Robert Kim", expertise: ["operating systems", "networks", "cybersecurity"], courseLoad: 3, maxLoad: 3, rank: "Professor", status: "active" },
      { facultyId: "FAC-004", programId: "PRG-CS-BS", name: "Dr. Emily Wang", expertise: ["databases", "distributed systems", "data engineering"], courseLoad: 2, maxLoad: 3, rank: "Assistant Professor", status: "active" },
      { facultyId: "FAC-005", programId: "PRG-SE-BS", name: "Dr. James Park", expertise: ["software engineering", "DevOps", "agile methods"], courseLoad: 3, maxLoad: 3, rank: "Associate Professor", status: "active" },
      { facultyId: "FAC-006", programId: "PRG-CS-BS", name: "Dr. Angela Torres", expertise: ["computer architecture", "embedded systems", "hardware design"], courseLoad: 2, maxLoad: 3, rank: "Assistant Professor", status: "active" },
      { facultyId: "FAC-007", programId: "PRG-DS-MS", name: "Dr. Maria Santos", expertise: ["data visualization", "HCI", "UX research"], courseLoad: 1, maxLoad: 2, rank: "Adjunct", status: "active" },
      { facultyId: "FAC-008", programId: "PRG-CS-SAT", name: "Dr. Michael Torres", expertise: ["algorithms", "programming languages", "compilers"], courseLoad: 2, maxLoad: 2, rank: "Associate Professor", status: "active" },
    ];
    if (!hasFaculty) {
      for (const member of facultyMembers) await ctx.db.insert("faculty", member);
    }

    // === CURRICULAR POLICIES ===
    const policiesData = [
      { policyId: "POL-ABET-001", category: "accreditation", title: "ABET Computing Criteria — Student Outcomes", content: "All BS programs must demonstrate student attainment of (1) analyze a complex computing problem, (2) design, implement, and evaluate a computing-based solution, (3) communicate effectively, (4) recognize professional responsibilities, (5) function on teams, (6) apply CS theory and principles. Annual assessment required with direct and indirect measures.", accreditationBody: "ABET", effectiveDate: "2024-01-01" },
      { policyId: "POL-ABET-002", category: "accreditation", title: "ABET Continuous Improvement", content: "Programs must regularly evaluate and improve using documented assessment plans. (1) Collect outcome data each semester, (2) review results annually with advisory board, (3) implement changes within two semesters, (4) document closing-the-loop actions. Failure to demonstrate improvement may result in conditional accreditation.", accreditationBody: "ABET", effectiveDate: "2024-01-01" },
      { policyId: "POL-CREDIT-001", category: "credit_hours", title: "Credit Hour Policy", content: "One credit hour equals one 50-minute lecture or equivalent per week for 15 weeks. Lab courses: 2-3 hours of lab per credit hour. Online courses must document equivalent engagement time. Maximum credit load per semester: 18 for undergrad, 12 for grad without advisor approval.", accreditationBody: "University", effectiveDate: "2023-08-01" },
      { policyId: "POL-PREREQ-001", category: "prerequisites", title: "Prerequisite Enforcement Policy", content: "Prerequisites must be completed with grade C or better. Students may petition for prerequisite override through department chair with advisor recommendation. Override granted only when (1) student demonstrates equivalent knowledge, (2) no more than one prerequisite is waived, (3) instructor approves. Chain prerequisites (A->B->C) cannot skip intermediate courses.", accreditationBody: "University", effectiveDate: "2023-08-01" },
      { policyId: "POL-REVIEW-001", category: "curriculum_review", title: "Course Review Cycle", content: "Every course must undergo formal review every 3 years. Review includes (1) learning outcome alignment with program objectives, (2) student evaluation analysis, (3) peer teaching observation, (4) industry relevance assessment, (5) textbook and resource currency. Courses not reviewed within cycle are flagged for department chair action.", accreditationBody: "University", effectiveDate: "2024-01-01" },
      { policyId: "POL-LOAD-001", category: "faculty_load", title: "Faculty Teaching Load Standards", content: "Standard teaching load: 3 courses per semester for tenure-track, 4 for lecturers, 1-2 for adjuncts. Research-active faculty may receive 1-course reduction with dean approval. Overload (exceeding max) requires department chair and dean authorization and carries 15% per-course stipend. No faculty member may exceed max+1 without provost approval.", accreditationBody: "University", effectiveDate: "2024-01-01" },
      { policyId: "POL-ENROLL-001", category: "enrollment", title: "Enrollment Management Policy", content: "Minimum viable enrollment: 12 students for electives, 20 for core courses. Courses below minimum for two consecutive offerings are subject to cancellation review. Wait-listed courses with 10+ students must open additional sections if faculty are available. Enrollment cap changes require department chair approval.", accreditationBody: "University", effectiveDate: "2024-01-01" },
      { policyId: "POL-CERT-001", category: "certificate_programs", title: "Certificate Program Requirements", content: "Certificate programs must include minimum 15 credit hours, at least 2 core courses, and a culminating experience (project or comprehensive exam). Certificates cannot duplicate more than 50% of content from existing degree programs. Annual enrollment review required; programs below 10 students for 2 years face discontinuation.", accreditationBody: "University", effectiveDate: "2024-06-01" },
      { policyId: "POL-ASSESS-001", category: "assessment", title: "Student Learning Outcome Assessment", content: "Each course must have 3-5 measurable learning outcomes mapped to program outcomes. Assessment methods: (1) embedded exam questions, (2) rubric-scored assignments, (3) capstone project evaluation. Results reported to assessment coordinator by end of each semester. Courses with <70% student attainment on any outcome require intervention plan.", accreditationBody: "ABET", effectiveDate: "2024-01-01" },
      { policyId: "POL-ONLINE-001", category: "online_delivery", title: "Online Course Standards", content: "Online sections must maintain the same learning outcomes, assessments, and rigor as in-person sections. Additional requirements: (1) proctored exams or equivalent verification, (2) weekly synchronous or structured asynchronous engagement, (3) ADA-compliant materials, (4) regular substantive interaction per DOE guidelines.", accreditationBody: "University", effectiveDate: "2024-01-01" },
      { policyId: "POL-GAP-001", category: "curriculum_gap", title: "Curriculum Gap Analysis Protocol", content: "Annual curriculum mapping against industry competency frameworks (ACM/IEEE CS2023). Gaps identified when >20% of competency areas lack course coverage. Resolution: (1) propose new course within one semester, (2) modify existing courses within two semesters, (3) report coverage changes to ABET coordinator. Current identified gaps: cloud-native development, AI ethics integration, DevSecOps.", accreditationBody: "ABET", effectiveDate: "2025-01-01" },
      { policyId: "POL-TRANSFER-001", category: "transfer_credit", title: "Transfer Credit Evaluation", content: "Transfer credits accepted from regionally accredited institutions. Evaluation criteria: (1) syllabus comparison showing >75% content overlap, (2) minimum grade of C, (3) course taken within last 7 years for technology courses. Maximum 60 transfer credits for BS, 9 for MS. Department chair reviews edge cases.", accreditationBody: "University", effectiveDate: "2023-08-01" },
    ];
    if (!hasPolicies) {
      for (const policy of policiesData) await ctx.db.insert("curricularPolicies", policy);
    }

    // === REVIEWS ===
    const reviewsData = [
      { reviewId: "REV-001", courseId: "CRS-001", type: "student_eval", findings: "Students report the course is well-structured with clear progression from concepts to code. Some students request more hands-on lab time. TA office hours are frequently overcrowded.", recommendations: "Add a weekly lab section and increase TA allocation from 2 to 3.", semester: "Fall 2025", score: 4.2 },
      { reviewId: "REV-002", courseId: "CRS-002", type: "student_eval", findings: "High difficulty level. Students appreciate rigorous content but report the jump from CS101 is steep. Drop rate of 10% is above department average.", recommendations: "Add bridge content in first two weeks. Consider a CS150 intermediate course.", semester: "Fall 2025", score: 3.6 },
      { reviewId: "REV-003", courseId: "CRS-006", type: "peer_review", findings: "Strong course design with excellent integration of theory and practice. Assignments use current ML frameworks (PyTorch). Could benefit from more emphasis on ethical AI considerations.", recommendations: "Integrate AI ethics module in weeks 10-12. Add fairness metric assignment.", semester: "Fall 2025", score: 4.5 },
      { reviewId: "REV-004", courseId: "CRS-003", type: "student_eval", findings: "Course content is solid but pacing is uneven. Process scheduling section is rushed while memory management has too much time allocated. Students want more hands-on kernel programming.", recommendations: "Rebalance weeks 4-8 pacing. Add xv6 kernel lab exercises.", semester: "Fall 2025", score: 3.4 },
      { reviewId: "REV-005", courseId: "CRS-011", type: "peer_review", findings: "Graduate-level rigor is well maintained. Real-world datasets used effectively. Students produce publishable-quality analyses. Prerequisites may need strengthening in linear algebra.", recommendations: "Add linear algebra review module. Consider MATH501 as co-requisite.", semester: "Fall 2025", score: 4.6 },
      { reviewId: "REV-006", courseId: "CRS-009", type: "student_eval", findings: "Students find the material dry and disconnected from practical applications. Lab equipment is outdated. Completion rate of 79% is lowest in the CS program.", recommendations: "Modernize labs with FPGA boards. Add real-world architecture case studies.", semester: "Fall 2025", score: 2.9 },
      { reviewId: "REV-007", courseId: "CRS-010", type: "accreditation_audit", findings: "Cybersecurity course covers NIST framework adequately but lacks hands-on penetration testing component required by industry standards. Course under review for prerequisite chain concerns.", recommendations: "Add CTF (capture the flag) lab component. Resolve prerequisite dependency on CS410 to avoid bottleneck.", semester: "Spring 2026", score: 3.2 },
      { reviewId: "REV-008", courseId: "CRS-021", type: "accreditation_audit", findings: "Software Architecture course has not been updated in 2 years. Microservices content is outdated and does not cover serverless or edge computing patterns. Enrollment has declined 25% since last offering.", recommendations: "Major revision needed: add serverless, event-driven architecture, and observability modules. Align with ACM SE2023 curriculum guidelines.", semester: "Spring 2026", score: 2.8 },
      { reviewId: "REV-009", courseId: "CRS-022", type: "student_eval", findings: "Satellite campus students appreciate having local access but report feeling disconnected from main campus resources. Online office hours with main campus TAs help.", recommendations: "Establish dedicated satellite campus study group. Improve video conferencing setup for cross-campus collaboration.", semester: "Fall 2025", score: 3.8 },
      { reviewId: "REV-010", courseId: "CRS-016", type: "student_eval", findings: "Highly rated course with excellent balance of theory and implementation. Students report GPU access is sometimes limited due to shared lab resources.", recommendations: "Secure additional cloud GPU credits. Consider partnership with NVIDIA Academic Program.", semester: "Fall 2025", score: 4.7 },
      { reviewId: "REV-011", courseId: "CRS-008", type: "peer_review", findings: "Capstone projects demonstrate strong integration of prior coursework. Industry mentors report students are well-prepared. Some projects lack sufficient testing coverage.", recommendations: "Require minimum 80% code coverage in deliverables. Add automated CI/CD pipeline requirement.", semester: "Spring 2026", score: 4.3 },
      { reviewId: "REV-012", courseId: "CRS-001", type: "curriculum_gap", findings: "CS101 does not cover version control (Git) or command-line tools. These are expected competencies by CS201 and are listed in ACM CC2023 introductory curriculum. Students arrive at CS201 without these skills.", recommendations: "Add Git/CLI module in weeks 3-4 of CS101. Reduce time on flowcharting (weeks 2-3) to accommodate.", semester: "Spring 2026", score: 0.0 },
      { reviewId: "REV-013", courseId: "CRS-025", type: "curriculum_gap", findings: "Cloud-native development is identified as a curriculum gap per POL-GAP-001. No existing course covers serverless, edge computing, or modern deployment patterns. The proposed CS430 would address this gap.", recommendations: "Approve CS430 proposal. Ensure alignment with cloud certification pathways (AWS, GCP). Target Fall 2026 launch.", semester: "Spring 2026", score: 0.0 },
      { reviewId: "REV-014", courseId: "CRS-017", type: "student_eval", findings: "AI Ethics course is popular and well-received. Case study approach is effective. Students want more technical fairness metrics and less philosophical discussion.", recommendations: "Increase technical content to 60% (from 40%). Add Fairlearn/AIF360 toolkit labs.", semester: "Spring 2026", score: 4.1 },
      { reviewId: "REV-015", courseId: "CRS-015", type: "peer_review", findings: "Data Science capstone produces high-quality work. Industry partners report strong student preparation. Cohort size is limited by faculty supervision capacity.", recommendations: "Recruit adjunct industry mentors to increase capacity. Consider co-advising model with DS faculty.", semester: "Spring 2026", score: 4.4 },
    ];
    if (!hasReviews) {
      for (const review of reviewsData) await ctx.db.insert("reviews", review);
    }

    // === ACTION ITEMS ===
    const actionItemsData = [
      {
        actionItemId: "ACT-001",
        courseId: "CRS-010",
        programId: "PRG-CS-BS",
        campusId: "Main Campus",
        title: "Resolve CS420 prerequisite bottleneck",
        description: "CS420 Cybersecurity requires CS410 (Networks) which is only offered in Spring. Students who miss it are delayed by a full year. Evaluate whether CS301 alone is sufficient as prerequisite.",
        assignee: "Dr. Robert Kim",
        priority: "high",
        status: "open",
        source: "accreditation_review",
        dueAt: "2026-05-15T00:00:00Z",
        createdAt: "2026-03-01T00:00:00Z",
        completedAt: undefined,
      },
      {
        actionItemId: "ACT-002",
        courseId: "CRS-021",
        programId: "PRG-SE-BS",
        campusId: "Main Campus",
        title: "Revise SE400 Software Architecture curriculum",
        description: "Course content is 2 years stale. Must update to cover serverless, event-driven architecture, and observability patterns per accreditation audit findings (REV-008).",
        assignee: "Dr. Angela Torres",
        priority: "critical",
        status: "open",
        source: "accreditation_review",
        dueAt: "2026-06-01T00:00:00Z",
        createdAt: "2026-03-15T00:00:00Z",
        completedAt: undefined,
      },
      {
        actionItemId: "ACT-003",
        courseId: undefined,
        programId: "PRG-DS-MS",
        campusId: "Main Campus",
        title: "Address Dr. Chen teaching overload",
        description: "Dr. David Chen is teaching 4 courses against a max load of 3. Per POL-LOAD-001, overload requires dean authorization and carries 15% stipend. Either redistribute one course or secure formal overload approval.",
        assignee: "Dr. Lisa Ramirez",
        priority: "high",
        status: "open",
        source: "agent",
        dueAt: "2026-04-30T00:00:00Z",
        createdAt: "2026-04-01T00:00:00Z",
        completedAt: undefined,
      },
    ];
    if (!hasActionItems) {
      for (const item of actionItemsData) await ctx.db.insert("actionItems", item);
    }
  },
});
