import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, IdCard, Award, BookOpen, School, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTrainerById, getSchools } from '@/lib/api';

export default function TrainerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Awaited<ReturnType<typeof getTrainerById>>['data'] | null>(null);
  const [schools, setSchools] = useState<{ id: string; name: string; emisCode?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid trainer');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [trainerRes, schoolsRes] = await Promise.all([
          getTrainerById(id),
          getSchools({ page: 1, pageSize: 2000 }).catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;
        setTrainer(trainerRes.data);
        const list = schoolsRes.data?.data ?? [];
        setSchools(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load trainer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const profile = trainer?.trainerProfile;
  const assignedSchoolIds = profile?.assignedSchools ?? [];
  const schoolMap = useMemo(() => {
    const map: Record<string, { name: string; emisCode?: string }> = {};
    schools.forEach((s) => { map[s.id] = { name: s.name, emisCode: s.emisCode }; });
    return map;
  }, [schools]);
  const assignedSchoolNames = useMemo(
    () =>
      assignedSchoolIds
        .map((sid) => {
          const s = schoolMap[sid];
          return s ? `${s.name}${s.emisCode ? ` (${s.emisCode})` : ''}` : null;
        })
        .filter(Boolean),
    [assignedSchoolIds, schoolMap],
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/trainers')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trainers
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Trainer not found'}
        </div>
      </div>
    );
  }

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    className = '',
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    className?: string;
  }) => (
    <div className={`flex gap-3 py-3 border-b border-border/60 last:border-0 last:pb-0 first:pt-0 ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header with back link and trainer name */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to="/admin/trainers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trainers
          </Link>
        </Button>
        <div className="h-5 w-px bg-border hidden sm:block" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{profile?.name ?? 'Trainer'}</h1>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Profile & schools */}
        <div className="space-y-6 flex-1 min-w-0">
          <Card className="overflow-hidden shadow-sm border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Trainer information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-0">
                <DetailRow icon={User} label="Name" value={profile?.name ?? ''} className="first:pt-0" />
                <DetailRow icon={Mail} label="Email" value={trainer.email ?? ''} />
                <DetailRow icon={Phone} label="Phone" value={trainer.phone ?? ''} />
                <DetailRow icon={IdCard} label="CNIC" value={profile?.cnic ?? ''} />
                <DetailRow icon={BookOpen} label="Qualification" value={profile?.qualification?.trim() ?? ''} />
                <DetailRow icon={Award} label="Certification" value={profile?.certification?.trim() ?? ''} />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-sm border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Assigned Schools</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Schools assigned to this trainer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {assignedSchoolNames.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {assignedSchoolNames.map((name, idx) => (
                    <li key={idx}>
                      <Badge variant="secondary" className="text-xs font-normal py-1.5 px-2.5 rounded-md">
                        {name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No schools assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Signature */}
        <div className="lg:w-[360px] shrink-0">
          <Card className="overflow-hidden shadow-sm border-border/80 h-fit">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Signature</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Trainer&apos;s saved signature</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {profile?.signatureSvg ? (
                <div
                  className="w-full min-h-[180px] rounded-lg border border-border/80 bg-muted/20 p-4 flex items-center justify-center [&>svg]:max-h-[200px] [&>svg]:w-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: profile.signatureSvg }}
                />
              ) : (
                <div className="min-h-[180px] rounded-lg border border-dashed border-border/80 bg-muted/10 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No signature added</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
