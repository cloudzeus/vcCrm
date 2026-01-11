import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";

// GET /api/proposals
export async function GET(req: Request) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();

        const proposals = await prisma.proposal.findMany({
            where: {
                organizationId: organization.id,
            },
            include: {
                company: {
                    select: { id: true, name: true, logoUrl: true }
                },
                items: {
                    include: {
                        service: { select: { code: true, description: true } }
                    }
                },
                crmRecord: {
                    select: { id: true, title: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(proposals);
    } catch (error) {
        console.error("[PROPOSALS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/proposals - CREATE and GENERATE AI proposal
export async function POST(req: Request) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();
        const body = await req.json();

        const {
            title,
            crmRecordId, // Optional
            companyId, // Required
            shortDescription,
            items // Array of { serviceId, quantity, price }
        } = body;

        if (!companyId || !title || !items || items.length === 0) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // 1. Calculate totals
        let totalAmount = 0;
        const proposalItemsData = items.map((item: any) => {
            const itemTotal = item.quantity * item.price;
            totalAmount += itemTotal;
            return {
                serviceId: item.serviceId,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal
            };
        });

        // 2. Fetch service details for AI context
        const serviceIds = items.map((i: any) => i.serviceId);
        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds } }
        });

        // Create a text summary of services for the AI
        const servicesContext = services.map(s => {
            const item = items.find((i: any) => i.serviceId === s.id);
            return `- ${s.description} (Code: ${s.code}, Qty: ${item.quantity})`;
        }).join("\n");

        const company = await prisma.company.findUnique({ where: { id: companyId } });

        // 3. Call DeepSeek (via OpenRouter or direct - assume logic here or call helper)
        // IMPORTANT: The user mentioned "post thos information to deepseek and get a full proposal text"
        // I will mock the AI call structure or use a placeholder if no API key is set, 
        // but the instruction implies ACTUAL implementation. 
        // I will assume an environment variable DEEPSEEK_API_KEY or similar is usually used.
        // Since I don't have the key, I will draft the prompt logic and stub the fetch.

        let generatedContent = "";

        // AI PROMPT LOGIC
        const prompt = `
    Create a professional business proposal for the client "${company?.name}".
    
    Proposal Title: ${title}
    Context/Description: ${shortDescription || "N/A"}
    
    Services Included:
    ${servicesContext}
    
    Total Value: $${totalAmount}
    
    Please write a comprehensive proposal including:
    1. Executive Summary
    2. Project Scope & Deliverables
    3. Timeline & Implementation Strategy
    4. Investment Breakdown (referencing the items)
    5. Conclusion
    
    Tone: Professional, persuasive, and tailored to the services listed.
    Format: Markdown.
    `;

        // Try to call AI if key exists, otherwise use placeholder
        if (process.env.DEEPSEEK_API_KEY) {
            try {
                // Example DeepSeek / OpenRouter call - adjusting to generic OpenAI compatible or specific
                // Assuming DeepSeek has an OpenAI compatible endpoint or specific one.
                // Using startdard 'fetch' to DeepSeek API
                const aiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: "You are a professional proposal writer assistant." },
                            { role: "user", content: prompt }
                        ]
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    generatedContent = aiData.choices[0].message.content;
                } else {
                    console.error("DeepSeek API error", await aiResponse.text());
                    generatedContent = `(AI Generation Failed - API Error)\n\n${prompt}`; // Fallback
                }
            } catch (e) {
                console.error("AI Call Failed", e);
                generatedContent = `(AI Generation Failed - Connection Error)\n\n${prompt}`;
            }
        } else {
            // Fallback if no key
            generatedContent = `
# Proposal: ${title}
**Client:** ${company?.name}

## Executive Summary
(AI generation requires DEEPSEEK_API_KEY env var. Here is the context used:)
${shortDescription}

## Services
${servicesContext}

## Investment
Total: $${totalAmount}
`;
        }

        // 4. Save to Database
        const proposal = await prisma.proposal.create({
            data: {
                organizationId: organization.id,
                crmRecordId: crmRecordId || undefined,
                companyId,
                title,
                shortDescription,
                content: generatedContent,
                totalAmount,
                status: "DRAFT",
                items: {
                    create: proposalItemsData
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(proposal);
    } catch (error) {
        console.error("[PROPOSALS_POST]", error);
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 });
    }
}
