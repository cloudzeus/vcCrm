import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, PageNumber, AlignmentType, Footer } from "docx";

// Helper to simple parsing of Markdown-like text to Docx elements
function parseMarkdownToDocx(text: string): Paragraph[] {
    if (!text) return [];

    const lines = text.split('\n');
    const paragraphs: Paragraph[] = [];

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            // Empty line, add spacer
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
            return;
        }

        // Headings
        if (trimmed.startsWith('# ')) {
            paragraphs.push(new Paragraph({
                children: parseBoldText(trimmed.replace('# ', '')),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 }
            }));
            return;
        }
        if (trimmed.startsWith('## ')) {
            paragraphs.push(new Paragraph({
                children: parseBoldText(trimmed.replace('## ', '')),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 }
            }));
            return;
        }
        if (trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
                children: parseBoldText(trimmed.replace('### ', '')),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 120, after: 120 }
            }));
            return;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            paragraphs.push(new Paragraph({
                children: parseBoldText(content),
                bullet: { level: 0 },
                spacing: { after: 50 },
            }));
            return;
        }

        // Regular paragraph (potentially with bold)
        paragraphs.push(new Paragraph({
            children: parseBoldText(trimmed),
            spacing: { after: 120 },
        }));
    });

    return paragraphs;
}

// Helper to parse **bold** text inside a line
function parseBoldText(text: string): TextRun[] {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({
                text: part.slice(2, -2),
                bold: true,
            });
        }
        return new TextRun({ text: part });
    });
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();
        const { id } = await params;

        const proposal = await (prisma.proposal as any).findFirst({
            where: {
                id,
                organizationId: organization.id,
            },
            include: {
                company: true,
                items: {
                    include: {
                        service: true,
                    }
                }
            }
        }) as any;

        if (!proposal) {
            return new NextResponse("Not found", { status: 404 });
        }

        const ownerName = process.env.LICENSE_OWNER_NAME || "VAGELIS NAKIS VCULTURE";
        const ownerVat = process.env.LICENSE_OWNER_VAT || "442323434";

        // Generate DOCX
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Calibri",
                            size: 22, // 11pt
                            color: "000000",
                        },
                        paragraph: {
                            spacing: { line: 276 }, // 1.15 line spacing
                        },
                    },
                    heading1: {
                        run: {
                            size: 32,
                            bold: true,
                            color: "2E74B5",
                            font: "Calibri Light",
                        },
                        paragraph: { spacing: { before: 240, after: 120 } },
                    },
                    heading2: {
                        run: {
                            size: 26,
                            bold: true,
                            color: "2E74B5",
                            font: "Calibri Light",
                        },
                        paragraph: { spacing: { before: 240, after: 120 } },
                    },
                },
            },
            sections: [{
                properties: {},
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                },
                children: [
                    // Header Section
                    new Paragraph({
                        text: ownerName,
                        heading: HeadingLevel.HEADING_1,
                        alignment: "center",
                    }),
                    new Paragraph({
                        text: `VAT: ${ownerVat}`,
                        alignment: "center",
                        spacing: { after: 400 },
                    }),

                    // Proposal Info
                    new Paragraph({
                        text: proposal.title,
                        heading: HeadingLevel.TITLE,
                        spacing: { before: 400, after: 200 },
                    }),

                    new Paragraph({
                        text: "Prepared For:",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 0 },
                    }),
                    new Paragraph({
                        text: proposal.company.name,
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        text: `Date: ${new Date(proposal.createdAt).toLocaleDateString()}`,
                        spacing: { after: 400 },
                    }),

                    // Overview
                    new Paragraph({
                        text: "Overview",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: proposal.shortDescription || "No description provided.",
                        spacing: { after: 200 },
                    }),

                    // Dynamic Content (from AI/Markdown)
                    ...(proposal.content ? [
                        new Paragraph({
                            text: "Details",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 200 },
                        }),
                        ...parseMarkdownToDocx(proposal.content),
                    ] : []),

                    // Services Table Header
                    new Paragraph({
                        text: "Services & Pricing",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 },
                    }),

                    // Services Table
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "Service", style: "Strong", alignment: "center" })], shading: { fill: "F2F2F2" } }),
                                    new TableCell({ children: [new Paragraph({ text: "Qty", style: "Strong", alignment: "center" })], shading: { fill: "F2F2F2" } }),
                                    new TableCell({ children: [new Paragraph({ text: "Price", style: "Strong", alignment: "center" })], shading: { fill: "F2F2F2" } }),
                                    new TableCell({ children: [new Paragraph({ text: "Total", style: "Strong", alignment: "center" })], shading: { fill: "F2F2F2" } }),
                                ],
                            }),
                            ...(Array.isArray(proposal.items) ? proposal.items.map((item: any) =>
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(item.service?.code ? `${item.service.code} - ${item.service.description}` : item.service?.description || "Service")] }),
                                        new TableCell({ children: [new Paragraph({ text: item.quantity?.toString() || "0", alignment: "center" })] }),
                                        new TableCell({ children: [new Paragraph({ text: "$" + (item.price?.toFixed(2) || "0.00"), alignment: "right" })] }),
                                        new TableCell({ children: [new Paragraph({ text: "$" + (item.total?.toFixed(2) || "0.00"), alignment: "right" })] }),
                                    ]
                                })
                            ) : []),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "Total Amount", style: "Strong", alignment: "right" })], columnSpan: 3, shading: { fill: "F2F2F2" } }),
                                    new TableCell({ children: [new Paragraph({ text: "$" + (proposal.totalAmount?.toFixed(2) || "0.00"), style: "Strong", alignment: "right" })], shading: { fill: "F2F2F2" } }),
                                ]
                            })
                        ]
                    }),
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);

        const safeCompanyName = proposal.company.name.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `Proposal-${safeCompanyName}-${proposal.createdAt.toISOString().split('T')[0]}.docx`;

        return new NextResponse(buffer as any, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error("[PROPOSAL_EXPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
