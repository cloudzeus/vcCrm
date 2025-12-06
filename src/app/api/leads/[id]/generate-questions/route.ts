import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

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

    // Get the CRM record (lead/opportunity)
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
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
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Build the brief summary for OpenAI
    const briefSummary = `
Opportunity Title: ${crmRecord.title}
Company: ${crmRecord.company.name}
Description: ${crmRecord.description || "No description provided"}
Customer Needs: ${crmRecord.needs || "Not specified"}
Product/Service Scope: ${crmRecord.productServiceScope || "Not specified"}
${crmRecord.customerInfo ? `Customer Information: ${JSON.stringify(crmRecord.customerInfo)}` : ""}
`;

    // Generate questions using OpenAI
    const prompt = `Generate a list of detailed and relevant questions to clarify requirements and prepare a proposal for this opportunity:

${briefSummary}

Please generate 8-12 specific, actionable questions in GREEK LANGUAGE that will help gather:
1. Detailed requirements and specifications
2. Budget and timeline expectations
3. Technical or service constraints
4. Success criteria and deliverables
5. Decision-making process and stakeholders

IMPORTANT: All questions, titles, and descriptions must be in GREEK LANGUAGE.

Format the response as a JSON object with a "questions" array, where each object has:
- "title": A short title for the question in Greek (max 100 characters)
- "question": The full question text in Greek
- "description": Optional context or explanation in Greek for why this question is important

Return ONLY the JSON object, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a sales consultant expert at creating detailed questions to clarify customer requirements for proposals. All questions must be in GREEK LANGUAGE. Always respond with valid JSON objects only.",
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
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    // Parse the response
    let questions: Array<{ title: string; question: string; description?: string }>;
    try {
      const parsed = JSON.parse(responseContent);
      questions = parsed.questions || parsed.data || [];
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}






