// /app/api/chat/route.ts
import { getGroupConfig } from '@/app/actions';
import {openai} from '@ai-sdk/openai'
import CodeInterpreter from '@e2b/code-interpreter';
import FirecrawlApp from '@mendable/firecrawl-js';
import { tavily } from '@tavily/core';
import {
    convertToCoreMessages,
    smoothStream,
    streamText,
    tool,
    createDataStreamResponse,
    wrapLanguageModel,
    extractReasoningMiddleware,
    generateObject,
    NoSuchToolError
} from 'ai';
import Exa from 'exa-js';
import { z } from 'zod';
import MemoryClient from 'mem0ai';


// Allow streaming responses up to 600 seconds
export const maxDuration = 600;




function sanitizeUrl(url: string): string {
    return url.replace(/\s+/g, '%20');
}

async function isValidImageUrl(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
        });

        clearTimeout(timeout);

        return response.ok && (response.headers.get('content-type')?.startsWith('image/') ?? false);
    } catch {
        return false;
    }
}


const extractDomain = (url: string): string => {
    const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;
    return url.match(urlPattern)?.[1] || url;
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
    const seenDomains = new Set<string>();
    const seenUrls = new Set<string>();

    return items.filter(item => {
        const domain = extractDomain(item.url);
        const isNewUrl = !seenUrls.has(item.url);
        const isNewDomain = !seenDomains.has(domain);

        if (isNewUrl && isNewDomain) {
            seenUrls.add(item.url);
            seenDomains.add(domain);
            return true;
        }
        return false;
    });
};

// Modify the POST function to use the new handler
export async function POST(req: Request) {
    console.log(req)
    const { messages } = await req.json();
    const { systemPrompt, tools: activeTools } = await getGroupConfig("risk_security");

    console.log(messages);


    return createDataStreamResponse({
        execute: async (dataStream) => {
            const result = streamText({
                model: openai("gpt-3.5-turbo"),
                maxSteps: 5,
                providerOptions: {
                    anthropic: {
                        thinking: {
                            type:  "enabled",
                            budgetTokens: 12000
                        }
                    }
                },
                messages: messages,
                temperature: 0,
                experimental_transform: smoothStream({
                    chunking: 'word',
                    delayInMs: 15,
                }),
                experimental_activeTools: [...activeTools],
                system: systemPrompt,
                tools: {
                    // web_search: tool({
                    //     description: 'Search the web for information with multiple queries, max results and search depth.',
                    //     parameters: z.object({
                    //         queries: z.array(z.string().describe('Array of search queries to look up on the web.')),
                    //         maxResults: z.array(
                    //             z.number().describe('Array of maximum number of results to return per query.').default(10),
                    //         ),
                    //         topics: z.array(
                    //             z.enum(['general', 'news']).describe('Array of topic types to search for.').default('general'),
                    //         ),
                    //         searchDepth: z.array(
                    //             z.enum(['basic', 'advanced']).describe('Array of search depths to use.').default('basic'),
                    //         ),
                    //         exclude_domains: z
                    //             .array(z.string())
                    //             .describe('A list of domains to exclude from all search results.')
                    //             .default([]),
                    //     }),
                    //     execute: async ({
                    //         queries,
                    //         maxResults,
                    //         topics,
                    //         searchDepth,
                    //         exclude_domains,
                    //     }: {
                    //         queries: string[];
                    //         maxResults: number[];
                    //         topics: ('general' | 'news')[];
                    //         searchDepth: ('basic' | 'advanced')[];
                    //         exclude_domains?: string[];
                    //     }) => {
                    //         const apiKey = process.env.TAVILY_API_KEY;
                    //         const tvly = tavily({ apiKey });
                    //         const includeImageDescriptions = true;

                    //         console.log('Queries:', queries);
                    //         console.log('Max Results:', maxResults);
                    //         console.log('Topics:', topics);
                    //         console.log('Search Depths:', searchDepth);
                    //         console.log('Exclude Domains:', exclude_domains);

                    //         // Execute searches in parallel
                    //         const searchPromises = queries.map(async (query, index) => {
                    //             const data = await tvly.search(query, {
                    //                 topic: topics[index] || topics[0] || 'general',
                    //                 days: topics[index] === 'news' ? 7 : undefined,
                    //                 maxResults: maxResults[index] || maxResults[0] || 10,
                    //                 searchDepth: searchDepth[index] || searchDepth[0] || 'basic',
                    //                 includeAnswer: true,
                    //                 includeImages: true,
                    //                 includeImageDescriptions: includeImageDescriptions,
                    //                 excludeDomains: exclude_domains,
                    //             });

                    //             // Add annotation for query completion
                    //             dataStream.writeMessageAnnotation({
                    //                 type: 'query_completion',
                    //                 data: {
                    //                     query,
                    //                     index,
                    //                     total: queries.length,
                    //                     status: 'completed',
                    //                     resultsCount: data.results.length,
                    //                     imagesCount: data.images.length
                    //                 }
                    //             });

                    //             return {
                    //                 query,
                    //                 results: deduplicateByDomainAndUrl(data.results).map((obj: any) => ({
                    //                     url: obj.url,
                    //                     title: obj.title,
                    //                     content: obj.content,
                    //                     raw_content: obj.raw_content,
                    //                     published_date: topics[index] === 'news' ? obj.published_date : undefined,
                    //                 })),
                    //                 images: includeImageDescriptions
                    //                     ? await Promise.all(
                    //                         deduplicateByDomainAndUrl(data.images).map(
                    //                             async ({ url, description }: { url: string; description?: string }) => {
                    //                                 const sanitizedUrl = sanitizeUrl(url);
                    //                                 const isValid = await isValidImageUrl(sanitizedUrl);
                    //                                 return isValid
                    //                                     ? {
                    //                                         url: sanitizedUrl,
                    //                                         description: description ?? '',
                    //                                     }
                    //                                     : null;
                    //                             },
                    //                         ),
                    //                     ).then((results) =>
                    //                         results.filter(
                    //                             (image): image is { url: string; description: string } =>
                    //                                 image !== null &&
                    //                                 typeof image === 'object' &&
                    //                                 typeof image.description === 'string' &&
                    //                                 image.description !== '',
                    //                         ),
                    //                     )
                    //                     : await Promise.all(
                    //                         deduplicateByDomainAndUrl(data.images).map(async ({ url }: { url: string }) => {
                    //                             const sanitizedUrl = sanitizeUrl(url);
                    //                             return (await isValidImageUrl(sanitizedUrl)) ? sanitizedUrl : null;
                    //                         }),
                    //                     ).then((results) => results.filter((url) => url !== null) as string[]),
                    //             };
                    //         });

                    //         const searchResults = await Promise.all(searchPromises);

                    //         return {
                    //             searches: searchResults,
                    //         };
                    //     },
                    // }),
                    reason_search: tool({
                        description: 'Perform a reasoned web search with multiple steps and sources.',
                        parameters: z.object({
                            topic: z.string().describe('The main topic or question to research'),
                            depth: z.enum(['basic', 'advanced']).describe('Search depth level').default('basic'),
                        }),
                        execute: async ({ topic, depth }: { topic: string; depth: 'basic' | 'advanced' }) => {
                            const apiKey = process.env.TAVILY_API_KEY;
                            const tvly = tavily({ apiKey });

                            // Send initial plan status update (without steps count and extra details)
                            dataStream.writeMessageAnnotation({
                                type: 'research_update',
                                data: {
                                    id: 'research-plan-initial', // unique id for the initial state
                                    type: 'plan',
                                    status: 'running',
                                    title: 'Research Plan',
                                    message: 'Creating research plan...',
                                    timestamp: Date.now(),
                                    overwrite: true
                                }
                            });

                            // Now generate the research plan
                            const { object: researchPlan } = await generateObject({
                                model: openai("gpt-3.5-turbo"),
                                temperature: 0,
                                schema: z.object({
                                    search_queries: z.array(z.object({
                                        query: z.string(),
                                        rationale: z.string(),
                                        source: z.enum(['web', 'academic', 'both']),
                                        priority: z.number().min(1).max(5)
                                    })).max(12),
                                    required_analyses: z.array(z.object({
                                        type: z.string(),
                                        description: z.string(),
                                        importance: z.number().min(1).max(5)
                                    })).max(8)
                                }),
                                prompt: `Create a focused research plan for the specific crypto and Web3 project: "${topic}".

                                        Today's date and day of the week: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

                                        Keep the plan concise but comprehensive, tailored for retail and trading firms, with:
                                        - 4-12 targeted search queries (each can use web, academic, or both sources)
                                        - 2-8 key analyses to perform (focus on tokenomics, technology, team, community sentiment, and potential risks/rewards for trading)
                                        - Prioritize the most important aspects to investigate for trading decisions.

                                        Do not use floating numbers, use whole numbers only in the priority field!!
                                        Do not keep the numbers too low or high, make them reasonable in between.
                                        Do not use 0 or 1 in the priority field, use numbers between 2 and 4.

                                        Consider different angles and potential controversies specific to crypto and Web3, including regulatory risks, smart contract vulnerabilities, and market volatility, but maintain focus on the core aspects relevant to trading.
                                        Ensure the total number of steps (searches + analyses) does not exceed 20.`
                            });

                            // Generate IDs for all steps based on the plan
                            const generateStepIds = (plan: typeof researchPlan) => {
                                // Generate an array of search steps.
                                const searchSteps = plan.search_queries.flatMap((query, index) => {
                                    if (query.source === 'both') {
                                        return [
                                            { id: `search-web-${index}`, type: 'web', query },
                                            { id: `search-academic-${index}`, type: 'academic', query }
                                        ];
                                    }
                                    const searchType = query.source === 'academic' ? 'academic' : 'web';
                                    return [{ id: `search-${searchType}-${index}`, type: searchType, query }];
                                });

                                // Generate an array of analysis steps.
                                const analysisSteps = plan.required_analyses.map((analysis, index) => ({
                                    id: `analysis-${index}`,
                                    type: 'analysis',
                                    analysis
                                }));

                                return {
                                    planId: 'research-plan',
                                    searchSteps,
                                    analysisSteps
                                };
                            };

                            const stepIds = generateStepIds(researchPlan);
                            let completedSteps = 0;
                            const totalSteps = stepIds.searchSteps.length + stepIds.analysisSteps.length;

                            // Complete plan status
                            dataStream.writeMessageAnnotation({
                                type: 'research_update',
                                data: {
                                    id: stepIds.planId,
                                    type: 'plan',
                                    status: 'completed',
                                    title: 'Research Plan',
                                    plan: researchPlan,
                                    totalSteps: totalSteps,
                                    message: 'Research plan created',
                                    timestamp: Date.now(),
                                    overwrite: true
                                }
                            });

                            // Execute searches
                            const searchResults = [];
                            let searchIndex = 0;  // Add index tracker

                            for (const step of stepIds.searchSteps) {
                                // Send running annotation for this search step
                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: step.id,
                                        type: step.type,
                                        status: 'running',
                                        title: step.type === 'web'
                                            ? `Searching the web for "${step.query.query}"`
                                            : step.type === 'academic'
                                                ? `Searching white papers for "${step.query.query}"`
                                                : `Analyzing ${step.query.query}`,
                                        query: step.query.query,
                                        message: `Searching ${step.query.source} sources...`,
                                        timestamp: Date.now()
                                    }
                                });

                                if (step.type === 'web') {
                                    const webResults = await tvly.search(step.query.query, {
                                        searchDepth: depth,
                                        includeAnswer: true,
                                        maxResults: Math.min(6 - step.query.priority, 10)
                                    });
                                    console.log(webResults, 'web results');

                                    searchResults.push({
                                        type: 'web',
                                        query: step.query,
                                        results: webResults.results.map(r => ({
                                            source: 'web',
                                            title: r.title,
                                            url: r.url,
                                            content: r.content
                                        }))
                                    });
                                    completedSteps++;
                                } else if (step.type === 'academic') {
                                    // const academicResults = await exa.searchAndContents(step.query.query, {
                                    //     type: 'auto',
                                    //     numResults: Math.min(6 - step.query.priority, 5),
                                    //     category: 'research paper',
                                    //     summary: true
                                    // }); 

                                    // searchResults.push({
                                    //     type: 'academic',
                                    //     query: step.query,
                                    //     results: academicResults.results.map(r => ({
                                    //         source: 'academic',
                                    //         title: r.title || '',
                                    //         url: r.url || '',
                                    //         content: r.summary || ''
                                    //     }))
                                    // });
                                    // completedSteps++;
                                }

                                // Send completed annotation for the search step
                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: step.id,
                                        type: step.type,
                                        status: 'completed',
                                        title: step.type === 'web'
                                            ? `Searched the web for "${step.query.query}"`
                                            : step.type === 'academic'
                                                ? `Searched white papers for "${step.query.query}"`
                                                : `Analysis of ${step.query.query} complete`,
                                        query: step.query.query,
                                        results: searchResults[searchResults.length - 1].results.map(r => {
                                            return { ...r };
                                        }),
                                        message: `Found ${searchResults[searchResults.length - 1].results.length} results`,
                                        timestamp: Date.now(),
                                        overwrite: true
                                    }
                                });

                                searchIndex++;  // Increment index
                            }

                            // Perform analyses
                            let analysisIndex = 0;  // Add index tracker

                            for (const step of stepIds.analysisSteps) {
                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: step.id,
                                        type: 'analysis',
                                        status: 'running',
                                        title: `Analyzing ${step.analysis.type}`,
                                        analysisType: step.analysis.type,
                                        message: `Analyzing ${step.analysis.type}...`,
                                        timestamp: Date.now()
                                    }
                                });

                                const { object: analysisResult } = await generateObject({
                                    model: openai("gpt-3.5-turbo"),
                                    temperature: 0.5,
                                    schema: z.object({
                                        findings: z.array(z.object({
                                            insight: z.string(),
                                            evidence: z.array(z.string()),
                                            confidence: z.number().min(0).max(1)
                                        })),
                                        implications: z.array(z.string()),
                                        limitations: z.array(z.string())
                                    }),
                                    prompt: `Perform a ${step.analysis.type} analysis on the search results. ${step.analysis.description}
                                        Consider all sources and their reliability.
                                        Search results: ${JSON.stringify(searchResults)}`
                                });

                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: step.id,
                                        type: 'analysis',
                                        status: 'completed',
                                        title: `Analysis of ${step.analysis.type} complete`,
                                        analysisType: step.analysis.type,
                                        findings: analysisResult.findings,
                                        message: `Analysis complete`,
                                        timestamp: Date.now(),
                                        overwrite: true
                                    }
                                });

                                analysisIndex++;  // Increment index
                            }

                            // After all analyses are complete, send running state for gap analysis
                            dataStream.writeMessageAnnotation({
                                type: 'research_update',
                                data: {
                                    id: 'gap-analysis',
                                    type: 'analysis',
                                    status: 'running',
                                    title: 'Research Gaps and Limitations',
                                    analysisType: 'gaps',
                                    message: 'Analyzing research gaps and limitations...',
                                    timestamp: Date.now()
                                }
                            });

                            // After all analyses are complete, analyze limitations and gaps
                            const { object: gapAnalysis } = await generateObject({
                                model: openai("gpt-3.5-turbo"),
                                temperature: 0,
                                schema: z.object({
                                    limitations: z.array(z.object({
                                        type: z.string(),
                                        description: z.string(),
                                        severity: z.number().min(2).max(10),
                                        potential_solutions: z.array(z.string())
                                    })),
                                    knowledge_gaps: z.array(z.object({
                                        topic: z.string(),
                                        reason: z.string(),
                                        additional_queries: z.array(z.string())
                                    })),
                                    recommended_followup: z.array(z.object({
                                        action: z.string(),
                                        rationale: z.string(),
                                        priority: z.number().min(2).max(10)
                                    }))
                                }),
                                prompt: `Analyze the research results and identify limitations, knowledge gaps, and recommended follow-up actions.
                                    Consider:
                                    - Quality and reliability of sources
                                    - Missing perspectives or data
                                    - Areas needing deeper investigation
                                    - Potential biases or conflicts
                                    - Severity should be between 2 and 10
                                    - Knowledge gaps should be between 2 and 10
                                    - Do not keep the numbers too low or high, make them reasonable in between
                                    
                                    Research results: ${JSON.stringify(searchResults)}
                                    Analysis findings: ${JSON.stringify(stepIds.analysisSteps.map(step => ({
                                    type: step.analysis.type,
                                    description: step.analysis.description,
                                    importance: step.analysis.importance
                                })))}`
                            });

                            // Send gap analysis update
                            dataStream.writeMessageAnnotation({
                                type: 'research_update',
                                data: {
                                    id: 'gap-analysis',
                                    type: 'analysis',
                                    status: 'completed',
                                    title: 'Research Gaps and Limitations',
                                    analysisType: 'gaps',
                                    findings: gapAnalysis.limitations.map(l => ({
                                        insight: l.description,
                                        evidence: l.potential_solutions,
                                        confidence: (6 - l.severity) / 5
                                    })),
                                    gaps: gapAnalysis.knowledge_gaps,
                                    recommendations: gapAnalysis.recommended_followup,
                                    message: `Identified ${gapAnalysis.limitations.length} limitations and ${gapAnalysis.knowledge_gaps.length} knowledge gaps`,
                                    timestamp: Date.now(),
                                    overwrite: true,
                                    completedSteps: completedSteps + 1,
                                    totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1)
                                }
                            });

                            let synthesis;

                            // If there are significant gaps and depth is 'advanced', perform additional research
                            if (depth === 'advanced' && gapAnalysis.knowledge_gaps.length > 0) {
                                const additionalQueries = gapAnalysis.knowledge_gaps.flatMap(gap =>
                                    gap.additional_queries.map(query => ({
                                        query,
                                        rationale: gap.reason,
                                        source: 'both' as const,
                                        priority: 3
                                    }))
                                );

                                // Execute additional searches for gaps
                                for (const query of additionalQueries) {
                                    // Generate a unique ID for this gap search
                                    const gapSearchId = `gap-search-${searchIndex++}`;

                                    // Send running annotation for this gap search
                                    dataStream.writeMessageAnnotation({
                                        type: 'research_update',
                                        data: {
                                            id: gapSearchId,
                                            type: 'web',
                                            status: 'running',
                                            title: `Additional search for "${query.query}"`,
                                            query: query.query,
                                            message: `Searching to fill knowledge gap: ${query.rationale}`,
                                            timestamp: Date.now()
                                        }
                                    });

                                    // Execute web search
                                    const webResults = await tvly.search(query.query, {
                                        searchDepth: depth,
                                        includeAnswer: true,
                                        maxResults: 5
                                    });

                                    // Add to search results
                                    searchResults.push({
                                        type: 'web',
                                        query: {
                                            query: query.query,
                                            rationale: query.rationale,
                                            source: 'web',
                                            priority: query.priority
                                        },
                                        results: webResults.results.map(r => ({
                                            source: 'web',
                                            title: r.title,
                                            url: r.url,
                                            content: r.content
                                        }))
                                    });

                                    // Send completed annotation for web search
                                    dataStream.writeMessageAnnotation({
                                        type: 'research_update',
                                        data: {
                                            id: gapSearchId,
                                            type: 'web',
                                            status: 'completed',
                                            title: `Additional web search for "${query.query}"`,
                                            query: query.query,
                                            results: webResults.results.map(r => ({
                                                source: 'web',
                                                title: r.title,
                                                url: r.url,
                                                content: r.content
                                            })),
                                            message: `Found ${webResults.results.length} results`,
                                            timestamp: Date.now(),
                                            overwrite: true
                                        }
                                    });

                                    // For 'both' source type, also do academic search
                                    if (query.source === 'both') {
                                        const academicSearchId = `gap-search-academic-${searchIndex++}`;

                                        // Send running annotation for academic search
                                        dataStream.writeMessageAnnotation({
                                            type: 'research_update',
                                            data: {
                                                id: academicSearchId,
                                                type: 'academic',
                                                status: 'running',
                                                title: `Additional academic search for "${query.query}"`,
                                                query: query.query,
                                                message: `Searching academic sources to fill knowledge gap: ${query.rationale}`,
                                                timestamp: Date.now()
                                            }
                                        });

                                        // Execute academic search
                                        // const academicResults = await exa.searchAndContents(query.query, {
                                        //     type: 'auto',
                                        //     numResults: 3,
                                        //     category: 'research paper',
                                        //     summary: true
                                        // });

                                        // Add to search results
                                        // searchResults.push({
                                        //     type: 'academic',
                                        //     query: {
                                        //         query: query.query,
                                        //         rationale: query.rationale,
                                        //         source: 'academic',
                                        //         priority: query.priority
                                        //     },
                                        //     results: academicResults.results.map(r => ({
                                        //         source: 'academic',
                                        //         title: r.title || '',
                                        //         url: r.url || '',
                                        //         content: r.summary || ''
                                        //     }))
                                        // });

                                        // Send completed annotation for academic search
                                        // dataStream.writeMessageAnnotation({
                                        //     type: 'research_update',
                                        //     data: {
                                        //         id: academicSearchId,
                                        //         type: 'academic',
                                        //         status: 'completed',
                                        //         title: `Additional academic search for "${query.query}"`,
                                        //         query: query.query,
                                        //         results: academicResults.results.map(r => ({
                                        //             source: 'academic',
                                        //             title: r.title || '',
                                        //             url: r.url || '',
                                        //             content: r.summary || ''
                                        //         })),
                                        //         message: `Found ${academicResults.results.length} academic sources`,
                                        //         timestamp: Date.now(),
                                        //         overwrite: true
                                        //     }
                                        // });
                                    }

                                    completedSteps++; // Increment completed steps counter
                                }

                                // Send running state for final synthesis
                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: 'final-synthesis',
                                        type: 'analysis',
                                        status: 'running',
                                        title: 'Final Research Synthesis',
                                        analysisType: 'synthesis',
                                        message: 'Synthesizing all research findings...',
                                        timestamp: Date.now()
                                    }
                                });

                                // Perform final synthesis of all findings
                                const { object: finalSynthesis } = await generateObject({
                                    model: openai("gpt-3.5-turbo"),
                                    temperature: 0,
                                    schema: z.object({
                                        key_findings: z.array(z.object({
                                            finding: z.string(),
                                            confidence: z.number().min(0).max(1),
                                            supporting_evidence: z.array(z.string())
                                        })),
                                        remaining_uncertainties: z.array(z.string())
                                    }),
                                    prompt: `Synthesize all research findings, including gap analysis and follow-up research.
                                        Highlight key conclusions and remaining uncertainties.
                                        Stick to the types of the schema, do not add any other fields or types.
                                        
                                        Original results: ${JSON.stringify(searchResults)}
                                        Gap analysis: ${JSON.stringify(gapAnalysis)}
                                        Additional findings: ${JSON.stringify(additionalQueries)}`
                                });

                                synthesis = finalSynthesis;

                                // Send final synthesis update
                                dataStream.writeMessageAnnotation({
                                    type: 'research_update',
                                    data: {
                                        id: 'final-synthesis',
                                        type: 'analysis',
                                        status: 'completed',
                                        title: 'Final Research Synthesis',
                                        analysisType: 'synthesis',
                                        findings: finalSynthesis.key_findings.map(f => ({
                                            insight: f.finding,
                                            evidence: f.supporting_evidence,
                                            confidence: f.confidence
                                        })),
                                        uncertainties: finalSynthesis.remaining_uncertainties,
                                        message: `Synthesized ${finalSynthesis.key_findings.length} key findings`,
                                        timestamp: Date.now(),
                                        overwrite: true,
                                        completedSteps: totalSteps + (depth === 'advanced' ? 2 : 1) - 1,
                                        totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1)
                                    }
                                });
                            }

                            // Final progress update
                            const finalProgress = {
                                id: 'research-progress',
                                type: 'progress' as const,
                                status: 'completed' as const,
                                message: `Research complete`,
                                completedSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
                                totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
                                isComplete: true,
                                timestamp: Date.now()
                            };

                            dataStream.writeMessageAnnotation({
                                type: 'research_update',
                                data: {
                                    ...finalProgress,
                                    overwrite: true
                                }
                            });

                            return {
                                plan: researchPlan,
                                results: searchResults,
                                synthesis: synthesis
                            };
                        },
                    }),
                },
                // experimental_repairToolCall: async ({
                //     toolCall,
                //     tools,
                //     parameterSchema,
                //     error,
                // }) => {
                //     if (NoSuchToolError.isInstance(error)) {
                //         return null; // do not attempt to fix invalid tool names
                //     }

                //     console.log("Fixing tool call================================");
                //     console.log("toolCall", toolCall);
                //     console.log("tools", tools);
                //     console.log("parameterSchema", parameterSchema);
                //     console.log("error", error);

                //     const tool = tools[toolCall.toolName as keyof typeof tools];

                //     const { object: repairedArgs } = await generateObject({
                //         model: scira.languageModel("scira-default"),
                //         schema: tool.parameters,
                //         prompt: [
                //             `The model tried to call the tool "${toolCall.toolName}"` +
                //             ` with the following arguments:`,
                //             JSON.stringify(toolCall.args),
                //             `The tool accepts the following schema:`,
                //             JSON.stringify(parameterSchema(toolCall)),
                //             'Please fix the arguments.',
                //             'Do not use print statements stock chart tool.',
                //             `For the stock chart tool you have to generate a python code with matplotlib and yfinance to plot the stock chart.`,
                //             `For the web search make multiple queries to get the best results.`,
                //             `Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                //         ].join('\n'),
                //     });

                //     console.log("repairedArgs", repairedArgs);

                //     return { ...toolCall, args: JSON.stringify(repairedArgs) };
                // },
                onChunk(event) {
                    if (event.chunk.type === 'tool-call') {
                        console.log('Called Tool: ', event.chunk.toolName);
                    }
                },
                onStepFinish(event) {
                    console.log(event);
                    if (event.warnings) {
                        console.log('Warnings: ', event.warnings);
                    }
                },
                onFinish(event) {
                    console.log('Fin reason: ', event.finishReason);
                    console.log('Reasoning: ', event.reasoning);
                    console.log('reasoning details: ', event.reasoningDetails);
                    console.log('Steps ', event.steps);
                    console.log('Messages: ', event.response.messages);
                },
                onError(event) {
                    console.log('Error: ', event);
                },
            });
            console.log(result);

            result.mergeIntoDataStream(dataStream, {
                sendReasoning: true,
            });
        }
    })
}