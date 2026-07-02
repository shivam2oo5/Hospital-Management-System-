import { useGetDashboardStats, useGetRevenueChart, useGetRecentActivities, useGetAppointmentStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Stethoscope, Calendar, Bed, Activity, ArrowUpRight, TrendingUp, Clock, AlertCircle, CreditCard } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChart();
  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivities();
  const { data: appointmentStats, isLoading: apptStatsLoading } = useGetAppointmentStats();

  const APPT_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">Overview of hospital operations and performance.</p>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          System Normal
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Patients" 
          value={stats?.totalPatients} 
          icon={Users} 
          trend="+4.2%" 
          loading={statsLoading} 
        />
        <KpiCard 
          title="Active Admissions" 
          value={stats?.activeAdmissions} 
          icon={Bed} 
          trend="+2" 
          loading={statsLoading}
          alert={stats && stats.activeAdmissions && stats.availableBeds && (stats.availableBeds < 10) ? "Low bed capacity" : undefined}
        />
        <KpiCard 
          title="Today's Appointments" 
          value={stats?.todayAppointments} 
          icon={Calendar} 
          trend="12 pending" 
          loading={statsLoading} 
        />
        <KpiCard 
          title="Monthly Revenue" 
          value={stats?.monthlyRevenue ? formatCurrency(stats.monthlyRevenue) : undefined} 
          icon={TrendingUp} 
          trend="+8.1%" 
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Financial performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenueData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>Current day breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {apptStatsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : appointmentStats ? (
              <div className="h-[300px] w-full flex flex-col">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Scheduled', value: appointmentStats.scheduled },
                        { name: 'Completed', value: appointmentStats.completed },
                        { name: 'No Show', value: appointmentStats.noShow },
                        { name: 'Cancelled', value: appointmentStats.cancelled },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {APPT_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#0ea5e9]"></div> Scheduled ({appointmentStats.scheduled})</div>
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#14b8a6]"></div> Completed ({appointmentStats.completed})</div>
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div> No Show ({appointmentStats.noShow})</div>
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#ef4444]"></div> Cancelled ({appointmentStats.cancelled})</div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle>Live Activity Stream</CardTitle>
              <CardDescription>Recent events across all departments</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-background bg-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {activity.type === 'admission' ? <Bed className="w-3 h-3 text-blue-500" /> :
                       activity.type === 'appointment' ? <Calendar className="w-3 h-3 text-amber-500" /> :
                       <Activity className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm capitalize">{activity.type}</span>
                        <time className="text-xs text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDateTime(activity.createdAt)}</time>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                      {(activity.patientName || activity.doctorName) && (
                        <div className="mt-2 flex gap-2 text-xs">
                          {activity.patientName && <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">{activity.patientName}</span>}
                          {activity.doctorName && <span className="bg-muted px-2 py-0.5 rounded text-foreground">Dr. {activity.doctorName}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No recent activities</div>
            )}
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = '/patients/new'}>
              <Users className="w-4 h-4 mr-2 text-primary" />
              Register New Patient
            </Button>
            <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = '/appointments/new'}>
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              Book Appointment
            </Button>
            <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = '/admissions/new'}>
              <Bed className="w-4 h-4 mr-2 text-primary" />
              Admit Patient
            </Button>
            <Button className="w-full justify-start h-12" variant="outline" onClick={() => window.location.href = '/billing/new'}>
              <CreditCard className="w-4 h-4 mr-2 text-primary" />
              Create Invoice
            </Button>

            <div className="pt-6 mt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center text-destructive">
                <AlertCircle className="w-4 h-4 mr-2" /> Needs Attention
              </h4>
              <div className="space-y-3">
                {stats?.pendingBills ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Bills</span>
                    <Badge variant="destructive" className="rounded-full px-2">{stats.pendingBills}</Badge>
                  </div>
                ) : null}
                {stats?.lowStockMedicines ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Low Stock Meds</span>
                    <Badge variant="warning" className="rounded-full px-2">{stats.lowStockMedicines}</Badge>
                  </div>
                ) : null}
                {stats?.pendingLabOrders ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Lab Results</span>
                    <Badge variant="secondary" className="rounded-full px-2">{stats.pendingLabOrders}</Badge>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, loading, alert }: any) {
  return (
    <Card className="shadow-sm border-border/50 relative overflow-hidden">
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-full bg-destructive" />
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <Icon className={`w-4 h-4 ${alert ? 'text-destructive' : 'text-primary'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <h2 className="text-2xl font-bold font-mono tracking-tight">{value !== undefined ? value : '-'}</h2>
          )}
        </div>
        <div className="mt-2 flex items-center text-xs">
          {loading ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <>
              {trend.startsWith('+') ? (
                <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
              ) : trend.startsWith('-') ? (
                <ArrowUpRight className="w-3 h-3 mr-1 text-red-500 rotate-90" />
              ) : null}
              <span className={trend.startsWith('+') ? 'text-green-500 font-medium' : trend.startsWith('-') ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                {trend}
              </span>
            </>
          )}
        </div>
        {alert && <div className="mt-2 text-xs font-medium text-destructive">{alert}</div>}
      </CardContent>
    </Card>
  );
}

