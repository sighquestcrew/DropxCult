
import prisma from "@/lib/prisma";

async function check() {
    const product = await prisma.product.findFirst({
        where: { name: "DIGITAL" }
    });

    if (!product) {
        console.log("Product DIGITAL not found");
        return;
    }

    console.log("Product:", product.id, "Stock:", product.stock);

    const campaign = await prisma.preOrderCampaign.findFirst({
        where: { productId: product.id }
    });

    console.log("Campaign:", campaign);
}

check();
