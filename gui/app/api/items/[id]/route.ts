import { NextRequest, NextResponse } from "next/server";
import { updateItem, deleteItem } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: `Invalid item ID: ${idStr}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, expiryDate } = body;

    if (!name || !expiryDate) {
      return NextResponse.json(
        { error: "Missing name or expiryDate" },
        { status: 400 }
      );
    }

    const expiryDateObj = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDateObj < today) {
      return NextResponse.json(
        { error: "Date cannot be in the past" },
        { status: 400 }
      );
    }

    await updateItem(id, name, expiryDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error updating item:", errorMsg);
    return NextResponse.json(
      { error: `Failed to update item: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: `Invalid item ID: ${idStr}` },
        { status: 400 }
      );
    }

    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error deleting item:", errorMsg);
    return NextResponse.json(
      { error: `Failed to delete item: ${errorMsg}` },
      { status: 500 }
    );
  }
}
