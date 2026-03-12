import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, BarChart2, BookOpen,
  Activity, MapPin, Users, Star, FileText, Layers, CheckCircle2,
} from 'lucide-react';

const OPTIONS = [
  {
    id: 'dashboard',
    path: '/reports/pre-post-assessment/dashboard',
    category: 'INTERACTIVE',
    badge: 'Live Data',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: BarChart2,
    title: 'Interactive Dashboard',
    subtitle: 'Explore real-time analytics with interactive charts',
    description:
      'Dive into live database charts. Compare pre vs post scores across all six Punjab divisions, filter by gender, track star performers, and explore skill-level breakdowns.',
    features: [
      { icon: Activity, label: 'Live database queries' },
      { icon: MapPin,   label: '6 division breakdown'  },
      { icon: Users,    label: 'Gender analysis'        },
      { icon: Star,     label: 'Star performers'        },
    ],
    gradientFrom: 'from-[hsl(217_91%_30%)]',
    gradientTo: 'to-[hsl(217_91%_20%)]',
    btnClass: 'bg-[hsl(217_91%_35%)] hover:bg-[hsl(217_91%_28%)] text-white',
    ringClass: 'focus-visible:ring-[hsl(217_91%_35%)]',
    accentBorder: 'border-t-[hsl(217_91%_35%)]',
  },
  {
    id: 'official',
    path: '/reports/pre-post-assessment/official-report',
    category: 'OFFICIAL DOCUMENT',
    badge: 'PDF Report',
    badgeStyle: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: BookOpen,
    title: 'Official PDF Report',
    subtitle: 'View the formatted report as submitted to PEF',
    description:
      'Access the professionally formatted final report covering all 15,384 participants, with complete analysis tables, division-wise breakdowns, and programme outcomes.',
    features: [
      { icon: FileText, label: 'Formatted layout'      },
      { icon: Layers,   label: 'Full assessment tables' },
      { icon: MapPin,   label: 'All 6 divisions'        },
      { icon: Users,    label: '15,384 participants'    },
    ],
    gradientFrom: 'from-indigo-800',
    gradientTo:   'to-indigo-950',
    btnClass: 'bg-indigo-700 hover:bg-indigo-800 text-white',
    ringClass: 'focus-visible:ring-indigo-500',
    accentBorder: 'border-t-indigo-600',
  },
];

const PrePostAssessmentHub = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')} className="mt-0.5 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Pre &amp; Post Assessment Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Punjab Spoken English Programme · Choose how you'd like to view the report
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Select a view
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => navigate(opt.path)}
              className={`
                group cursor-pointer rounded-2xl border-t-4 ${opt.accentBorder}
                border border-border bg-card shadow-sm overflow-hidden
                transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                focus-within:ring-2 ${opt.ringClass}
              `}
            >
              {/* Gradient hero strip */}
              <div className={`relative bg-gradient-to-br ${opt.gradientFrom} ${opt.gradientTo} px-6 pt-5 pb-7 overflow-hidden`}>
                {/* Decorative circles */}
                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/[0.06] pointer-events-none" />
                <div className="absolute -right-2 -top-6 w-16 h-16 rounded-full bg-white/[0.05] pointer-events-none" />

                {/* Row: text left, icon right */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">
                      {opt.category}
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {opt.title}
                    </h2>
                    <p className="text-white/60 text-sm leading-snug">
                      {opt.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mt-0.5">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 pt-5 pb-6 space-y-4">
                {/* Badge */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${opt.badgeStyle}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {opt.badge}
                </span>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-2">
                  {opt.features.map(({ icon: FIcon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-foreground">
                      <FIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(opt.path)}
                  className={`
                    w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold
                    transition-colors ${opt.btnClass}
                  `}
                >
                  Open {opt.title}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground pb-2">
        Covers 6 Punjab divisions · Active participants with completed assessments only
      </p>
    </div>
  );
};

export default PrePostAssessmentHub;
