    // import 'server-only';
"use server"

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUser(email: string) {
  try {
    return await prisma.user.findMany({
      where: { email },
    });
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

// export async function createUser(email: string, password: string) {
 
//   try {
//     return await prisma.user.create({

//       data: { email, password: hash },
//     });
//   } catch (error) {
//     console.error('Failed to create user in database');
//     throw error;
//   }
// }

// export async function saveChat({
//   id,
//   userId,
//   title,
// }: {
//   id: string;
//   userId: string;
//   title: string;
//   chatType: string;
// }) {
//   try {
//     return await prisma.chat.create({
//       data: {
//         id,
//         userId,
//         title,
//         chatType,
//         createdAt: new Date(),
//       },
//     });
//   } catch (error) {
//     console.error('Failed to save chat in database');
//     throw error;
//   }
// }

// export async function deleteChatById({ id }: { id: string }) {
//   try {
//     await prisma.vote.deleteMany({
//       where: { chatId: id },
//     });
//     await prisma.message.deleteMany({
//       where: { chatId: id },
//     });

//     return await prisma.chat.delete({
//       where: { id },
//     });
//   } catch (error) {
//     console.error('Failed to delete chat by id from database');
//     throw error;
//   }
// }

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await prisma.chat.findFirst({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await prisma.message.createMany({
      data: messages,
    });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

// export async function voteMessage({
//   chatId,
//   messageId,
//   type,
// }: {
//   chatId: string;
//   messageId: string;
//   type: 'up' | 'down';
// }) {
//   try {
//     const existingVote = await prisma.vote.findFirst({
//       where: { messageId, chatId },
//     });

//     if (existingVote) {
//       return await prisma.vote.update({
//         where: { id: existingVote.id },
//         data: { isUpvoted: type === 'up' },
//       });
//     }
//     return await prisma.vote.create({
//       data: {
//         chatId,
//         messageId,
//         isUpvoted: type === 'up',
//       },
//     });
//   } catch (error) {
//     console.error('Failed to upvote message in database', error);
//     throw error;
//   }
// }

// export async function getVotesByChatId({ id }: { id: string }) {
//   try {
//     return await prisma.vote.findMany({
//       where: { chatId: id },
//     });
//   } catch (error) {
//     console.error('Failed to get votes by chat id from database');
//     throw error;
//   }
// }

// export async function saveDocument({
//   id,
//   title,
//   kind,
//   content,
//   userId,
// }: {
//   id: string;
//   title: string;
//   kind: BlockKind;
//   content: string;
//   userId: string;
// }) {
//   try {
//     return await prisma.document.create({
//       data: {
//         id,
//         title,
//         kind,
//         content,
//         userId,
//         createdAt: new Date(),
//       },
//     });
//   } catch (error) {
//     console.error('Failed to save document in database');
//     throw error;
//   }
// }

// export async function getDocumentsById({ id }: { id: string }) {
//   try {
//     return await prisma.document.findMany({
//       where: { id },
//       orderBy: { createdAt: 'asc' },
//     });
//   } catch (error) {
//     console.error('Failed to get document by id from database');
//     throw error;
//   }
// }

// export async function getDocumentById({ id }: { id: string }) {
//   try {
//     return await prisma.document.findUnique({
//       where: { id },
//     });
//   } catch (error) {
//     console.error('Failed to get document by id from database');
//     throw error;
//   }
// }

// export async function deleteDocumentsByIdAfterTimestamp({
//   id,
//   timestamp,
// }: {
//   id: string;
//   timestamp: Date;
// }) {
//   try {
//     await prisma.suggestion.deleteMany({
//       where: {
//         documentId: id,
//         documentCreatedAt: { gt: timestamp },
//       },
//     });

//     return await prisma.document.deleteMany({
//       where: {
//         id,
//         createdAt: { gt: timestamp },
//       },
//     });
//   } catch (error) {
//     console.error(
//       'Failed to delete documents by id after timestamp from database',
//     );
//     throw error;
//   }
// }

// export async function saveSuggestions({
//   suggestions,
// }: {
//   suggestions: Array<Suggestion>;
// }) {
//   try {
//     return await prisma.suggestion.createMany({
//       data: suggestions,
//     });
//   } catch (error) {
//     console.error('Failed to save suggestions in database');
//     throw error;
//   }
// }

// export async function getSuggestionsByDocumentId({
//   documentId,
// }: {
//   documentId: string;
// }) {
//   try {
//     return await prisma.suggestion.findMany({
//       where: { documentId },
//     });
//   } catch (error) {
//     console.error(
//       'Failed to get suggestions by document version from database',
//     );
//     throw error;
//   }
// }

// export async function getMessageById({ id }: { id: string }) {
//   try {
//     return await prisma.message.findUnique({
//       where: { id },
//     });
//   } catch (error) {
//     console.error('Failed to get message by id from database');
//     throw error;
//   }
// }

// export async function deleteMessagesByChatIdAfterTimestamp({
//   chatId,
//   timestamp,
// }: {
//   chatId: string;
//   timestamp: Date;
// }) {
//   try {
//     const messagesToDelete = await prisma.message.findMany({
//       where: {
//         chatId,
//         createdAt: { gte: timestamp },
//       },
//       select: { id: true },
//     });

//     const messageIds = messagesToDelete.map((message) => message.id);

//     if (messageIds.length > 0) {
//       await prisma.vote.deleteMany({
//         where: {
//           chatId,
//           messageId: { in: messageIds },
//         },
//       });

//       return await prisma.message.deleteMany({
//         where: {
//           chatId,
//           id: { in: messageIds },
//         },
//       });
//     }
//   } catch (error) {
//     console.error(
//       'Failed to delete messages by id after timestamp from database',
//     );
//     throw error;
//   }
// }

// export async function updateChatVisibilityById({
//   chatId,
//   visibility,
// }: {
//   chatId: string;
//   visibility: 'private' | 'public';
// }) {
//   try {
//     return await prisma.chat.update({
//       where: { id: chatId },
//       data: { visibility },
//     });
//   } catch (error) {
//     console.error('Failed to update chat visibility in database');
//     throw error;
//   }
// }