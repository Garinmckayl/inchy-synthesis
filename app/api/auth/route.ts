import { NextResponse } from "next/server";
import prisma from "@lib/prisma"; // Adjust the import path to your Prisma client

export async function POST(request: Request) {
  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json(
      { error: "User ID and email are required" },
      { status: 400 }
    );
  }

  // Check if the user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (existingUser) {
    return NextResponse.json({
      message: "User already exists",
      user: existingUser,
    });
  }

  // Create a new user if they do not exist
  const newUser = await prisma.user.create({
    data: {
      id: userId,
      email: email,
      // Add other user fields as necessary
    },
  });

  return NextResponse.json({
    message: "User created successfully",
    user: newUser,
  });
}
