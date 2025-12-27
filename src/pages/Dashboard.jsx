import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
    const { prospects, activityFeed } = useApp();

    const stats = useMemo(() => {
        const total = prospects.length;
        const portfolioReach = prospects.reduce((acc, p) => acc + (p.portfolio_stats?.total_buildings || 0), 0);
        const validContacts = prospects.filter(p => p.contact_info?.email && p.contact_info?.phone).length;

        // Activity in last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyActivity = prospects.filter(p => new Date(p.last_contact_date) > oneWeekAgo).length;

        return { total, portfolioReach, contactCoverage: Math.round((validContacts / total) * 100), weeklyActivity };
    }, [prospects]);

    const dataQuality = useMemo(() => {
        const total = prospects.length;
        if (total === 0) return { email: 0, phone: 0, website: 0 };

        const hasEmail = prospects.filter(p => p.contact_info?.email).length;
        const hasPhone = prospects.filter(p => p.contact_info?.phone).length;
        const hasWebsite = prospects.filter(p => p.website).length;

        return {
            email: Math.round((hasEmail / total) * 100),
            phone: Math.round((hasPhone / total) * 100),
            website: Math.round((hasWebsite / total) * 100)
        };
    }, [prospects]);

    const cityData = useMemo(() => {
        const counts = {};
        prospects.forEach(p => {
            const city = p.address?.city || 'Unknown';
            counts[city] = (counts[city] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [prospects]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 min-h-screen">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="Total Prospects" value={stats.total} icon={Building2} color="text-indigo-600" bg="bg-indigo-50" />
                <KpiCard title="Portfolio Reach" value={stats.portfolioReach} icon={ArrowUpRight} label="Buildings" color="text-emerald-600" bg="bg-emerald-50" />
                <KpiCard title="Contact Coverage" value={`${stats.contactCoverage}%`} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                <KpiCard title="7-Day Activity" value={stats.weeklyActivity} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-1 transition-colors">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activityFeed.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No recent activity.</p>
                        ) : (
                            activityFeed.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{activity.message}</p>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Data Quality & Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Data Quality */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                            Data Quality Score
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <QualityBar label="Email Availability" percent={dataQuality.email} color="bg-indigo-500" />
                            <QualityBar label="Phone Availability" percent={dataQuality.phone} color="bg-emerald-500" />
                            <QualityBar label="Website Links" percent={dataQuality.website} color="bg-blue-500" />
                        </div>
                    </div>

                    {/* City Breakdown Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Prospect Density by City</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon: Icon, label, color, bg }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors">
        <div className={`p-3 rounded-lg ${bg} dark:bg-slate-700 mr-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <div className="flex items-baseline">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                {label && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{label}</span>}
            </div>
        </div>
    </div>
);

const QualityBar = ({ label, percent, color }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{percent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);

export default Dashboard;
