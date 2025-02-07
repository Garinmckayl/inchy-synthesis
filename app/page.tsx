"use client";

import { useChat, Message } from "ai/react";
import React, {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useTheme } from "next-themes";
import Image from "next/image";

import {
  ChevronRight,
  Sparkles,
  Twitter,
  Send,
  MessageSquare,
  Crown,
  AlignLeft,
  ArrowRight,
  Book,
  Brain,
  Building,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  Cloud,
  Code,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Film,
  Globe,
  GraduationCap,
  Heart,
  Loader2,
  LucideIcon,
  ArrowUpIcon,
  MapPin,
  Moon,
  Pause,
  Plane,
  Play,
  Plus,
  Search,
  Share2,
  Sun,
  TrendingUp,
  TrendingUpIcon,
  Tv,
  User2,
  Users,
  X,
  YoutubeIcon,
  Zap,
} from "lucide-react";
import { SuggestedQuestions } from "@/components/suggested-questions";
import { Navbar } from "@/components/navbar";
import { PriceChart } from "@/components/price-chart";
import { ResizableSidebar } from "@/components/resizable-sidebar";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import InteractiveStockChart from "@/components/interactive-stock-chart";
import InteractiveCryptoChart from "@/components/interactive-crypto-chart";
import Marked, { ReactRenderer } from "marked-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "sonner";


import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import Latex from "react-latex-next";

import { fetchMetadata, suggestQuestions } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { ToolInvocation } from "ai";

import { cn, SearchGroupId } from "@/lib/utils";
import MultiSearch from "@/components/multi-search";
import { GeistMono } from "geist/font/mono";
import { Textarea } from "@/components/ui/textarea";

import { getChatsByUserId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';





// async function verifyToken() {
//   const url = "/api/verify";
//   const accessToken = await getAccessToken();
//   const result = await fetch(url, {
//     headers: {
//       ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
//     },
//   });

//   return await result.json();
// }

// Generate mock historical data
const generateMockData = () => {
  const data: [string, number][] = [];
  let currentPrice = 2000;
  const now = new Date();

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    data.push([date.toISOString(), currentPrice]);
  }
  return data;
};

const mockMessages = [
  {
    id: "1",
    role: "user",
    content: "How has ETH's price changed over the past year?",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Here's Ethereum's price chart over the past year. The current price is $2,245.67, showing a significant increase of +102.47% from last year. The chart shows several key movements:",
    chart: {
      symbol: "ETH",
      data: generateMockData(),
    },
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!navigator.clipboard) {
          return;
        }
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Copied to clipboard");
      }}
      className="h-8 px-2 text-xs rounded-full"
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

interface MarkdownRendererProps {
  content: string;
}
interface LinkMetadata {
  title: string;
  description: string;
}

interface CitationLink {
  text: string;
  link: string;
}

const isValidUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [metadataCache, setMetadataCache] = useState<
    Record<string, LinkMetadata>
  >({});

  const citationLinks = useMemo<CitationLink[]>(() => {
    return Array.from(content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)).map(
      ([_, text, link]) => ({ text, link })
    );
  }, [content]);

  const fetchMetadataWithCache = useCallback(
    async (url: string) => {
      if (metadataCache[url]) {
        return metadataCache[url];
      }
      const metadata = await fetchMetadata(url);
      if (metadata) {
        setMetadataCache((prev) => ({ ...prev, [url]: metadata }));
      }
      return metadata;
    },
    [metadataCache]
  );

  interface CodeBlockProps {
    language: string | undefined;
    children: string;
  }

  const CodeBlock = React.memo(
    ({ language, children }: CodeBlockProps) => {
      const [isCopied, setIsCopied] = useState(false);
      const { theme } = useTheme();

      const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(children);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }, [children]);

      return (
        <div className="group my-3">
          <div className="grid grid-rows-[auto,1fr] rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="px-2 py-0.5 text-xs font-medium bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 rounded-md border border-neutral-200 dark:border-neutral-700">
                {language || "text"}
              </div>
              <button
                onClick={handleCopy}
                className={`
                    px-2 py-1.5
                    rounded-md text-xs
                    transition-colors duration-200
                    ${
                      isCopied
                        ? "bg-green-500/10 text-green-500"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                    }
                    opacity-0 group-hover:opacity-100
                    hover:bg-neutral-200 dark:hover:bg-neutral-700
                    flex items-center gap-1.5
                  `}
                aria-label={isCopied ? "Copied!" : "Copy code"}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className={`overflow-x-auto ${GeistMono.className}`}>
              <SyntaxHighlighter
                language={language || "text"}
                style={theme === "dark" ? atomDark : vs}
                showLineNumbers
                wrapLines
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  fontSize: "0.875rem",
                  background: theme === "dark" ? "#171717" : "#ffffff",
                  lineHeight: 1.6,
                  borderBottomLeftRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                }}
                lineNumberStyle={{
                  minWidth: "2.5em",
                  paddingRight: "1em",
                  color: theme === "dark" ? "#404040" : "#94a3b8",
                  userSelect: "none",
                }}
                codeTagProps={{
                  style: {
                    color: theme === "dark" ? "#e5e5e5" : "#1e293b",
                    fontFamily: "var(--font-mono)",
                  },
                }}
              >
                {children}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      );
    },
    (prevProps, nextProps) =>
      prevProps.children === nextProps.children &&
      prevProps.language === nextProps.language
  );

  CodeBlock.displayName = "CodeBlock";

  const LinkPreview = ({ href }: { href: string }) => {
    const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
      setIsLoading(true);
      fetchMetadataWithCache(href).then((data) => {
        setMetadata(data);
        setIsLoading(false);
      });
    }, [href]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-500 dark:text-neutral-400" />
        </div>
      );
    }

    const domain = new URL(href).hostname;

    return (
      <div className="flex flex-col space-y-2 bg-white dark:bg-neutral-800 rounded-md shadow-md overflow-hidden">
        <div className="flex items-center space-x-2 p-3 bg-neutral-100 dark:bg-neutral-700">
          <Image
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=256`}
            alt="Favicon"
            width={20}
            height={20}
            className="rounded-sm"
          />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 truncate">
            {domain}
          </span>
        </div>
        <div className="px-3 pb-3">
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">
            {metadata?.title || "Untitled"}
          </h3>
          {metadata?.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
              {metadata.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderHoverCard = (
    href: string,
    text: React.ReactNode,
    isCitation: boolean = false
  ) => {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isCitation
                ? "cursor-help text-sm text-primary py-0.5 px-1.5 m-0 bg-neutral-200 dark:bg-neutral-700 rounded-full no-underline"
                : "text-teal-600 dark:text-teal-400 hover:underline"
            }
          >
            {text}
          </Link>
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="start"
          className="w-80 p-0 shadow-lg"
        >
          <LinkPreview href={href} />
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderer: Partial<ReactRenderer> = {
    text(text: string) {
      if (!text.includes("$")) return text;
      return (
        <Latex
          delimiters={[
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ]}
        >
          {text}
        </Latex>
      );
    },
    paragraph(children) {
      if (typeof children === "string" && children.includes("$")) {
        return (
          <p className="my-4">
            <Latex
              delimiters={[
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
              ]}
            >
              {children}
            </Latex>
          </p>
        );
      }
      return <p className="my-4">{children}</p>;
    },
    code(children, language) {
      return <CodeBlock language={language}>{String(children)}</CodeBlock>;
    },
    link(href, text) {
      const citationIndex = citationLinks.findIndex(
        (link) => link.link === href
      );
      if (citationIndex !== -1) {
        return <sup>{renderHoverCard(href, citationIndex + 1, true)}</sup>;
      }
      return isValidUrl(href) ? (
        renderHoverCard(href, text)
      ) : (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {text}
        </a>
      );
    },
    heading(children, level) {
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      const className = `text-${
        4 - level
      }xl font-bold my-4 text-neutral-800 dark:text-neutral-100`;
      return <HeadingTag className={className}>{children}</HeadingTag>;
    },
    list(children, ordered) {
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag className="list-inside list-disc my-4 pl-4 text-neutral-800 dark:text-neutral-200">
          {children}
        </ListTag>
      );
    },
    listItem(children) {
      return (
        <li className="my-2 text-neutral-800 dark:text-neutral-200">
          {children}
        </li>
      );
    },
    blockquote(children) {
      return (
        <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic my-4 text-neutral-700 dark:text-neutral-300">
          {children}
        </blockquote>
      );
    },
  };

  return (
    <div className="markdown-body dark:text-neutral-200 font-sans">
      <Marked renderer={renderer}>{content}</Marked>
    </div>
  );
};

const StopIcon = ({ size = 16 }: { size?: number }) => {
  return (
      <svg
          height={size}
          viewBox="0 0 16 16"
          width={size}
          style={{ color: "currentcolor" }}
      >
          <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 3H13V13H3V3Z"
              fill="currentColor"
          ></path>
      </svg>
  );
};


export default function Home( {
  // id,
  // initialMessages,
}: {
  // id: string;
  // initialMessages: Array<Message>;

}) {

  const [initialMessages, setInitialMessages] = useState([]);


  console.log(initialMessages, 'initial messages')


  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { login, authenticated, user, logout, ready } = usePrivy();

  

  const [chatID, setChatID] = useState(null);


  useEffect(() => {
    const fetchChats = async () => {
      const response = await fetch(`/api/history?id=${user?.id}`, {
        method: 'GET',

      });
      const chat = await response.json();
      console.log(chat.id, 'chat id')
      setChatID(chat.id);

      setInitialMessages(convertToUIMessages(chat.messages));
     
    };
  
    fetchChats();

    const interval = setInterval(fetchChats, 5000); // Fetch every 5 seconds
  
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [user]); 

  const id = chatID; // Safely access chat.id



  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const {
    isLoading,
    input,
    messages,
    setInput,
    append,
    handleSubmit,
    handleInputChange,
    setMessages,
    reload,
    stop,
  } = useChat({
    id,
    maxSteps: 8,
    initialMessages,
    body: {
      id,
      group: "crypto",
      user: user?.id,
    },
    onFinish: async (message, { finishReason }) => {
      const lastSubmittedQueryRef = input;

      console.log("[finish reason]:", finishReason);
      if (
        (message.content && finishReason === "stop") ||
        finishReason === "length"
      ) {
        const newHistory = [
          ...messages,
          { role: "user", content: input },
          { role: "assistant", content: message.content },
        ];
        const { questions } = await suggestQuestions(newHistory);
        setSuggestedQuestions(questions);

        if (newHistory.length > 5 && !authenticated) {
          // Show the popup or toast notification
          login();
        }
      }
    },
    onError: (error) => {
      console.error("Chat error:", error.cause, error.message);
      // toast.error("An error occurred.", {
      //   description: `Oops! An error occurred while processing your request. ${error.message}`,
      // });
    },
  });

  const handleSuggestedQuestionClick = useCallback(
    async (question: string) => {
    setHasSubmitted(true);
      setSuggestedQuestions([]);

      await append({
        content: question.trim(),
        role: "user",
      });
    },
    [append]
  );

  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      const userId = user?.id;
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      const { sessionId } = await response.json();

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    if (
      // !initializedRef.current && initialState.query && 
      messages.length) {
        // initializedRef.current = true;
        setHasSubmitted(true);
        // console.log("[initial query]:", initialState.query);
        // append({
        //     content: initialState.query,
        //     role: 'user'
        // });
    }
}, [
  // initialState.query, 
  append, setInput, messages.length]);


  const router = useRouter();

  const memoizedMessages = useMemo(() => messages, [messages]);

  return (

    <div className="flex min-h-screen flex-col">
      <Navbar onSubscribe={handleSubscribe}/>
      <SidebarProvider>
        {/* <AppSidebar onSubscribe={handleSubscribe} /> */}
        <SidebarInset>
          <div className=" w-full max-w-[90%] !font-sans sm:max-w-6xl space-y-6 p-0 mx-auto transition-all duration-300">
            {/* <div className="p-4">
              <div className="mb-8">
                <h2 className="mb-2 text-lg font-semibold">Inchy Token</h2>
                <div className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white">
                  <div className="text-2xl font-bold">$0.00123</div>
                  <div className="text-sm">+15.7% (24h)</div>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSubscribe}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Subscribe Now
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Premium Features
                </Button>
                <Link href="https://twitter.com/inchy_ai" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </Button>
                </Link>
                <Link href="https://t.me/inchy_ai" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Telegram
                  </Button>
                </Link>
              </div>
            </div> */}

            {/* Chat Area */}
            <Card className="flex flex-1 flex-col">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {/* {memoizedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <MarkdownRenderer content={message.content} />
                        {message.role === "assistant" &&
                          message.content !== null &&
                          !message.toolInvocations && (
                            <>
                              <div className="flex items-center gap-2">
                                <CopyButton text={message.content} />
                              </div>
                              <div className="mt-4"></div>
                            </>
                          )}

                        {message.toolInvocations && (
                          <ToolInvocationListView
                            toolInvocations={message.toolInvocations}
                          />
                        )}

                        {message.role === "assistant" &&
                          message.content !== null &&
                          !message.toolInvocations && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="size-5 text-primary" />
                                  <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                                    Answer
                                  </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CopyButton text={message.content} />
                                </div>
                              </div>
                              <div>
                                <MarkdownRenderer content={message.content} />
                              </div>
                            </div>
                          )}
                        {message.toolInvocations && (
                          <ToolInvocationListView
                            toolInvocations={message.toolInvocations}
                          />
                        )}
                      </div>
                    </div>
                  ))} */}
                   {!hasSubmitted && (
                        <div className="text-center !font-sans">
                            <h1 className="text-2xl sm:text-4xl mb-6 text-neutral-800 dark:text-neutral-100 font-syne mt-20">
                                What do you want to search <br/> about crypto today?
                            </h1>
                        </div>
                    )}

                  {memoizedMessages.map((message, index) => (
                    <div key={index}>
                      {message.role === "user" && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-start space-x-2 mb-4"
                        >
                          <User2 className="size-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-grow min-w-0">
                            {/* {isEditingMessage && editingMessageIndex === index ? (
                        <form onSubmit={handleMessageUpdate} className="flex items-center space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-grow bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => {
                                    setIsEditingMessage(false)
                                    setEditingMessageIndex(-1)
                                    setInput('')
                                }}
                                disabled={isLoading}
                                className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                            >
                                <X size={16} />
                            </Button>
                            <Button type="submit" size="sm" className="bg-primary text-white">
                                <ArrowRight size={16} />
                            </Button>
                        </form>
                    ) : ( */}
                            <div>
                              <p className="text-base sm:text-xl font-medium font-sans break-words text-neutral-800 dark:text-neutral-200">
                                {message.content}
                              </p>
                              <div className="flex flex-row gap-2">
                                {message.experimental_attachments?.map(
                                  (attachment, attachmentIndex) => (
                                    <div key={attachmentIndex} className="mt-2">
                                      {attachment.contentType!.startsWith(
                                        "image/"
                                      ) && (
                                        <img
                                          src={attachment.url}
                                          alt={
                                            attachment.name ||
                                            `Attachment ${attachmentIndex + 1}`
                                          }
                                          className="max-w-full h-32 object-fill rounded-lg"
                                        />
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            {/* )} */}
                          </div>

                          {/* {!isEditingMessage && index === lastUserMessageIndex && (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMessageEdit(index)}
                            className="ml-2 text-neutral-500 dark:text-neutral-400"
                            disabled={isLoading}
                        >
                            <Edit2 size={16} />
                        </Button>
                    </div>
                )} */}
                        </motion.div>
                      )}
                      {message.role === "assistant" &&
                        message.content !== null &&
                        // !message.toolInvocations && 
                        (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="size-5 text-primary" />
                                <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                                  Answer
                                </h2>
                              </div>
                              <div className="flex items-center gap-2">
                                <CopyButton text={message.content} />
                              </div>
                            </div>
                            <div>
                              <MarkdownRenderer content={message.content} />
                            </div>
                          </div>
                        )}
                      {message.toolInvocations && (
                        <ToolInvocationListView
                          toolInvocations={message.toolInvocations}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {suggestedQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-xl sm:max-w-2xl ml-11 mb-7"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlignLeft className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                      Suggested questions
                    </h2>
                  </div>
                  <div className="space-y-2 flex flex-col">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-fit font-medium rounded-2xl p-1 justify-start text-left h-auto py-2 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 whitespace-normal"
                        onClick={() => handleSuggestedQuestionClick(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2 fixed bottom-4 left-0 right-0 w-full max-w-[90%] sm:max-w-4xl mx-auto">
                  <div className="relative w-full">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about crypto markets..."
                      className="flex py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[56px] max-h-[400px] w-full resize-none rounded-lg overflow-x-hidden text-base leading-relaxed bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:!ring-1 focus:!ring-neutral-300 dark:focus:!ring-neutral-600 px-4 pt-3 pb-5"
                    />

                    
{isLoading ? (
                            <Button
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl"                                   // onClick={(event) => {
                                //     event.preventDefault();
                                //     stop();
                                // }}
                                variant="destructive"
                                disabled={!isLoading}
                            >
                                <StopIcon size={14} />
                            </Button>
                        ) : (
                            <Button
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl"                                type="submit"
                                // disabled={input.length === 0}
                            >
                      <Send className="h-4 w-4" />
                      </Button>
                        )}

                    {/* <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl">
                      <Send className="h-4 w-4" />
                    </Button> */}
                  </div>


                  </div>

  

                </form>


              </div>


            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

const ToolInvocationListView = memo(
  ({ toolInvocations }: { toolInvocations: ToolInvocation[] }) => {
    const renderToolInvocation = useCallback(
      (toolInvocation: ToolInvocation, index: number) => {
        const args = JSON.parse(JSON.stringify(toolInvocation.args));
        const result =
          "result" in toolInvocation
            ? JSON.parse(JSON.stringify(toolInvocation.result))
            : null;

        // if (toolInvocation.toolName === 'x_search') {
        //     if (!result) {
        //         return <SearchLoadingState
        //             icon={XLogo}
        //             text="Searching for latest news..."
        //             color="gray"
        //         />;
        //     }

        //     const PREVIEW_COUNT = 3;

        //     const FullTweetList = memo(() => (
        //         <div className="grid gap-4 p-4 sm:max-w-[500px]">
        //             {result.map((post: XResult, index: number) => (
        //                 <motion.div
        //                     key={post.id}
        //                     initial={{ opacity: 0, y: 20 }}
        //                     animate={{ opacity: 1, y: 0 }}
        //                     transition={{ duration: 0.3, delay: index * 0.1 }}
        //                     className='[&>div]:m-0'
        //                 >
        //                     <Tweet id={post.tweetId} />
        //                 </motion.div>
        //             ))}
        //         </div>
        //     ));

        //     FullTweetList.displayName = 'FullTweetList';

        //     return (
        //         <Card className="w-full my-4 overflow-hidden shadow-none">
        //             <CardHeader className="pb-2 flex flex-row items-center justify-between">
        //                 <div className="flex items-center gap-2">
        //                     <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        //                         <XLogo className="h-4 w-4" />
        //                     </div>
        //                     <div>
        //                         <CardTitle>Latest from X</CardTitle>
        //                         <p className="text-sm text-neutral-500 dark:text-neutral-400">
        //                             {result.length} tweets found
        //                         </p>
        //                     </div>
        //                 </div>
        //             </CardHeader>
        //             <div className="relative">
        //                 <div className="px-4 pb-2 h-72">
        //                     <div className="flex flex-nowrap overflow-x-auto gap-4 no-scrollbar">
        //                         {result.slice(0, PREVIEW_COUNT).map((post: XResult, index: number) => (
        //                             <motion.div
        //                                 key={post.tweetId}
        //                                 className="w-[min(100vw-2rem,320px)] flex-none"
        //                                 initial={{ opacity: 0, y: 20 }}
        //                                 animate={{ opacity: 1, y: 0 }}
        //                                 transition={{ duration: 0.3, delay: index * 0.1 }}
        //                             >
        //                                 <Tweet id={post.tweetId} />
        //                             </motion.div>
        //                         ))}
        //                     </div>
        //                 </div>

        //                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-black pointer-events-none" />

        //                 <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-4 pt-20 bg-gradient-to-t from-white dark:from-black to-transparent">
        //                     <div className="hidden sm:block">
        //                         <Sheet>
        //                             <SheetTrigger asChild>
        //                                 <Button
        //                                     variant="outline"
        //                                     className="gap-2 bg-white dark:bg-black"
        //                                 >
        //                                     <XLogo className="h-4 w-4" />
        //                                     Show all {result.length} tweets
        //                                 </Button>
        //                             </SheetTrigger>
        //                             <SheetContent side="right" className="w-[400px] sm:w-[600px] overflow-y-auto !p-0 !z-[70]">
        //                                 <SheetHeader className='!mt-5 !font-sans'>
        //                                     <SheetTitle className='text-center'>All Tweets</SheetTitle>
        //                                 </SheetHeader>
        //                                 <FullTweetList />
        //                             </SheetContent>
        //                         </Sheet>
        //                     </div>

        //                     <div className="block sm:hidden">
        //                         <Drawer>
        //                             <DrawerTrigger asChild>
        //                                 <Button
        //                                     variant="outline"
        //                                     className="gap-2 bg-white dark:bg-black"
        //                                 >
        //                                     <XLogo className="h-4 w-4" />
        //                                     Show all {result.length} tweets
        //                                 </Button>
        //                             </DrawerTrigger>
        //                             <DrawerContent className="max-h-[85vh] font-sans">
        //                                 <DrawerHeader>
        //                                     <DrawerTitle>All Tweets</DrawerTitle>
        //                                 </DrawerHeader>
        //                                 <div className="overflow-y-auto">
        //                                     <FullTweetList />
        //                                 </div>
        //                             </DrawerContent>
        //                         </Drawer>
        //                     </div>
        //                 </div>
        //             </div>
        //         </Card>
        //     );
        // }

        // if (toolInvocation.toolName === 'academic_search') {
        //     if (!result) {
        //         return <SearchLoadingState
        //             icon={Book}
        //             text="Searching academic papers..."
        //             color="violet"
        //         />;
        //     }

        //     return (
        //         <Card className="w-full my-4 overflow-hidden">
        //             <CardHeader className="pb-2 flex flex-row items-center justify-between">
        //                 <div className="flex items-center gap-2">
        //                     <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center backdrop-blur-sm">
        //                         <Book className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        //                     </div>
        //                     <div>
        //                         <CardTitle>Academic Papers</CardTitle>
        //                         <p className="text-sm text-muted-foreground">Found {result.results.length} papers</p>
        //                     </div>
        //                 </div>
        //             </CardHeader>
        //             <div className="px-4 pb-2">
        //                 <div className="flex overflow-x-auto gap-4 no-scrollbar">
        //                     {result.results.map((paper: AcademicResult, index: number) => (
        //                         <motion.div
        //                             key={paper.url || index}
        //                             className="w-[400px] flex-none"
        //                             initial={{ opacity: 0, y: 20 }}
        //                             animate={{ opacity: 1, y: 0 }}
        //                             transition={{ duration: 0.3, delay: index * 0.1 }}
        //                         >
        //                             <div className="h-[300px] relative group">
        //                                 <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        //                                 <div className="h-full relative backdrop-blur-sm bg-background/95 dark:bg-neutral-900/95 border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl p-4 flex flex-col transition-all duration-500 group-hover:border-violet-500/20">
        //                                     <h3 className="font-semibold text-xl tracking-tight mb-3 line-clamp-2 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-300">
        //                                         {paper.title}
        //                                     </h3>

        //                                     {paper.author && (
        //                                         <div className="mb-3">
        //                                             <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground bg-neutral-100 dark:bg-neutral-800 rounded-md">
        //                                                 <User2 className="h-3.5 w-3.5 text-violet-500" />
        //                                                 <span className="line-clamp-1">
        //                                                     {paper.author.split(';')
        //                                                         .slice(0, 2)
        //                                                         .join(', ') +
        //                                                         (paper.author.split(';').length > 2 ? ' et al.' : '')
        //                                                     }
        //                                                 </span>
        //                                             </div>
        //                                         </div>
        //                                     )}

        //                                     {paper.publishedDate && (
        //                                         <div className="mb-4">
        //                                             <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground bg-neutral-100 dark:bg-neutral-800 rounded-md">
        //                                                 <Calendar className="h-3.5 w-3.5 text-violet-500" />
        //                                                 {new Date(paper.publishedDate).toLocaleDateString()}
        //                                             </div>
        //                                         </div>
        //                                     )}

        //                                     <div className="flex-1 relative mb-4 pl-3">
        //                                         <div className="absolute -left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-violet-500 via-violet-400 to-transparent opacity-50" />
        //                                         <p className="text-sm text-muted-foreground line-clamp-4">
        //                                             {paper.summary}
        //                                         </p>
        //                                     </div>

        //                                     <div className="flex gap-2">
        //                                         <Button
        //                                             variant="ghost"
        //                                             onClick={() => window.open(paper.url, '_blank')}
        //                                             className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 group/btn"
        //                                         >
        //                                             <FileText className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
        //                                             View Paper
        //                                         </Button>

        //                                         {paper.url.includes('arxiv.org') && (
        //                                             <Button
        //                                                 variant="ghost"
        //                                                 onClick={() => window.open(paper.url.replace('abs', 'pdf'), '_blank')}
        //                                                 className="bg-neutral-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 group/btn"
        //                                             >
        //                                                 <Download className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-300" />
        //                                             </Button>
        //                                         )}
        //                                     </div>
        //                                 </div>
        //                             </div>
        //                         </motion.div>
        //                     ))}
        //                 </div>
        //             </div>
        //         </Card>
        //     );
        // }

        // if (toolInvocation.toolName === "text_search") {
        //   if (!result) {
        //     return (
        //       <div className="flex items-center justify-between w-full">
        //         <div className="flex items-center gap-2">
        //           <MapPin className="h-5 w-5 text-neutral-700 dark:text-neutral-300 animate-pulse" />
        //           <span className="text-neutral-700 dark:text-neutral-300 text-lg">
        //             Searching places...
        //           </span>
        //         </div>
        //         <motion.div className="flex space-x-1">
        //           {[0, 1, 2].map((index) => (
        //             <motion.div
        //               key={index}
        //               className="w-2 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full"
        //               initial={{ opacity: 0.3 }}
        //               animate={{ opacity: 1 }}
        //               transition={{
        //                 repeat: Infinity,
        //                 duration: 0.8,
        //                 delay: index * 0.2,
        //                 repeatType: "reverse",
        //               }}
        //             />
        //           ))}
        //         </motion.div>
        //       </div>
        //     );
        //   }

        //   const centerLocation = result.results[0]?.geometry?.location;
        //   return (
        //     <MapContainer
        //       title="Search Results"
        //       center={centerLocation}
        //       places={result.results.map((place: any) => ({
        //         name: place.name,
        //         location: place.geometry.location,
        //         vicinity: place.formatted_address,
        //       }))}
        //     />
        //   );
        // }

        // if (toolInvocation.toolName === 'currency_converter') {
        //     return <CurrencyConverter toolInvocation={toolInvocation} result={result} />;
        // }

        if (toolInvocation.toolName === "stock_chart") {
          return (
            <div className="flex flex-col gap-3 w-full mt-4">
              <Badge
                variant="secondary"
                className={cn(
                  "w-fit flex items-center gap-3 px-4 py-2 rounded-full transition-colors duration-200",
                  !result
                    ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "bg-green-50/50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                )}
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="font-medium">{args.title}</span>
                {!result ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Badge>

              {result?.chart && (
                <div className="w-full">
                  <InteractiveStockChart
                    title={args.title}
                    chart={{
                      ...result.chart,
                      x_scale: "datetime",
                    }}
                    data={result.chart.elements}
                  />
                </div>
              )}
            </div>
          );
        }

        if (toolInvocation.toolName === "crypto_chart") {
          return (
            <div className="flex flex-col gap-3 w-full mt-4">
              <Badge
                variant="secondary"
                className={cn(
                  "w-fit flex items-center gap-3 px-4 py-2 rounded-full transition-colors duration-200",
                  !result
                    ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "bg-green-50/50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                )}
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="font-medium">{args.title}</span>
                {!result ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Badge>

              {result?.chart && (
                <div className="w-full">
                  <InteractiveCryptoChart
                    title={args.title}
                    chart={{
                      ...result.chart,
                      x_scale: "datetime",
                    }}
                    data={result.chart.elements}
                  />
                </div>
              )}
            </div>
          );
        }

        // if (toolInvocation.toolName === "code_interpreter") {
        //     return (
        //         <div className="space-y-6">
        //             <CollapsibleSection
        //                 code={args.code}
        //                 output={result?.message}
        //                 language="python"
        //                 title={args.title}
        //                 icon={args.icon || 'default'}
        //                 status={result ? 'completed' : 'running'}
        //             />

        //             {result?.chart && (
        //                 <div className="pt-1">
        //                     <InteractiveChart chart={result.chart} />
        //                 </div>
        //             )}
        //         </div>
        //     );
        // }

        if (toolInvocation.toolName === "web_search") {
          return (
            <div className="mt-4">
              <MultiSearch result={result} args={args} />
            </div>
          );
        }

        // if (toolInvocation.toolName === 'retrieve') {
        //     if (!result) {
        //         return (
        //             <div className="border border-neutral-200 rounded-xl my-4 p-4 dark:border-neutral-800 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/90">
        //                 <div className="flex items-center gap-4">
        //                     <div className="relative w-10 h-10">
        //                         <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-lg" />
        //                         <Globe className="h-5 w-5 text-primary/70 absolute inset-0 m-auto" />
        //                     </div>
        //                     <div className="space-y-2 flex-1">
        //                         <div className="h-4 w-36 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md" />
        //                         <div className="space-y-1.5">
        //                             <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md" />
        //                             <div className="h-3 w-2/3 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md" />
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //         );
        //     }

        //     return (
        //         <div className="border border-neutral-200 rounded-xl my-4 overflow-hidden dark:border-neutral-800 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/90">
        //             <div className="p-4">
        //                 <div className="flex items-start gap-4">
        //                     <div className="relative w-10 h-10 flex-shrink-0">
        //                         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg" />
        //                         <img
        //                             className="h-5 w-5 absolute inset-0 m-auto"
        //                             src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(result.results[0].url)}`}
        //                             alt=""
        //                         />
        //                     </div>
        //                     <div className="flex-1 min-w-0 space-y-2">
        //                         <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
        //                             {result.results[0].title}
        //                         </h2>
        //                         <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
        //                             {result.results[0].description}
        //                         </p>
        //                         <div className="flex items-center gap-3">
        //                             <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
        //                                 {result.results[0].language || 'Unknown'}
        //                             </span>
        //                             <a
        //                                 href={result.results[0].url}
        //                                 target="_blank"
        //                                 rel="noopener noreferrer"
        //                                 className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary transition-colors"
        //                             >
        //                                 <ExternalLink className="h-3 w-3" />
        //                                 View source
        //                             </a>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>

        //             <div className="border-t border-neutral-200 dark:border-neutral-800">
        //                 <details className="group">
        //                     <summary className="w-full px-4 py-2 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between">
        //                         <div className="flex items-center gap-2">
        //                             <TextIcon className="h-4 w-4 text-neutral-400" />
        //                             <span>View content</span>
        //                         </div>
        //                         <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        //                     </summary>
        //                     <div className="max-h-[50vh] overflow-y-auto p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
        //                         <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
        //                             <ReactMarkdown>{result.results[0].content}</ReactMarkdown>
        //                         </div>
        //                     </div>
        //                 </details>
        //             </div>
        //         </div>
        //     );
        // }

        return null;
      },
      []
    );

    return toolInvocations.map(
      (toolInvocation: ToolInvocation, toolIndex: number) => (
        <div key={`tool-${toolIndex}`}>
          {renderToolInvocation(toolInvocation, toolIndex)}
        </div>
      )
    );
  },
  (prevProps, nextProps) => {
    return prevProps.toolInvocations === nextProps.toolInvocations;
  }
);

ToolInvocationListView.displayName = "ToolInvocationListView";
