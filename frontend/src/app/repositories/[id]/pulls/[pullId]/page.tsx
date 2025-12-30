"use client";

import { useState, use } from "react";
import {
    ChevronLeft,
    GitPullRequest,
    MessageSquare,
    CheckCircle2,
    Clock,
    User,
    ChevronDown,
    Settings,
    MoreHorizontal,
    Code,
    GitBranch,
    ExternalLink,
    Check,
    AlertCircle,
    Copy,
    Bell,
    Hash
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function PullRequestDetailPage({ params }: { params: Promise<{ id: string; pullId: string }> }) {
    const resolvedParams = use(params);
    const [activeTab, setActiveTab] = useState("conversation");

    // Mock data based on screenshot
    const pr = {
        id: resolvedParams.pullId,
        title: "Workflow engine E2E test: Feature development workflow",
        author: "Wirasm",
        status: "open",
        targetBranch: "main",
        sourceBranch: "issue-111",
        commits: 2,
        checks: 1,
        filesChanged: 6,
        comments: 0,
        createdAt: "2 days ago",
        body: `
### Summary
End-to-end test of the feature-development workflow introduced in PR #107. This PR documents the test results and workflow behavior observations.

### Test Setup
- **Issue**: [TEST] PR 107 Workflow E2E - Feature Development #111 - [TEST] PR 107 Workflow E2E - Feature Development
- **Test Input**: "help me build dark mode" (intentionally ambiguous for a backend-only app)
- **Workflow**: feature-development (plan → implement → create-pr)

### Test Results

#### Plan Step
- [x] Correctly analyzed the codebase and identified it as backend-only
- [x] Recognized "dark mode" as ambiguous without a web UI
- [x] Proposed 4 possible implementation approaches
- [x] Requested user clarification before proceeding

#### Implement Step
- [x] Correctly identified missing plan.md file
- [x] Documented the workflow state in implementation report
- [!] Lost conversation context due to \`clearContext: true\` setting

#### Create PR Step
- [x] Successfully committed workflow artifacts
- [x] Created this PR documenting test results
        `
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-white overflow-y-auto">
            {/* Navigation */}
            <div className="px-8 pt-4">
                <Link
                    href={`/repositories/${resolvedParams.id}?tab=pull-requests`}
                    className="group flex items-center space-x-1 text-gray-500 hover:text-red-800 transition-colors w-fit"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Pull Requests</span>
                </Link>
            </div>

            {/* --- PR HEADER --- */}
            <div className="px-8 pt-2 pb-2 border-b border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-3xl font-normal text-gray-900 leading-tight">
                                {pr.title} <span className="text-gray-400 font-light">#{pr.id}</span>
                            </h1>
                            <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1 ml-auto">
                                <Code className="w-4 h-4" /> Code <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[15px]">
                            <span className="flex items-center gap-1.5 bg-[#2da44e] text-white px-3 py-1 rounded-full font-semibold text-sm">
                                <GitPullRequest className="w-4 h-4" /> Open
                            </span>
                            <p className="text-gray-600">
                                <span className="font-bold text-gray-900">{pr.author}</span> wants to merge {pr.commits} commits into
                                <span className="mx-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono text-sm border border-blue-100">{pr.targetBranch}</span> from
                                <span className="mx-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono text-sm border border-blue-100">{pr.sourceBranch}</span>
                                <button className="ml-1 p-1 hover:bg-gray-100 rounded text-gray-400"><Copy className="w-3.5 h-3.5" /></button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sub-tabs Component */}
                <div className="flex items-center space-x-8 mt-5 -mb-[1px]">
                    {[
                        { id: 'conversation', label: 'Conversation', count: pr.comments, icon: MessageSquare },
                        { id: 'commits', label: 'Commits', count: pr.commits, icon: GitBranch },
                        { id: 'checks', label: 'Checks', count: pr.checks, icon: CheckCircle2 },
                        { id: 'files', label: 'Files changed', count: pr.filesChanged, icon: Code },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors border-b-2",
                                activeTab === tab.id
                                    ? "text-gray-900 border-[#fd8c73]"
                                    : "text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <span className="text-emerald-600">+218</span>
                        <span className="text-rose-600">−0</span>
                        <div className="flex gap-0.5 ml-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-2 h-2 bg-emerald-500 rounded-sm"></div>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-[1280px] mx-auto w-full p-8 flex gap-8">
                {/* Left Column: Tab Content */}
                <div className="flex-1 min-w-0">
                    {/* 1. CONVERSATION TAB */}
                    {activeTab === "conversation" && (
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 border border-gray-100 flex items-center justify-center overflow-hidden">
                                    <User className="w-6 h-6 text-gray-400" />
                                </div>

                                {/* Comment Box */}
                                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm relative pr-arrow">
                                    <div className="bg-[#f6f8fa] px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-900">{pr.author}</span>
                                            <span className="text-gray-500 ml-1">commented {pr.createdAt}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">Member</span>
                                            <button className="text-gray-500 hover:text-gray-900"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="p-4 prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900">
                                        <h2 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">Summary</h2>
                                        <p className="text-gray-700 leading-relaxed mb-6">
                                            End-to-end test of the feature-development workflow introduced in PR <span className="text-blue-600">#107</span>. This PR documents the test results and workflow behavior observations.
                                        </p>

                                        <h3 className="font-bold mb-3">Test Setup</h3>
                                        <ul className="space-y-1 text-gray-700 mb-6 list-none p-0">
                                            <li className="flex items-center gap-2">
                                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                <span><strong>Issue</strong>: <span className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Hash className="w-3.5 h-3.5" /> [TEST] PR 107 Workflow E2E - Feature Development #111</span></span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                <span><strong>Test Input</strong>: &quot;help me build dark mode&quot; (intentionally ambiguous for a backend-only app)</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                <span><strong>Workflow</strong>: feature-development (plan → implement → create-pr)</span>
                                            </li>
                                        </ul>

                                        <h3 className="font-bold mb-4">Test Results</h3>

                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="font-semibold mb-2">Plan Step</h4>
                                                <div className="space-y-1.5 ml-1">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Correctly analyzed the codebase and identified it as backend-only</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Recognized &quot;dark mode&quot; as ambiguous without a web UI</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Proposed 4 possible implementation approaches</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Requested user clarification before proceeding</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-2">Implement Step</h4>
                                                <div className="space-y-1.5 ml-1">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Correctly identified missing plan.md file</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Documented the workflow state in implementation report</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-amber-600">
                                                        <div className="bg-amber-100 p-0.5 rounded"><AlertCircle className="w-3 h-3" /></div>
                                                        <span className="text-gray-700 font-medium italic">Lost conversation context due to <code className="bg-gray-100 px-1 rounded font-mono text-xs">clearContext: true</code> setting</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-2">Create PR Step</h4>
                                                <div className="space-y-1.5 ml-1">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Successfully committed workflow artifacts</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <div className="bg-emerald-100 p-0.5 rounded"><Check className="w-3 h-3" /></div>
                                                        <span className="text-gray-700">Created this PR documenting test results</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="font-bold mt-8 mb-4">Workflow Behavior Observations</h3>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" /> Latency & Performance
                                                </h4>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Primary thinking steps (Planning) took an average of 45s. Implementation steps were faster (~20s) as they were guided by the approved plan. Multi-file edits were handled in parallel correctly.
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tool Reliability
                                                </h4>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    <code className="bg-gray-100 px-1 rounded">run_command</code> and <code className="bg-gray-100 px-1 rounded">write_to_file</code> worked without failures. The agent correctly handled the missing plan file by creating it instead of erroring out.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. COMMITS TAB */}
                    {activeTab === "commits" && (
                        <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
                            {[
                                {
                                    date: "yesterday", commits: [
                                        { msg: "feat: add workflow engine core logic", sha: "a1b2c3d", time: "14:20" },
                                        { msg: "test: add E2E tests for workflow chains", sha: "e5f6g7h", time: "16:45" }
                                    ]
                                }
                            ].map((group, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex items-center mb-4 gap-4">
                                        <div className="bg-white px-2 text-gray-500 text-sm font-medium">Commits on {group.date}</div>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>
                                    <div className="space-y-3 pl-4 border-l-2 border-gray-200 ml-3">
                                        {group.commits.map((commit, cIdx) => (
                                            <div key={cIdx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 cursor-pointer">{commit.msg}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono font-medium border border-blue-100 hover:bg-blue-100 cursor-pointer">
                                                        {commit.sha}
                                                    </span>
                                                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3. CHECKS TAB */}
                    {activeTab === "checks" && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900">All checks have passed</h4>
                                <span className="text-xs text-gray-500">1 successful check</span>
                            </div>
                            <div className="divide-y divide-gray-200">
                                <div className="px-4 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">GitHub Actions / build (pull_request)</p>
                                            <p className="text-xs text-gray-500">Build and test workflow succeeded</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-semibold text-blue-600 hover:underline">Details</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. FILES CHANGED TAB */}
                    {activeTab === "files" && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Showing <strong>6 changed files</strong> with <strong>218 additions</strong> and <strong>0 deletions</strong>.</span>
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1 border border-gray-300 shadow-sm rounded-md hover:bg-gray-50 font-medium">Unified</button>
                                    <button className="px-3 py-1 bg-white border border-gray-300 shadow-sm rounded-md font-medium">Split</button>
                                </div>
                            </div>

                            {[
                                { name: "src/engine/workflow.ts", lines: 145 },
                                { name: "src/engine/types.ts", lines: 32 },
                                { name: "tests/e2e/workflow.test.ts", lines: 41 }
                            ].map((file, idx) => (
                                <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <div className="bg-[#f6f8fa] px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-mono">
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-gray-900">{file.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-emerald-600 text-xs font-bold leading-none">+{file.lines}</span>
                                            <div className="w-px h-3 bg-gray-300"></div>
                                            <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 font-mono text-[11px] leading-relaxed text-gray-600 overflow-x-auto">
                                        <div className="flex">
                                            <div className="w-10 text-gray-400 select-none pr-4 text-right">...</div>
                                            <div className="flex-1 opacity-50 italic">// content for {file.name}</div>
                                        </div>
                                        <div className="flex bg-emerald-50">
                                            <div className="w-10 text-emerald-600 select-none pr-4 text-right">1</div>
                                            <div className="flex-1 text-emerald-900">+ export class WorkflowEngine &#123;</div>
                                        </div>
                                        <div className="flex bg-emerald-50">
                                            <div className="w-10 text-emerald-600 select-none pr-4 text-right">2</div>
                                            <div className="flex-1 text-emerald-900">+   private tasks: Map&lt;string, Task&gt;;</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Sidebar */}
                <div className="w-[300px] shrink-0 space-y-4">
                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 hover:text-blue-600">Reviewers</span>
                            <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">No reviews</p>
                        <p className="text-[11px] text-gray-500">Still in progress? <span className="text-blue-600 hover:underline cursor-pointer">Learn about draft PRs</span> <AlertCircle className="w-3 h-3 inline-block ml-0.5" /></p>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 hover:text-blue-600">Assignees</span>
                            <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">No one assigned</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 hover:text-blue-600">Labels</span>
                            <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">None yet</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 hover:text-blue-600">Projects</span>
                            <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">None yet</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-gray-600 hover:text-blue-600">Milestone</span>
                            <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">No milestone</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-600">Development</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">Successfully merging this pull request may close these issues.</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hover:text-blue-600 cursor-pointer">[TEST] PR 107 Workflow E2E - Feature Developm...</span>
                        </div>
                    </div>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-600">Notifications</span>
                            <span className="text-[10px] text-blue-600 font-medium hover:underline cursor-pointer uppercase">Customize</span>
                        </div>
                        <button className="w-full h-8 flex items-center justify-center gap-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700">
                            <Bell className="w-3.5 h-3.5" /> Subscribe
                        </button>
                        <p className="text-[11px] text-gray-500 text-center">You&apos;re not receiving notifications from this thread.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-600">1 participant</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center overflow-hidden">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .pr-arrow::before {
                    content: '';
                    position: absolute;
                    left: -6px;
                    top: 15px;
                    width: 10px;
                    height: 10px;
                    background: #f6f8fa;
                    border-left: 1px solid #d1d5db;
                    border-bottom: 1px solid #d1d5db;
                    transform: rotate(45deg);
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
