import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create SUPERADMIN user
  const hashedPassword = await bcrypt.hash("1f1femsk", 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: "gkozyris@i4ria.com" },
    update: {},
    create: {
      email: "gkozyris@i4ria.com",
      name: "Super Admin",
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
    },
  });

  console.log("✅ Created SUPERADMIN user:", superAdmin.email);

  // Create a test organization
  const organization = await prisma.organization.upsert({
    where: { slug: "demo-agency" },
    update: {},
    create: {
      name: "Demo Agency",
      slug: "demo-agency",
      plan: "PROFESSIONAL",
    },
  });

  console.log("✅ Created organization:", organization.name);

  // Create owner user for the organization
  const ownerPassword = await bcrypt.hash("password123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo-agency.com" },
    update: {},
    create: {
      email: "owner@demo-agency.com",
      name: "Agency Owner",
      passwordHash: ownerPassword,
      role: "OWNER",
      organizationId: organization.id,
    },
  });

  console.log("✅ Created owner user:", owner.email);

  // Create manager user
  const managerPassword = await bcrypt.hash("password123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "manager@demo-agency.com" },
    update: {},
    create: {
      email: "manager@demo-agency.com",
      name: "Campaign Manager",
      passwordHash: managerPassword,
      role: "MANAGER",
      organizationId: organization.id,
    },
  });

  console.log("✅ Created manager user:", manager.email);

  // Create influencer users
  const influencerUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "influencer1@demo-agency.com" },
      update: {},
      create: {
        email: "influencer1@demo-agency.com",
        name: "Sarah Johnson",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "INFLUENCER",
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "influencer2@demo-agency.com" },
      update: {},
      create: {
        email: "influencer2@demo-agency.com",
        name: "Mike Chen",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "INFLUENCER",
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "influencer3@demo-agency.com" },
      update: {},
      create: {
        email: "influencer3@demo-agency.com",
        name: "Emma Wilson",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "INFLUENCER",
        organizationId: organization.id,
      },
    }),
  ]);

  console.log("✅ Created influencer users");

  // Create influencer profiles
  const influencerProfiles = await Promise.all([
    prisma.influencerProfile.upsert({
      where: { userId: influencerUsers[0].id },
      update: {},
      create: {
        userId: influencerUsers[0].id,
        organizationId: organization.id,
        stageName: "Sarah Travels",
        bio: "Travel and lifestyle content creator with 500K+ followers",
        platforms: {
          instagram: { handle: "@sarahtravels", followers: 500000 },
          tiktok: { handle: "@sarahtravels", followers: 300000 },
        },
        defaultCurrency: "USD",
        managerSharePercent: 20,
      },
    }),
    prisma.influencerProfile.upsert({
      where: { userId: influencerUsers[1].id },
      update: {},
      create: {
        userId: influencerUsers[1].id,
        organizationId: organization.id,
        stageName: "TechMike",
        bio: "Tech reviewer and gadget enthusiast",
        platforms: {
          youtube: { handle: "@techmike", subscribers: 800000 },
          instagram: { handle: "@techmike", followers: 200000 },
        },
        defaultCurrency: "USD",
        managerSharePercent: 15,
      },
    }),
    prisma.influencerProfile.upsert({
      where: { userId: influencerUsers[2].id },
      update: {},
      create: {
        userId: influencerUsers[2].id,
        organizationId: organization.id,
        stageName: "FashionEmma",
        bio: "Fashion and beauty influencer",
        platforms: {
          instagram: { handle: "@fashionemma", followers: 1200000 },
          tiktok: { handle: "@fashionemma", followers: 900000 },
        },
        defaultCurrency: "USD",
        managerSharePercent: 25,
      },
    }),
  ]);

  console.log("✅ Created influencer profiles");

  // Create brands
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        organizationId: organization.id,
        name: "TechCorp",
        website: "https://techcorp.example.com",
        notes: "Leading technology company",
      },
    }),
    prisma.brand.create({
      data: {
        organizationId: organization.id,
        name: "FashionHub",
        website: "https://fashionhub.example.com",
        notes: "Premium fashion brand",
      },
    }),
    prisma.brand.create({
      data: {
        organizationId: organization.id,
        name: "TravelCo",
        website: "https://travelco.example.com",
        notes: "Travel and tourism company",
      },
    }),
  ]);

  console.log("✅ Created brands");

  // Create campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        organizationId: organization.id,
        brandId: brands[0].id,
        createdById: manager.id,
        name: "TechCorp Summer Launch",
        description: "Promote new product launch across tech influencers",
        status: "ACTIVE",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-08-31"),
        totalBudget: 50000,
      },
    }),
    prisma.campaign.create({
      data: {
        organizationId: organization.id,
        brandId: brands[1].id,
        createdById: manager.id,
        name: "FashionHub Fall Collection",
        description: "Showcase new fall fashion line",
        status: "ACTIVE",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2024-11-30"),
        totalBudget: 75000,
      },
    }),
    prisma.campaign.create({
      data: {
        organizationId: organization.id,
        brandId: brands[2].id,
        createdById: manager.id,
        name: "TravelCo Destination Campaign",
        description: "Promote new travel destinations",
        status: "COMPLETED",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        totalBudget: 30000,
      },
    }),
  ]);

  console.log("✅ Created campaigns");

  // Create campaign influencer assignments
  const campaignInfluencers = await Promise.all([
    // TechCorp campaign
    prisma.campaignInfluencer.create({
      data: {
        campaignId: campaigns[0].id,
        influencerId: influencerProfiles[1].id,
        fee: 15000,
        currency: "USD",
        status: "ACCEPTED",
      },
    }),
    // FashionHub campaign
    prisma.campaignInfluencer.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencerProfiles[2].id,
        fee: 25000,
        currency: "USD",
        status: "ACCEPTED",
      },
    }),
    prisma.campaignInfluencer.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencerProfiles[0].id,
        fee: 20000,
        currency: "USD",
        status: "ACCEPTED",
      },
    }),
    // TravelCo campaign (completed)
    prisma.campaignInfluencer.create({
      data: {
        campaignId: campaigns[2].id,
        influencerId: influencerProfiles[0].id,
        fee: 10000,
        currency: "USD",
        status: "COMPLETED",
      },
    }),
  ]);

  console.log("✅ Created campaign influencer assignments");

  // Create post schedules
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const posts = await Promise.all([
    // TechCorp posts
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[0].id,
        influencerId: influencerProfiles[1].id,
        createdById: manager.id,
        platform: "YOUTUBE",
        contentType: "VIDEO",
        scheduledAt: nextWeek,
        status: "APPROVED",
        caption: "Check out this amazing new product from TechCorp! #TechReview",
        notes: "Focus on product features and benefits",
      },
    }),
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[0].id,
        influencerId: influencerProfiles[1].id,
        createdById: manager.id,
        platform: "INSTAGRAM",
        contentType: "REEL",
        scheduledAt: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: "PLANNED",
        caption: "Unboxing the latest tech! 🔥",
      },
    }),
    // FashionHub posts
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencerProfiles[2].id,
        createdById: manager.id,
        platform: "INSTAGRAM",
        contentType: "POST",
        scheduledAt: twoWeeks,
        status: "APPROVED",
        caption: "Loving the new fall collection! 🍂 #FashionHub",
        notes: "Include 3 outfit changes",
      },
    }),
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencerProfiles[2].id,
        createdById: manager.id,
        platform: "TIKTOK",
        contentType: "SHORT",
        scheduledAt: new Date(twoWeeks.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
        caption: "Try on haul of the new collection!",
      },
    }),
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencerProfiles[0].id,
        createdById: manager.id,
        platform: "INSTAGRAM",
        contentType: "STORY",
        scheduledAt: new Date(twoWeeks.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: "PLANNED",
        caption: "Sneak peek of the collection!",
      },
    }),
    // TravelCo posts (completed campaign)
    prisma.postSchedule.create({
      data: {
        campaignId: campaigns[2].id,
        influencerId: influencerProfiles[0].id,
        createdById: manager.id,
        platform: "INSTAGRAM",
        contentType: "POST",
        scheduledAt: new Date("2024-02-15"),
        status: "POSTED",
        caption: "Amazing destination! Highly recommend 🌴",
      },
    }),
  ]);

  console.log("✅ Created post schedules");

  // Create metric snapshots for completed posts
  await Promise.all([
    prisma.metricSnapshot.create({
      data: {
        postScheduleId: posts[5].id,
        capturedByUserId: manager.id,
        impressions: 125000,
        reach: 98000,
        likes: 8500,
        comments: 320,
        saves: 1200,
        clicks: 4500,
        shares: 180,
        estimatedRevenue: 2500,
      },
    }),
  ]);

  console.log("✅ Created metric snapshots");

  // Create some media assets
  await Promise.all([
    prisma.mediaAsset.create({
      data: {
        organizationId: organization.id,
        uploadedByUserId: manager.id,
        campaignId: campaigns[0].id,
        filename: "techcorp-product.jpg",
        url: "https://via.placeholder.com/800x600",
        mimeType: "image/jpeg",
        sizeBytes: 245000,
        isPrimary: true,
      },
    }),
    prisma.mediaAsset.create({
      data: {
        organizationId: organization.id,
        uploadedByUserId: manager.id,
        campaignId: campaigns[1].id,
        filename: "fashion-collection.jpg",
        url: "https://via.placeholder.com/800x600",
        mimeType: "image/jpeg",
        sizeBytes: 312000,
        isPrimary: true,
      },
    }),
  ]);

  console.log("✅ Created media assets");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - 1 SUPERADMIN user (gkozyris@i4ria.com / 1f1femsk)`);
  console.log(`   - 1 Organization (Demo Agency)`);
  console.log(`   - 1 Owner, 1 Manager, 3 Influencers`);
  console.log(`   - 3 Brands`);
  console.log(`   - 3 Campaigns (2 Active, 1 Completed)`);
  console.log(`   - 4 Campaign-Influencer assignments`);
  console.log(`   - 6 Post schedules`);
  console.log(`   - 1 Metric snapshot`);
  console.log(`   - 2 Media assets`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

