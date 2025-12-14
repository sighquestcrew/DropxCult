import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const design = await prisma.design.findUnique({
      where: { id },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, tshirtType, tshirtColor, canvasState, previewImage } = await req.json();

    // Check current status - if already approved, reset to Pending for re-approval
    const existingDesign = await prisma.design.findUnique({ where: { id } });
    const newStatus = existingDesign?.status === "Accepted" ? "Pending" : existingDesign?.status;

    const design = await prisma.design.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tshirtType && { tshirtType }),
        ...(tshirtColor && { tshirtColor }),
        ...(canvasState && { canvasState }),
        ...(previewImage && { previewImage }),
        status: newStatus, // Reset to Pending if was Accepted
      },
    });

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating design:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.design.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }
}
