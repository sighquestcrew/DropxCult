import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, name, tshirtType, tshirtColor, garmentType, canvasState, previewImage } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const design = await prisma.design.create({
      data: {
        userId,
        name: name || 'Untitled Design',
        tshirtType,
        tshirtColor,
        garmentType: garmentType || 'T-Shirt', // T-Shirt or Hoodie
        canvasState,
        previewImage,
      },
    });

    return NextResponse.json(design, { status: 201 });
  } catch (error) {
    console.error('Error creating design:', error);
    return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const designs = await prisma.design.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}
