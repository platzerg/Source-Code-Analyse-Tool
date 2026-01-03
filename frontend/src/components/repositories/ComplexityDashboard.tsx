"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle2, Bot } from "lucide-react";

interface ComplexityDashboardProps {
    complexity: {
        score: number;
        rating: string;
        technology_diversity: number;
        category_spread: number;
        learning_curve: string;
        risk_level: string;
        stack_complexity_analysis: string;
        ai_impact: {
            standard_oss_technologies: number;
            estimated_time_savings: string;
            ai_adjusted_effort: string;
        };
        risk_analysis: {
            high_risk: number;
            medium_risk: number;
            low_risk: number;
        };
        recommendations: string[];
    };
}

export default function ComplexityDashboard({ complexity }: ComplexityDashboardProps) {
    if (!complexity) return <div>No complexity data available</div>;

    // Helper for Gauge Color
    const getScoreColor = (score: number) => {
        if (score > 70) return "text-red-500";
        if (score > 40) return "text-yellow-500";
        return "text-green-500";
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-16 overflow-hidden mb-2">
                                <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-gray-100 dark:border-gray-800"></div>
                                <div
                                    className={`absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-t-transparent border-r-transparent border-b-transparent ${getScoreColor(complexity.score)} rotate-[-45deg] transition-all duration-1000 origin-center`}
                                    style={{ transform: `rotate(${-135 + (complexity.score / 100) * 180}deg)` }}
                                ></div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2 text-2xl font-bold">
                                    {Math.round(complexity.score / 10)}/10
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(complexity.score)} bg-opacity-10 bg-current`}>
                                {complexity.rating}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 flex flex-col justify-center h-full">
                        <div className="text-3xl font-bold mb-1">{complexity.technology_diversity}</div>
                        <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                            Technology Diversity
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Unique technologies</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 flex flex-col justify-center h-full">
                        <div className="text-3xl font-bold mb-1">{complexity.category_spread}</div>
                        <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                            Category Spread
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Different categories</div>
                    </CardContent>
                </Card>

                <div className="grid grid-rows-2 gap-4">
                    <Card className="flex items-center justify-between px-6">
                        <div>
                            <div className="text-sm font-semibold">Learning Curve</div>
                            <div className="text-xs text-muted-foreground">Estimated onboarding</div>
                        </div>
                        <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">{complexity.learning_curve}</div>
                    </Card>
                    <Card className="flex items-center justify-between px-6">
                        <div>
                            <div className="text-sm font-semibold">Risk Level</div>
                            <div className="text-xs text-muted-foreground">Transition risk</div>
                        </div>
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold">{complexity.risk_level}</div>
                    </Card>
                </div>
            </div>

            {/* Stack Complexity Text */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stack Complexity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {complexity.stack_complexity_analysis}
                    </p>
                    <div className="flex justify-end mt-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Score: {Math.round(complexity.score / 10)}/10</span>
                    </div>
                </CardContent>
            </Card>

            {/* AI Impact */}
            <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <Bot className="w-6 h-6 text-red-600" />
                    <CardTitle className="text-base font-semibold text-red-900 dark:text-red-400">AI-Assisted Development Impact</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-red-800 dark:text-red-300 mb-4">
                        Original development was likely done WITHOUT AI coding assistants. Using tools like Claude Code or Github Copilot for the transition could significantly reduce effort.
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-xs text-red-800/70 dark:text-red-400/70 font-semibold mb-1">Standard OSS Technologies</div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-500">{complexity.ai_impact.standard_oss_technologies}%</div>
                        </div>
                        <div>
                            <div className="text-xs text-red-800/70 dark:text-red-400/70 font-semibold mb-1">Estimated Time Savings with AI</div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-500">{complexity.ai_impact.estimated_time_savings}</div>
                        </div>
                        <div>
                            <div className="text-xs text-red-800/70 dark:text-red-400/70 font-semibold mb-1">AI-Adjusted Effort</div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-500">{complexity.ai_impact.ai_adjusted_effort}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">High Risk</h3>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-4xl font-bold mb-1">{complexity.risk_analysis.high_risk}</div>
                        <div className="text-xs text-muted-foreground">{((complexity.risk_analysis.high_risk / (complexity.risk_analysis.high_risk + complexity.risk_analysis.medium_risk + complexity.risk_analysis.low_risk)) * 100).toFixed(1)}% of commits</div>
                        <button className="text-red-600 text-xs font-semibold mt-4 flex items-center gap-1 hover:underline">
                            <EyeIcon className="w-3 h-3" /> View commits
                        </button>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Medium Risk</h3>
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div className="text-4xl font-bold mb-1">{complexity.risk_analysis.medium_risk}</div>
                        <div className="text-xs text-muted-foreground">{((complexity.risk_analysis.medium_risk / (complexity.risk_analysis.high_risk + complexity.risk_analysis.medium_risk + complexity.risk_analysis.low_risk)) * 100).toFixed(1)}% of commits</div>
                        <button className="text-red-600 text-xs font-semibold mt-4 flex items-center gap-1 hover:underline">
                            <EyeIcon className="w-3 h-3" /> View commits
                        </button>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Low Risk</h3>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-4xl font-bold mb-1">{complexity.risk_analysis.low_risk}</div>
                        <div className="text-xs text-muted-foreground">{((complexity.risk_analysis.low_risk / (complexity.risk_analysis.high_risk + complexity.risk_analysis.medium_risk + complexity.risk_analysis.low_risk)) * 100).toFixed(1)}% of commits</div>
                        <button className="text-red-600 text-xs font-semibold mt-4 flex items-center gap-1 hover:underline">
                            <EyeIcon className="w-3 h-3" /> View commits
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-red-600" />
                        <CardTitle className="text-base">AI-Powered Recommendations</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Here are {complexity.recommendations.length} concise, actionable recommendations for the project transition team:</p>
                    <ul className="space-y-3">
                        {complexity.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-2 items-start text-sm">
                                <span className="bg-gray-200 dark:bg-gray-700 rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-gray-100">{rec.split(':')[0]}:</strong>
                                    {rec.split(':')[1]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

function EyeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
