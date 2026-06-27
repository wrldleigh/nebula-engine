import { NextRequest, NextResponse } from "next/server";
import { listItems, addItem } from "@/lib/db";

export async function GET() {
  try {
    const items = await listItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, expiryDate } = body;

    if (!name || !expiryDate) {
      return NextResponse.json(
        { error: "Missing name or expiryDate" },
        { status: 400 }
      );
    }

    const items = await listItems();
    const isDuplicate = items.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.expiry_date === expiryDate
    );

    if (isDuplicate) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    await addItem(name, expiryDate, "gui");
    return NextResponse.json({ success: true, duplicate: false });
  } catch (error) {
    console.error("Error adding item:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}
