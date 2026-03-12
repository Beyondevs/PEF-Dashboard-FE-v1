import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, BarChart2, BookOpen,
  Activity, MapPin, Users, Star, FileText, Layers,
} from 'lucide-react';

// ─── Option card data ─────────────────────────────────────────────────────────
const OPTIONS = [
  {
    id: 'dashboard',
    path: '/reports/pre-post-assessment/dashboard',
    badge: 'Live Data',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: BarChart2,
    title: 'Interactive Dashboard',
    subtitle: 'Explore real-time analytics with interactive charts',
    description:
      'Dive into the aggregated assessment data directly from the database. Filter, compare, and explore every metric across all six Punjab divisions.',
    features: [
      { icon: Activity,  label: 'Live database queries'      },
      { icon: MapPin,    label: '6 division breakdown'        },
      { icon: Users,     label: 'Gender-based analysis'       },
      { icon: Star,      label: 'Star performer tracking'     },
    ],
    gradient: 'from-[hsl(217_91%_35%)] to-[hsl(217_91%_25%)]',
    iconBg: 'bg-white/15',
    textAccent: 'text-blue-200',
    arrowBg: 'bg-white text-[hsl(217_91%_35%)] hover:bg-blue-50',
    borderHover: 'hover:border-[hsl(217_91%_35%)]',
  },
  {
    id: 'official',
    path: '/reports/pre-post-assessment/official-report',
    badge: 'Official Document',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon: BookOpen,
    title: 'Official PDF Report',
    subtitle: 'View the formatted report as submitted to PEF',
    description:
      'Access the professionally formatted final report covering all 15,384 participants across six divisions, complete with analysis tables and programme outcomes.',
    features: [
      { icon: FileText,  label: 'Formatted report layout'     },
      { icon: Layers,    label: 'Complete assessment tables'   },
      { icon: MapPin,    label: 'All 6 Punjab divisions'       },
      { icon: Users,     label: '15,384 participants covered'  },
    ],
    gradient: 'from-indigo-700 to-indigo-900',
    iconBg: 'bg-white/15',
    textAccent: 'text-indigo-200',
    arrowBg: 'bg-white text-indigo-700 hover:bg-indigo-50',
    borderHover: 'hover:border-indigo-500',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const PrePostAssessmentHub = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/reports')}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pre &amp; Post Assessment Final Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Punjab Spoken English Programme · Choose how you'd like to explore the report
          </p>
        </div>
      </div>

      {/* Divider with label */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-2">
          Select a view
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Option cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => navigate(opt.path)}
              className={`
                group relative overflow-hidden rounded-2xl border border-border bg-card
                text-left shadow-sm transition-all duration-300
                hover:shadow-xl hover:-translate-y-1 ${opt.borderHover}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              `}
            >
              {/* Gradient header band */}
              <div className={`bg-gradient-to-br ${opt.gradient} px-6 pt-6 pb-8`}>
                {/* Badge */}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${opt.badgeStyle} mb-4`}>
                  {opt.badge}
                </span>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${opt.iconBg} mb-4`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Title & subtitle */}
                <h2 className="text-xl font-bold text-white leading-tight">{opt.title}</h2>
                <p className={`text-sm mt-1 ${opt.textAccent}`}>{opt.subtitle}</p>
              </div>

              {/* Card body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-2">
                  {opt.features.map(({ icon: FIcon, label }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted shrink-0">
                        <FIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {opt.id === 'dashboard' ? 'Filters, charts & tables' : 'Formatted PDF document'}
                  </span>
                  <span className={`
                    inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold
                    shadow-sm transition-colors ${opt.arrowBg}
                  `}>
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        Data covers the Punjab Spoken English Programme — 6 divisions, active participants with completed assessments
      </p>
    </div>
  );
};

export default PrePostAssessmentHub;
