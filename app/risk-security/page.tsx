//@ts-ignore
//@ts-nocheck
"use client";

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
  Fuel,
  LineChartIcon,
  CoinsIcon,
  ShieldIcon,
  AlertCircle,
  ShieldAlert
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/components/ui/use-toast";
import RiskSecuritySearch from "@/components/risk-security-search";
import MultiSearch from "@/components/multi-search";
import { useChat, Message } from "ai/react";
import Marked, { ReactRenderer } from "marked-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "sonner";
import Link from "next/link";
import Latex from "react-latex-next";




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

export default function RiskSecurityPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [updates, setUpdates] = useState<StreamUpdate[]>([]);
  const { toast } = useToast();

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
    maxSteps: 8,
    api: '/api/risk-security',

    body: {
      group: "risk_security",
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


  console.log(messages);

  // Process stream data
  const processStreamData = (data: any) => {
    if (data.type === 'research_update') {
      setUpdates(prev => {
        // Find if update with this ID exists
        const existingIndex = prev.findIndex(u => u.id === data.data.id);
        
        if (existingIndex >= 0) {
          // Update existing
          const newUpdates = [...prev];
          newUpdates[existingIndex] = {
            ...newUpdates[existingIndex],
            ...data.data
          };
          return newUpdates;
        } else {
          // Add new
          return [...prev, data.data];
        }
      });
    }
  };

  // const handleSearch = async () => {
  //   if (!query.trim()) {
  //     toast({
  //       title: "Input required",
  //       description: "Please enter a project name or contract address",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsSearching(true);
  //   setUpdates([]);

  //   try {
  //     const response = await fetch("/api/risk-security", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ query }),
  //     });

  //     if (!response.ok) throw new Error("Failed to analyze");

  //     const reader = response.body?.getReader();
  //     const decoder = new TextDecoder();
  //     let buffer = '';

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;

  //       buffer += decoder.decode(value, { stream: true });
  //       const lines = buffer.split('\n');
        
  //       // Process all complete lines
  //       for (let i = 0; i < lines.length - 1; i++) {
  //         const line = lines[i].trim();
  //         if (!line) continue;
          
  //         try {
  //           const data = JSON.parse(line);
  //           processStreamData(data);
  //         } catch (e) {
  //           console.error('Error parsing line:', line, e);
  //         }
  //       }
        
  //       // Keep the incomplete line in the buffer
  //       buffer = lines[lines.length - 1];
  //     }

  //     // Process any remaining data
  //     if (buffer.trim()) {
  //       try {
  //         const data = JSON.parse(buffer);
  //         processStreamData(data);
  //       } catch (e) {
  //         console.error('Error parsing final buffer:', buffer, e);
  //       }
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to analyze. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  return (
    // <SidebarProvider>
      <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* <AppSidebar /> */}
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-red-500" />
                <h1 className="text-3xl font-bold">Risk & Security Detection</h1>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-3xl">
                Enter a project name or contract address for a comprehensive security analysis. 
                Our AI will scan multiple sources to identify potential risks, vulnerabilities, 
                and security concerns.
              </p>
              
              <Card className="border-2 border-red-100 dark:border-red-900/30 bg-white dark:bg-neutral-800">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter project name or contract address..."
                      value={input}
                      onChange={handleInputChange}
                      className="flex-1"
                      disabled={isSearching}
                    />
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSearching}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isSearching ? (
                        <>Analyzing...</>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>



            {messages.map((message, index) => (
  <div key={index}>

    {message.toolInvocations &&
      message.annotations
        ?.filter((a) => a.type === 'research_update')
        .map((a) => a.data) && (
        <RiskSecuritySearch
          updates={message.annotations
            .filter((a) => a.type === 'research_update')
            .map((a) => a.data)}
        />
      )}

{message.role === "user" && (
      <p className="text-base sm:text-xl font-medium font-sans break-words text-neutral-800 dark:text-neutral-200">
        {message.content}
      </p>
    )}
    {message.role === "assistant" && message.content !== null && (
      <div><MarkdownRenderer content={message.content} /></div>
    )}
  </div>
))}



                
          </main>
        </div>
      </div>
    // </SidebarProvider>
  );
}
