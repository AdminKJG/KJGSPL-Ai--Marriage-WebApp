export interface EducationOption {
  code: string;
  shortName: string;
  name: string;
  field: string;
  degreeLevel: string;
}

export interface OccupationOption {
  code: string;
  name: string;
  description: string;
}

export const MASTER_EDUCATION: EducationOption[] = [
  { code: "EDU040", shortName: "B.Tech CSE", name: "Bachelor of Technology in Computer Science and Engineering", field: "Computer Science", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU041", shortName: "B.Tech EE", name: "Bachelor of Technology in Electrical Engineering", field: "Engineering", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU042", shortName: "B.Tech ME", name: "Bachelor of Technology in Mechanical Engineering", field: "Engineering", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU043", shortName: "B.Tech Civil", name: "Bachelor of Technology in Civil Engineering", field: "Engineering", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU050", shortName: "B.Sc CS", name: "Bachelor of Science in Computer Science", field: "Computer Science", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU051", shortName: "B.Sc", name: "Bachelor of Science", field: "Science", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU052", shortName: "BA", name: "Bachelor of Arts", field: "Humanities", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU060", shortName: "B.Com", name: "Bachelor of Commerce", field: "Commerce", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU061", shortName: "BBA", name: "Bachelor of Business Administration", field: "Management", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU062", shortName: "BCA", name: "Bachelor of Computer Applications", field: "Computer Science", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU070", shortName: "MBBS", name: "Bachelor of Medicine, Bachelor of Surgery", field: "Medicine", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU071", shortName: "BDS", name: "Bachelor of Dental Surgery", field: "Medicine", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU072", shortName: "B.Arch", name: "Bachelor of Architecture", field: "Architecture", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU073", shortName: "LLB", name: "Bachelor of Laws", field: "Law", degreeLevel: "DEG_BACHELOR" },
  { code: "EDU080", shortName: "MBA", name: "Master of Business Administration", field: "Management", degreeLevel: "DEG_MASTER" },
  { code: "EDU081", shortName: "M.Tech", name: "Master of Technology", field: "Engineering", degreeLevel: "DEG_MASTER" },
  { code: "EDU082", shortName: "MCA", name: "Master of Computer Applications", field: "Computer Science", degreeLevel: "DEG_MASTER" },
  { code: "EDU083", shortName: "M.Sc", name: "Master of Science", field: "Science", degreeLevel: "DEG_MASTER" },
  { code: "EDU084", shortName: "M.Com", name: "Master of Commerce", field: "Commerce", degreeLevel: "DEG_MASTER" },
  { code: "EDU085", shortName: "MA", name: "Master of Arts", field: "Humanities", degreeLevel: "DEG_MASTER" },
  { code: "EDU086", shortName: "LLM", name: "Master of Laws", field: "Law", degreeLevel: "DEG_MASTER" },
  { code: "EDU090", shortName: "Ph.D", name: "Doctor of Philosophy", field: "Research", degreeLevel: "DEG_DOCTORATE" },
  { code: "EDU100", shortName: "CA", name: "Chartered Accountant", field: "Finance", degreeLevel: "DEG_OTHER" },
  { code: "EDU101", shortName: "CS", name: "Company Secretary", field: "Finance", degreeLevel: "DEG_OTHER" },
  { code: "EDU102", shortName: "CMA", name: "Cost and Management Accountant", field: "Finance", degreeLevel: "DEG_OTHER" },
  { code: "EDU110", shortName: "Polytechnic", name: "Diploma in Engineering", field: "Engineering", degreeLevel: "DEG_DIPLOMA" },
];

export const MASTER_OCCUPATION: OccupationOption[] = [
  { code: "OCC0101", name: "Full Stack Developer", description: "Builds frontend and backend software" },
  { code: "OCC0102", name: "Frontend Web Developer", description: "Develops user interfaces for web apps" },
  { code: "OCC0103", name: "Backend Developer", description: "Develops server APIs and databases" },
  { code: "OCC0104", name: "Data Scientist", description: "Analyzes data patterns and machine learning models" },
  { code: "OCC0105", name: "Mobile App Developer", description: "Builds Android and iOS mobile applications" },
  { code: "OCC0106", name: "DevOps Engineer", description: "Automates deployment and CI/CD pipelines" },
  { code: "OCC0107", name: "Cybersecurity Specialist", description: "Secures networks and IT systems" },
  { code: "OCC0201", name: "Product Manager", description: "Leads product strategy and roadmap" },
  { code: "OCC0202", name: "Project Manager", description: "Manages project execution and delivery" },
  { code: "OCC0203", name: "Business Analyst", description: "Analyzes business requirements and workflows" },
  { code: "OCC0204", name: "UI/UX Designer", description: "Designs digital user experiences and screens" },
  { code: "OCC0205", name: "Software Engineer", description: "Engineers software solutions" },
  { code: "OCC0214", name: "Software Tester", description: "Tests software for quality assurance" },
  { code: "OCC0301", name: "Financial Analyst", description: "Analyzes investment and financial data" },
  { code: "OCC0302", name: "Chartered Accountant", description: "Audits and manages accounting records" },
  { code: "OCC0303", name: "Investment Banker", description: "Manages corporate finances and capital" },
  { code: "OCC0401", name: "Doctor / Physician", description: "Diagnoses and treats patient illnesses" },
  { code: "OCC0402", name: "Surgeon", description: "Performs medical operations and surgeries" },
  { code: "OCC0403", name: "Dentist", description: "Treats oral health and dental conditions" },
  { code: "OCC0404", name: "Nurse", description: "Provides nursing care to patients" },
  { code: "OCC0405", name: "Pharmacist", description: "Dispenses medications and pharmaceutical advice" },
  { code: "OCC0501", name: "Civil Engineer", description: "Designs and oversees construction projects" },
  { code: "OCC0502", name: "Mechanical Engineer", description: "Designs mechanical machinery and systems" },
  { code: "OCC0503", name: "Electrical Engineer", description: "Designs electrical circuits and systems" },
  { code: "OCC0504", name: "Architect", description: "Designs buildings and structural layouts" },
  { code: "OCC0601", name: "Teacher / Professor", description: "Teaches students at schools or universities" },
  { code: "OCC0602", name: "Digital Marketer", description: "Manages online brand and marketing campaigns" },
  { code: "OCC0603", name: "Sales Manager", description: "Leads business sales strategies and teams" },
  { code: "OCC0604", name: "Human Resources Manager", description: "Manages recruitment and organizational talent" },
  { code: "OCC0605", name: "Entrepreneur / Founder", description: "Founds and manages business ventures" },
  { code: "OCC0606", name: "Lawyer / Advocate", description: "Provides legal counsel and court representation" },
  { code: "OCC0607", name: "Government Service Officer", description: "Civil service officer in public administration" },
  { code: "OCC0608", name: "Banking Professional", description: "Manages banking operations and client portfolios" },
  { code: "OCC0609", name: "Consultant", description: "Provides strategic domain advice to clients" },
];
