import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Clear existing data so we don't get duplicates
    await prisma.product.deleteMany({});

    // 2. Define the DropXCult Collections
    const products = [
      // --- Collection: Four Auspicious Beasts ---
      {
        name: "Azure Dragon of the East",
        slug: "azure-dragon-tee",
        description: "Represents the Wood element and the Spring season. A premium oversized tee featuring the Qinglong in intricate embroidery.",
        price: 1499,
        category: "Four Auspicious Beasts",
        images: ["https://placehold.co/600x600/000000/FFF?text=Azure+Dragon"], // Placeholder for now
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Navy"],
        stock: 50,
        isFeatured: true,
      },
      {
        name: "Vermillion Bird of the South",
        slug: "vermillion-bird-tee",
        description: "Represents Fire and Summer. The Zhuque rises from the flames on this heavyweight cotton tee.",
        price: 1499,
        category: "Four Auspicious Beasts",
        images: ["https://placehold.co/600x600/000000/FF0000?text=Vermillion+Bird"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Red"],
        stock: 45,
        isFeatured: true,
      },
      {
        name: "White Tiger of the West",
        slug: "white-tiger-tee",
        description: "Represents Metal and Autumn. A fierce Baihu design printed on our signature boxy fit tee.",
        price: 1499,
        category: "Four Auspicious Beasts",
        images: ["https://placehold.co/600x600/FFFFFF/000000?text=White+Tiger"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Black"],
        stock: 60,
        isFeatured: false,
      },
      {
        name: "Black Tortoise of the North",
        slug: "black-tortoise-tee",
        description: "Represents Water and Winter. The Xuanwu symbolizes longevity and stability.",
        price: 1499,
        category: "Four Auspicious Beasts",
        images: ["https://placehold.co/600x600/000000/444444?text=Black+Tortoise"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black"],
        stock: 30,
        isFeatured: false,
      },

      // --- Collection: Mythical Beasts ---
      {
        name: "The Minotaur's Labyrinth",
        slug: "minotaur-tee",
        description: "Half man, half bull. A dark, cinematic representation of the Cretan Bull.",
        price: 1299,
        category: "Mythical Beasts",
        images: ["https://placehold.co/600x600/220000/FFFFFF?text=Minotaur"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Maroon"],
        stock: 100,
        isFeatured: true,
      },
      {
        name: "Medusa's Gaze",
        slug: "medusa-tee",
        description: "Don't look directly at it. Stone-cold aesthetics for the modern myth.",
        price: 1299,
        category: "Mythical Beasts",
        images: ["https://placehold.co/600x600/000000/00FF00?text=Medusa"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black"],
        stock: 80,
        isFeatured: false,
      },
    ];

    // 3. Insert into Database
    await prisma.product.createMany({
      data: products
    });

    return NextResponse.json({ message: "Database Seeded Successfully with DropXCult Products!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seeding Failed" }, { status: 500 });
  }
}