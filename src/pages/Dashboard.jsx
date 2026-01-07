import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { Building2, Users, CheckCircle, Clock, ArrowUpRight, DollarSign, Target, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const { prospects, activityFeed, PIPELINE_STAGES } = useApp();

    const stats = useMemo(() => {
        const total = prospects.length;

        // Mock Pipeline Value: Each building is ~50k in potential value
        const totalBuildings = prospects.reduce((acc, p) => acc + (p.portfolio_stats?.total_buildings || 0), 0);
        const pipelineValue = totalBuildings * 50000;

        // Conversion Rate: (Closed Won / Total Concluded)
        const won = prospects.filter(p => p.status === 'closed_won').length;
        const lost = prospects.filter(p => p.status === 'closed_lost').length;
        const conversionRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;

        // Overdue Tasks
        const now = new Date();
        const overdueTasks = prospects.reduce((acc, p) => {
            const count = (p.tasks || []).filter(t => t.status === 'pending' && new Date(t.dueDate) < now).length;
            return acc + count;
        }, 0);

        return { total, pipelineValue, conversionRate, overdueTasks };
    }, [prospects]);

    const funnelData = useMemo(() => {
        return PIPELINE_STAGES.map((stage, index) => ({
            name: stage.label,
            value: prospects.filter(p => p.status === stage.id).length,
            fill: stage.id === 'closed_won' ? '#10b981' : stage.id === 'closed_lost' ? '#ef4444' : '#6366f1'
        })).filter(s => s.value > 0 || ['new', 'contacted', 'negotiating', 'closed_won'].includes(s.name.toLowerCase().replace(' ', '_')));
    }, [prospects, PIPELINE_STAGES]);

    const cityData = useMemo(() => {
        const counts = {};
        prospects.forEach(p => {
            const city = p.address?.city || 'Unknown';
            counts[city] = (counts[city] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [prospects]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 min-h-screen">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="Pipeline Value" value={`$${(stats.pipelineValue / 1000000).toFixed(1)}M`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
                <KpiCard title="Total Prospects" value={stats.total} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
                <KpiCard title="Win Rate" value={`${stats.conversionRate}%`} icon={Target} color="text-blue-600" bg="bg-blue-50" />
                <KpiCard title="Overdue Tasks" value={stats.overdueTasks} icon={AlertCircle} color={stats.overdueTasks > 0 ? "text-rose-600" : "text-slate-400"} bg={stats.overdueTasks > 0 ? "bg-rose-50" : "bg-slate-50"} />
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

                {/* Funnel & City Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Conversion Funnel */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-indigo-500" />
                            Conversion Funnel
                        </h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Funnel
                                        data={funnelData}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        <LabelList position="right" fill="#94a3b8" dataKey="name" stroke="none" />
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* City Breakdown Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Regions by Density</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cityData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#475569" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} />
                                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
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
