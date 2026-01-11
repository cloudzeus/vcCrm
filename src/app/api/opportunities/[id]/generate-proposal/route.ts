import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get the CRM record (opportunity) with all related data
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
      include: {
        company: {
          include: {
            contacts: true,
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        opportunityTasks: {
          where: {
            status: "DONE", // Only use completed tasks
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Check if all tasks are completed
    const allTasks = await prisma.opportunityTask.findMany({
      where: { crmRecordId: id },
    });

    const completedTasks = allTasks.filter((t) => t.status === "DONE");
    const pendingTasks = allTasks.filter((t) => t.status !== "DONE");

    if (pendingTasks.length > 0) {
      return NextResponse.json(
        {
          error: "Not all questions have been answered",
          pendingCount: pendingTasks.length,
          completedCount: completedTasks.length,
        },
        { status: 400 }
      );
    }

    if (completedTasks.length === 0) {
      return NextResponse.json(
        { error: "No completed tasks found" },
        { status: 400 }
      );
    }

    // Build comprehensive context for proposal generation
    const opportunityContext = `
OPPORTUNITY DETAILS:
Title: ${crmRecord.title}
Company: ${crmRecord.company.name}
Description: ${crmRecord.description || "No description"}
Customer Needs: ${crmRecord.needs || "Not specified"}
Product/Service Scope: ${crmRecord.productServiceScope || "Not specified"}
Estimated Value: ${crmRecord.valueEstimate ? `€${crmRecord.valueEstimate}` : "Not specified"}
Expected Close Date: ${crmRecord.expectedClose ? new Date(crmRecord.expectedClose).toLocaleDateString() : "Not specified"}

COMPANY INFORMATION:
${crmRecord.company.vatNumber ? `VAT Number: ${crmRecord.company.vatNumber}` : ""}
${crmRecord.company.address ? `Address: ${crmRecord.company.address}` : ""}
${crmRecord.company.city ? `City: ${crmRecord.company.city}` : ""}
${crmRecord.company.country ? `Country: ${crmRecord.company.country}` : ""}

KEY CONTACTS:
${crmRecord.contacts.map((cc) => `- ${cc.contact.name}${cc.role ? ` (${cc.role})` : ""}`).join("\n")}

ANSWERS TO CLARIFICATION QUESTIONS:
${crmRecord.opportunityTasks
        .map((task, idx) => `${idx + 1}. ${task.question}\n   Answer: ${task.answer || "No answer provided"}`)
        .join("\n\n")}
`;

    // Generate proposal using OpenAI
    const prompt = `Based on the following opportunity information and customer responses, generate a comprehensive, professional proposal in GREEK LANGUAGE.

${opportunityContext}

Please create a detailed proposal in GREEK LANGUAGE that includes:

1. EXECUTIVE SUMMARY: A brief overview of the opportunity and proposed solution (in Greek)
2. SCOPE OF WORK: Detailed description of what will be delivered (in Greek)
3. DELIVERABLES: Specific items, services, or outcomes that will be provided (in Greek)
4. PRICING: Clear pricing structure with breakdown in Greek (use placeholders if specific amounts aren't available)
5. TIMELINE: Project timeline with key milestones and deadlines (in Greek)
6. TERMS AND CONDITIONS: Standard terms including payment terms, deliverables, timelines, and any important conditions (in Greek)

IMPORTANT: The entire proposal must be written in GREEK LANGUAGE.

The proposal should be:
- Professional and client-focused
- Clear and easy to understand
- Specific to the customer's needs based on their answers
- Realistic and achievable
- Written entirely in Greek

Format the response as a JSON object with the following structure:
{
  "title": "Proposal title in Greek",
  "content": "Full proposal text in Greek (can include markdown formatting)",
  "scope": "Detailed scope of work in Greek",
  "deliverables": "List of deliverables in Greek",
  "pricing": "Pricing information and breakdown in Greek",
  "timeline": "Project timeline with milestones in Greek",
  "terms": "Terms and conditions in Greek"
}

Return ONLY the JSON object, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional proposal writer expert at creating detailed, client-focused business proposals. All proposals must be written in GREEK LANGUAGE. Always respond with valid JSON objects only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json(
        { error: "Failed to generate proposal" },
        { status: 500 }
      );
    }

    // Parse the response
    let proposalData: {
      title: string;
      content: string;
      scope?: string;
      deliverables?: string;
      pricing?: string;
      timeline?: string;
      terms?: string;
    };

    try {
      proposalData = JSON.parse(responseContent);
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Get the latest proposal version number
    const latestProposal = await prisma.proposal.findFirst({
      where: { crmRecordId: id },
      orderBy: { version: "desc" },
    });

    const nextVersion = latestProposal ? latestProposal.version + 1 : 1;

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        organizationId: organization.id,
        companyId: crmRecord.companyId,
        crmRecordId: id,
        title: proposalData.title || `${crmRecord.title} - Proposal`,
        content: proposalData.content || "",
        scope: proposalData.scope || null,
        deliverables: proposalData.deliverables || null,
        pricing: proposalData.pricing || null,
        timeline: proposalData.timeline || null,
        terms: proposalData.terms || null,
        status: "DRAFT",
        version: nextVersion,
      },
    });

    // Update brief status
    await prisma.crmRecord.update({
      where: { id },
      data: {
        briefStatus: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error: any) {
    console.error("Error generating proposal:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

