"use client";

import { Button } from "@/components/ui/button";

const questions = [
  "What's the current price of Bitcoin?",
  "Show me the top 5 DeFi tokens by market cap",
  "What's the 24h volume of Ethereum?",
  "Show me tokens with >50% gains today",
];

export function SuggestedQuestions({
  onSelectQuestion,
}: {
  onSelectQuestion: (question: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {questions.map((question) => (
        <Button
          key={question}
          variant="outline"
          className="h-auto justify-start p-2 text-left text-xs"
          onClick={() => onSelectQuestion(question)}
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
