import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  "React", "TypeScript", "Python", "Flutter", "Swift",
  "Machine Learning", "Blockchain", "Biotech", "MedTech",
  "Sales", "Marketing", "Finance", "Legal", "HR",
  "Product Management", "UI/UX Design", "Hardware Engineering",
  "Supply Chain", "Sustainability", "EdTech",
];

async function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.$executeRawUnsafe("DELETE FROM EventAttendee");
  await prisma.$executeRawUnsafe("DELETE FROM Event");
  await prisma.$executeRawUnsafe("DELETE FROM Report");
  await prisma.$executeRawUnsafe("DELETE FROM BlockedUser");
  await prisma.$executeRawUnsafe("DELETE FROM Notification");
  await prisma.$executeRawUnsafe("DELETE FROM Rating");
  await prisma.$executeRawUnsafe("DELETE FROM Message");
  await prisma.$executeRawUnsafe("DELETE FROM ConversationParticipant");
  await prisma.$executeRawUnsafe("DELETE FROM Conversation");
  await prisma.$executeRawUnsafe("DELETE FROM ProjectPost");
  await prisma.$executeRawUnsafe("DELETE FROM FAQ");
  await prisma.$executeRawUnsafe("DELETE FROM OpenRole");
  await prisma.$executeRawUnsafe("DELETE FROM JoinRequest");
  await prisma.$executeRawUnsafe("DELETE FROM ProjectFollower");
  await prisma.$executeRawUnsafe("DELETE FROM ProjectMember");
  await prisma.$executeRawUnsafe("DELETE FROM Project");
  await prisma.$executeRawUnsafe("DELETE FROM UserSkill");
  await prisma.$executeRawUnsafe("DELETE FROM Skill");
  await prisma.$executeRawUnsafe("DELETE FROM User");

  // Create skills
  const skillRecords: Record<string, string> = {};
  for (const name of SKILLS) {
    const skill = await prisma.skill.create({ data: { name } });
    skillRecords[name] = skill.id;
  }
  console.log(`  Created ${SKILLS.length} skills`);

  // Create users
  const password = await hashPassword("password123");

  const usersData = [
    {
      name: "Elena Marti",
      email: "elena@example.com",
      roles: ["FOUNDER"],
      bio: "Building the future of sustainable energy in Switzerland. Previously at ETH Zurich.",
      location: "Zurich",
      canton: "ZH",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["Python", "Machine Learning", "Sustainability"],
      identityVerified: true,
      isEarlyMember: true,
    },
    {
      name: "Luca Bernasconi",
      email: "luca@example.com",
      roles: ["FOUNDER"],
      bio: "Fintech entrepreneur. Building inclusive financial tools for the next generation.",
      location: "Lugano",
      canton: "TI",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["Finance", "Blockchain", "Product Management"],
      identityVerified: true,
    },
    {
      name: "Sophie Keller",
      email: "sophie@example.com",
      roles: ["FOUNDER", "PROFESSIONAL"],
      bio: "MedTech innovator. Bridging the gap between clinical research and patient care.",
      location: "Basel",
      canton: "BS",
      activityStatus: "OCCASIONALLY_ACTIVE",
      skills: ["Biotech", "MedTech", "Sales"],
      isEarlyMember: true,
    },
    {
      name: "Raphael Meier",
      email: "raphael@example.com",
      roles: ["PROFESSIONAL"],
      bio: "Full-stack engineer passionate about developer tools and open source.",
      location: "Zurich",
      canton: "ZH",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["React", "TypeScript", "UI/UX Design"],
    },
    {
      name: "Anna Vogt",
      email: "anna@example.com",
      roles: ["PROFESSIONAL"],
      bio: "Marketing lead with 8+ years in B2B SaaS. Helping startups find product-market fit.",
      location: "Bern",
      canton: "BE",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["Marketing", "Sales", "Product Management"],
    },
    {
      name: "Marco Rossi",
      email: "marco@example.com",
      roles: ["INVESTOR"],
      bio: "Angel investor and former founder. Focused on deep tech and climate tech.",
      location: "Zug",
      canton: "ZG",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["Finance", "Sustainability", "Legal"],
      investmentFocus: "Climate Tech & Deep Tech",
      preferredStage: "SEED",
      ticketSizeMin: 100000,
      ticketSizeMax: 1000000,
      identityVerified: true,
    },
    {
      name: "Clara Dubois",
      email: "clara@example.com",
      roles: ["INVESTOR"],
      bio: "Venture partner at Swisscom Ventures. Investing in enterprise software and AI.",
      location: "Geneva",
      canton: "GE",
      activityStatus: "OCCASIONALLY_ACTIVE",
      skills: ["Finance", "Machine Learning", "Product Management"],
      investmentFocus: "Enterprise SaaS & AI",
      preferredStage: "SERIES_A",
      ticketSizeMin: 500000,
      ticketSizeMax: 3000000,
    },
    {
      name: "Patrick Fischer",
      email: "patrick@example.com",
      roles: ["PROFESSIONAL"],
      bio: "Hardware engineer turned product manager. Love building physical products.",
      location: "Winterthur",
      canton: "ZH",
      activityStatus: "SEEN_RECENTLY",
      skills: ["Hardware Engineering", "Supply Chain", "Product Management"],
    },
    {
      name: "Nina Hofstetter",
      email: "nina@example.com",
      roles: ["FOUNDER"],
      bio: "EdTech founder making coding accessible to every Swiss student.",
      location: "St. Gallen",
      canton: "SG",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["EdTech", "React", "Sales"],
    },
    {
      name: "Thomas Blum",
      email: "thomas@example.com",
      roles: ["PROFESSIONAL", "INVESTOR"],
      bio: "Serial CTO and occasional angel. Love mentoring early-stage technical teams.",
      location: "Lucerne",
      canton: "LU",
      activityStatus: "ACTIVE_THIS_WEEK",
      skills: ["TypeScript", "Python", "Blockchain"],
      investmentFocus: "Developer Tools & Infrastructure",
      preferredStage: "PRE_SEED",
      ticketSizeMin: 50000,
      ticketSizeMax: 200000,
    },
    {
      name: "Isabelle Morel",
      email: "isabelle@example.com",
      roles: ["PROFESSIONAL"],
      bio: "UX researcher focused on accessibility and inclusive design.",
      location: "Lausanne",
      canton: "VD",
      activityStatus: "SEEN_RECENTLY",
      skills: ["UI/UX Design", "Product Management", "Marketing"],
    },
    {
      name: "Daniel Wenger",
      email: "daniel@example.com",
      roles: ["FOUNDER"],
      bio: "Building the next generation of Swiss payment infrastructure.",
      location: "Zurich",
      canton: "ZH",
      activityStatus: "INACTIVE",
      skills: ["Blockchain", "Finance", "TypeScript"],
    },
  ];

  const userIds: string[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: password,
        roles: JSON.stringify(u.roles),
        bio: u.bio,
        location: u.location,
        canton: u.canton,
        activityStatus: u.activityStatus,
        identityVerified: u.identityVerified || false,
        isEarlyMember: u.isEarlyMember || false,
        investmentFocus: u.investmentFocus || null,
        preferredStage: u.preferredStage || null,
        ticketSizeMin: u.ticketSizeMin || null,
        ticketSizeMax: u.ticketSizeMax || null,
        skills: {
          create: u.skills.map((s: string) => ({
            skillId: skillRecords[s],
          })),
        },
      },
    });
    userIds.push(user.id);
  }
  console.log(`  Created ${usersData.length} users`);

  // Create projects
  const projectsData = [
    {
      name: "Solara Energy",
      problem: "Swiss households waste 40% of their solar energy due to inefficient storage.",
      solution: "AI-powered home battery system that optimizes energy storage and grid feed-in.",
      industry: "CleanTech",
      stage: "SEED",
      location: "Zurich",
      teamSize: 5,
      ownerIdx: 0,
      founderMembers: [0, 4],
      members: [3],
    },
    {
      name: "PayBridge",
      problem: "Cross-border payments in Switzerland are slow and expensive for SMEs.",
      solution: "Real-time multi-currency payment platform with near-zero fees.",
      industry: "FinTech",
      stage: "MVP",
      location: "Lugano",
      teamSize: 4,
      ownerIdx: 1,
      founderMembers: [1],
      members: [3, 11],
    },
    {
      name: "HealthSync",
      problem: "Patient data is fragmented across Swiss cantons with no unified view.",
      solution: "Secure interoperable health record platform with patient-controlled access.",
      industry: "HealthTech",
      stage: "SEED",
      location: "Basel",
      teamSize: 6,
      ownerIdx: 2,
      founderMembers: [2],
      members: [4, 7],
    },
    {
      name: "CodeCampus",
      problem: "Swiss schools lack structured computer science education programs.",
      solution: "Interactive coding platform tailored for Swiss curriculum with local language support.",
      industry: "EdTech",
      stage: "IDEA",
      location: "St. Gallen",
      teamSize: 3,
      ownerIdx: 8,
      founderMembers: [8],
      members: [10],
    },
    {
      name: "AlpineRetail",
      problem: "Small Swiss retailers struggle to compete with global e-commerce platforms.",
      solution: "Local-first e-commerce marketplace connecting Swiss makers with local buyers.",
      industry: "E-Commerce",
      stage: "GROWTH",
      location: "Bern",
      teamSize: 8,
      ownerIdx: 0,
      founderMembers: [0, 4],
      members: [3, 7, 11],
    },
    {
      name: "SwissPay",
      problem: "Merchants pay 2-3% per card transaction, eating thin margins.",
      solution: "Blockchain-based payment rail with sub-0.5% fees and instant settlement.",
      industry: "FinTech",
      stage: "MVP",
      location: "Zurich",
      teamSize: 4,
      ownerIdx: 11,
      founderMembers: [11],
      members: [3],
    },
    {
      name: "Nexus Robotics",
      problem: "Swiss manufacturing SMEs cannot afford industrial automation.",
      solution: "Affordable modular robotic arms with AI vision for small-batch production.",
      industry: "Hardware",
      stage: "SEED",
      location: "Winterthur",
      teamSize: 5,
      ownerIdx: 7,
      founderMembers: [7],
      members: [6],
    },
    {
      name: "GreenTower",
      problem: "Urban food production is unsustainable with long supply chains.",
      solution: "Vertical farming towers with hydroponics for Swiss cities.",
      industry: "AgriTech",
      stage: "SEED",
      location: "Geneva",
      teamSize: 3,
      ownerIdx: 8,
      founderMembers: [8, 4],
      members: [],
    },
    {
      name: "LinguaAI",
      problem: "Switzerland has 4 national languages — translation is costly and slow.",
      solution: "Real-time multilingual AI assistant for Swiss businesses and government.",
      industry: "AI",
      stage: "IDEATION",
      location: "Lausanne",
      teamSize: 3,
      ownerIdx: 3,
      founderMembers: [3, 10],
      members: [1],
    },
  ];

  for (const pData of projectsData) {
    const project = await prisma.project.create({
      data: {
        name: pData.name,
        problem: pData.problem,
        solution: pData.solution,
        industry: pData.industry,
        stage: pData.stage,
        location: pData.location,
        teamSize: pData.teamSize,
        ownerId: userIds[pData.ownerIdx],
      },
    });

    for (const memberIdx of pData.founderMembers) {
      await prisma.projectMember.create({
        data: {
          userId: userIds[memberIdx],
          projectId: project.id,
          roleTitle: memberIdx === pData.ownerIdx ? "CEO & Founder" : "Co-Founder",
          isFounder: true,
        },
      });
    }

    for (const memberIdx of pData.members) {
      if (!pData.founderMembers.includes(memberIdx)) {
        await prisma.projectMember.create({
          data: {
            userId: userIds[memberIdx],
            projectId: project.id,
            roleTitle: "Team Member",
            isFounder: false,
          },
        });
      }
    }

    for (let i = 0; i < userIds.length; i++) {
      if (i !== pData.ownerIdx && Math.random() < 0.4) {
        await prisma.projectFollower.create({
          data: {
            userId: userIds[i],
            projectId: project.id,
          },
        });
      }
    }

    await prisma.fAQ.create({
      data: {
        projectId: project.id,
        question: "What stage are you currently at?",
        answer: `We are at ${pData.stage} stage with a team of ${pData.teamSize}.`,
        order: 0,
      },
    });

    await prisma.fAQ.create({
      data: {
        projectId: project.id,
        question: "What kind of team members are you looking for?",
        answer: "We are always open to connecting with passionate people who share our vision.",
        order: 1,
      },
    });

    await prisma.openRole.create({
      data: {
        projectId: project.id,
        title: "Technical Co-Founder",
        skills: JSON.stringify(["React", "TypeScript"]),
        commitment: "Full-time",
        description: "Looking for a technical co-founder to lead engineering.",
      },
    });
  }

  console.log(`  Created ${projectsData.length} projects with members, followers, FAQs, roles`);

  const allProjects = await prisma.project.findMany();
  const projectIds = allProjects.map((p) => p.id);

  for (let i = 0; i < userIds.length; i++) {
    const targetProject = projectIds[i % projectIds.length];
    const exists = await prisma.joinRequest.findUnique({
      where: {
        userId_projectId: { userId: userIds[i], projectId: targetProject },
      },
    });
    if (!exists) {
      await prisma.joinRequest.create({
        data: {
          userId: userIds[i],
          projectId: targetProject,
          motivation: "I'm passionate about this space and would love to contribute.",
          experience: `${3 + Math.floor(Math.random() * 10)}+ years in relevant field.`,
          availability: `${Math.floor(Math.random() * 30) + 10}h/week`,
          status: Math.random() < 0.5 ? "PENDING" : "APPROVED",
        },
      });
    }
  }

  console.log("  Created join requests");

  const conversations = [
    { fromIdx: 4, toIdx: 0, content: "Hi Elena! I love what you're building with Solara Energy. Would love to chat about marketing opportunities." },
    { fromIdx: 0, toIdx: 4, content: "Thanks Anna! Would be happy to connect. Let's schedule a call." },
    { fromIdx: 5, toIdx: 0, content: "Elena, I'm impressed by your traction. Would you be open to a intro call with my network?" },
    { fromIdx: 6, toIdx: 1, content: "Luca, PayBridge sounds interesting. Are you open to series A conversations?" },
  ];

  for (const msg of conversations) {
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userIds[msg.fromIdx] },
            { userId: userIds[msg.toIdx] },
          ],
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userIds[msg.fromIdx],
        receiverId: userIds[msg.toIdx],
        content: msg.content,
      },
    });
  }

  console.log("  Created sample conversations");

  const ratingPairs = [
    { from: 4, to: 0, project: 0, stars: 5 },
    { from: 5, to: 1, project: 1, stars: 4 },
    { from: 3, to: 2, project: 2, stars: 5 },
  ];

  for (const r of ratingPairs) {
    await prisma.rating.create({
      data: {
        fromUserId: userIds[r.from],
        toUserId: userIds[r.to],
        projectId: projectIds[r.project],
        stars: r.stars,
      },
    });
  }

  console.log("  Created ratings");
  console.log("\n✅ Seeding complete!");
  console.log("   All users have password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
