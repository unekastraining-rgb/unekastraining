import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { buildAnnotatedPdfBuffer } from "@/lib/materials/export-annotated-pdf";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const material = await db.courseMaterial.findFirst({
      where: { id, course: { userId: user.id } },
      include: {
        inkPages: {
          where: { userId: user.id },
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!material?.filePath) {
      return NextResponse.json(
        { success: false, error: "Material file not found." },
        { status: 404 },
      );
    }

    const ext = path.extname(material.filePath).toLowerCase();
    if (ext !== ".pdf") {
      return NextResponse.json(
        { success: false, error: "Annotated export is only available for PDF materials." },
        { status: 400 },
      );
    }

    const pdfBytes = await readFile(material.filePath);
    const annotated = await buildAnnotatedPdfBuffer({
      pdfBytes,
      inkPages: material.inkPages.map((page) => ({
        pageNumber: page.pageNumber,
        strokesJson: page.strokesJson,
      })),
    });

    const filename = `${material.title.replace(/[^\w.-]+/g, "_") || "material"}-annotated.pdf`;

    return new NextResponse(Buffer.from(annotated), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to export annotated PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export annotated PDF." },
      { status: 500 },
    );
  }
}
