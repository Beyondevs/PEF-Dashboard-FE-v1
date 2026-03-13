import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Users, Star, TrendingUp, TrendingDown, Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrePostAssessmentReport } from '@/lib/api';

// ─── Mobile hook ──────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const onResize = useCallback(() => setIsMobile(window.innerWidth < 640), []);
  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);
  return isMobile;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiGroup {
  totalActiveAssessed: number;
  totalStarPerformers: number;
  starPercent: number;
  preAvgPercent: number;
  postAvgPercent: number;
}

interface DivisionEntry {
  division: string;
  divisionId: string;
  count: number;
  preAvgPercent: number;
  postAvgPercent: number;
  improvement: number;
}

interface GenderEntry {
  count: number;
  preAvgPercent: number;
  postAvgPercent: number;
  improvement: number;
  byDivision: Array<{ division: string; divisionId: string; count: number; preAvgPercent: number; postAvgPercent: number }>;
}

interface SkillEntry {
  skill: string;
  prePercent: number;
  postPercent: number;
  improvement: number;
}

interface StarEntry {
  division: string;
  divisionId: string;
  totalStudents?: number;
  totalTeachers?: number;
  starPerformers: number;
  starPercent: number;
}

interface ProgressRow {
  skill: string;
  overallPre: number;
  overallPost: number;
  divisions: Record<string, { pre: number; post: number }>;
}

interface ReportData {
  kpi: { students: KpiGroup; teachers: KpiGroup };
  divisionPerformance: { students: DivisionEntry[]; teachers: DivisionEntry[] };
  genderAnalysis: { female: GenderEntry; male: GenderEntry };
  skillShift: { students: SkillEntry[]; teachers: SkillEntry[] };
  starPerformers: { students: StarEntry[]; teachers: StarEntry[] };
  progressTables: {
    students: { overall: ProgressRow[]; female: ProgressRow[]; male: ProgressRow[] };
    teachers:  { overall: ProgressRow[] };
  };
  meta: {
    generatedAt: string;
    studentMaxScore: number;
    teacherMaxScore: number;
  };
}

// ─── PDF Static Fallback Data (Oct–Dec 2025 report) ───────────────────────────
const PDF_FALLBACK_DATA: ReportData = {
  kpi: {
    students: {
      totalActiveAssessed: 13439,
      totalStarPerformers: 10059,
      starPercent: 75.40,
      preAvgPercent: 47.3,
      postAvgPercent: 83.5,
    },
    teachers: {
      totalActiveAssessed: 1945,
      totalStarPerformers: 0,
      starPercent: 0,
      preAvgPercent: 0,
      postAvgPercent: 0,
    },
  },
  divisionPerformance: {
    students: [
      { division: 'Faisalabad', divisionId: 'faisalabad', count: 3029, preAvgPercent: 30.69, postAvgPercent: 71.35, improvement: 40.66 },
      { division: 'Gujranwala', divisionId: 'gujranwala', count: 1786, preAvgPercent: 37.49, postAvgPercent: 77.36, improvement: 39.87 },
      { division: 'Gujrat',     divisionId: 'gujrat',     count: 1395, preAvgPercent: 45.69, postAvgPercent: 82.07, improvement: 36.38 },
      { division: 'Lahore',     divisionId: 'lahore',     count: 3294, preAvgPercent: 50.09, postAvgPercent: 86.28, improvement: 36.19 },
      { division: 'Rawalpindi', divisionId: 'rawalpindi', count: 1142, preAvgPercent: 58.79, postAvgPercent: 90.88, improvement: 32.09 },
      { division: 'Sargodha',   divisionId: 'sargodha',   count: 2793, preAvgPercent: 64.30, postAvgPercent: 95.06, improvement: 30.76 },
    ],
    teachers: [],
  },
  genderAnalysis: {
    female: {
      count: 8485,
      preAvgPercent: 49.83,
      postAvgPercent: 86.17,
      improvement: 36.34,
      byDivision: [
        { division: 'Faisalabad', divisionId: 'faisalabad', count: 1570, preAvgPercent: 32.5,  postAvgPercent: 75.8  },
        { division: 'Gujranwala', divisionId: 'gujranwala', count: 1213, preAvgPercent: 38.9,  postAvgPercent: 80.3  },
        { division: 'Gujrat',     divisionId: 'gujrat',     count: 1035, preAvgPercent: 47.0,  postAvgPercent: 84.3  },
        { division: 'Lahore',     divisionId: 'lahore',     count: 2395, preAvgPercent: 51.6,  postAvgPercent: 89.3  },
        { division: 'Rawalpindi', divisionId: 'rawalpindi', count: 746,  preAvgPercent: 61.0,  postAvgPercent: 94.5  },
        { division: 'Sargodha',   divisionId: 'sargodha',   count: 1526, preAvgPercent: 68.1,  postAvgPercent: 93.0  },
      ],
    },
    male: {
      count: 4954,
      preAvgPercent: 44.30,
      postAvgPercent: 78.92,
      improvement: 34.62,
      byDivision: [
        { division: 'Faisalabad', divisionId: 'faisalabad', count: 1459, preAvgPercent: 28.8, postAvgPercent: 66.6 },
        { division: 'Gujranwala', divisionId: 'gujranwala', count: 573,  preAvgPercent: 34.6, postAvgPercent: 71.2 },
        { division: 'Gujrat',     divisionId: 'gujrat',     count: 360,  preAvgPercent: 41.8, postAvgPercent: 75.8 },
        { division: 'Lahore',     divisionId: 'lahore',     count: 899,  preAvgPercent: 46.2, postAvgPercent: 78.4 },
        { division: 'Rawalpindi', divisionId: 'rawalpindi', count: 396,  preAvgPercent: 54.7, postAvgPercent: 84.0 },
        { division: 'Sargodha',   divisionId: 'sargodha',   count: 1267, preAvgPercent: 59.7, postAvgPercent: 97.6 },
      ],
    },
  },
  skillShift: {
    students: [
      { skill: 'Fluency',                       prePercent: 52.8, postPercent: 86.3, improvement: 33.5 },
      { skill: 'Speaking in Complete Sentences', prePercent: 46.6, postPercent: 83.8, improvement: 37.2 },
      { skill: 'Accuracy',                       prePercent: 50.4, postPercent: 86.2, improvement: 35.8 },
      { skill: 'Pronunciation',                  prePercent: 52.0, postPercent: 87.5, improvement: 35.5 },
      { skill: 'Vocabulary',                     prePercent: 55.4, postPercent: 89.9, improvement: 34.5 },
      { skill: 'Confidence',                     prePercent: 44.1, postPercent: 80.6, improvement: 36.5 },
      { skill: 'Asking Questions',               prePercent: 45.4, postPercent: 83.8, improvement: 38.4 },
      { skill: 'Answering Questions',            prePercent: 48.7, postPercent: 84.4, improvement: 35.7 },
      { skill: 'Asking & Sharing Information',   prePercent: 52.3, postPercent: 87.7, improvement: 35.4 },
      { skill: 'Describing & Explaining',        prePercent: 42.8, postPercent: 80.3, improvement: 37.5 },
      { skill: 'Expressing Thoughts & Feelings', prePercent: 40.8, postPercent: 77.5, improvement: 36.7 },
      { skill: 'Speaking for an Audience',       prePercent: 43.6, postPercent: 80.0, improvement: 36.4 },
    ],
    teachers: [],
  },
  starPerformers: {
    students: [
      { division: 'Faisalabad', divisionId: 'faisalabad', totalStudents: 3029, starPerformers: 1767, starPercent: 58.34 },
      { division: 'Gujranwala', divisionId: 'gujranwala', totalStudents: 1786, starPerformers: 1162, starPercent: 65.06 },
      { division: 'Gujrat',     divisionId: 'gujrat',     totalStudents: 1395, starPerformers: 1022, starPercent: 73.26 },
      { division: 'Lahore',     divisionId: 'lahore',     totalStudents: 3294, starPerformers: 2571, starPercent: 78.05 },
      { division: 'Rawalpindi', divisionId: 'rawalpindi', totalStudents: 1142, starPerformers: 986,  starPercent: 86.34 },
      { division: 'Sargodha',   divisionId: 'sargodha',   totalStudents: 2793, starPerformers: 2551, starPercent: 91.34 },
    ],
    teachers: [],
  },
  progressTables: {
    students: {
      overall: [
        {
          skill: 'Fluency',
          overallPre: 52.8, overallPost: 86.3,
          divisions: {
            Faisalabad: { pre: 38.31, post: 74.35 }, Gujranwala: { pre: 40.38, post: 80.68 },
            Gujrat:     { pre: 50.32, post: 84.26 }, Lahore:     { pre: 55.18, post: 89.57 },
            Rawalpindi: { pre: 62.71, post: 91.61 }, Sargodha:   { pre: 64.99, post: 97.09 },
          },
        },
        {
          skill: 'Speaking in Complete Sentences',
          overallPre: 46.6, overallPost: 83.8,
          divisions: {
            Faisalabad: { pre: 27.67, post: 72.43 }, Gujranwala: { pre: 36.18, post: 77.74 },
            Gujrat:     { pre: 42.25, post: 82.51 }, Lahore:     { pre: 47.41, post: 84.57 },
            Rawalpindi: { pre: 58.23, post: 90.46 }, Sargodha:   { pre: 63.92, post: 95.08 },
          },
        },
        {
          skill: 'Accuracy',
          overallPre: 50.4, overallPost: 86.2,
          divisions: {
            Faisalabad: { pre: 37.60, post: 75.06 }, Gujranwala: { pre: 40.92, post: 78.43 },
            Gujrat:     { pre: 44.63, post: 85.78 }, Lahore:     { pre: 54.76, post: 87.84 },
            Rawalpindi: { pre: 62.47, post: 93.82 }, Sargodha:   { pre: 64.14, post: 96.50 },
          },
        },
        {
          skill: 'Pronunciation',
          overallPre: 52.0, overallPost: 87.5,
          divisions: {
            Faisalabad: { pre: 34.53, post: 76.09 }, Gujranwala: { pre: 40.87, post: 81.33 },
            Gujrat:     { pre: 52.67, post: 85.65 }, Lahore:     { pre: 55.99, post: 90.73 },
            Rawalpindi: { pre: 62.71, post: 93.59 }, Sargodha:   { pre: 69.28, post: 97.36 },
          },
        },
        {
          skill: 'Vocabulary',
          overallPre: 55.4, overallPost: 89.9,
          divisions: {
            Faisalabad: { pre: 38.38, post: 80.26 }, Gujranwala: { pre: 40.85, post: 83.42 },
            Gujrat:     { pre: 56.07, post: 90.02 }, Lahore:     { pre: 59.53, post: 93.75 },
            Rawalpindi: { pre: 64.29, post: 94.57 }, Sargodha:   { pre: 75.11, post: 97.50 },
          },
        },
        {
          skill: 'Confidence',
          overallPre: 44.1, overallPost: 80.6,
          divisions: {
            Faisalabad: { pre: 24.35, post: 67.41 }, Gujranwala: { pre: 38.42, post: 71.93 },
            Gujrat:     { pre: 42.90, post: 77.42 }, Lahore:     { pre: 45.40, post: 84.42 },
            Rawalpindi: { pre: 54.64, post: 89.61 }, Sargodha:   { pre: 61.13, post: 92.95 },
          },
        },
        {
          skill: 'Asking Questions',
          overallPre: 45.4, overallPost: 83.8,
          divisions: {
            Faisalabad: { pre: 30.95, post: 66.76 }, Gujranwala: { pre: 37.37, post: 76.48 },
            Gujrat:     { pre: 40.23, post: 79.60 }, Lahore:     { pre: 49.56, post: 84.67 },
            Rawalpindi: { pre: 55.18, post: 88.97 }, Sargodha:   { pre: 59.23, post: 94.45 },
          },
        },
        {
          skill: 'Answering Questions',
          overallPre: 48.7, overallPost: 84.4,
          divisions: {
            Faisalabad: { pre: 30.15, post: 71.31 }, Gujranwala: { pre: 38.69, post: 78.71 },
            Gujrat:     { pre: 45.69, post: 81.55 }, Lahore:     { pre: 52.42, post: 87.35 },
            Rawalpindi: { pre: 59.23, post: 92.12 }, Sargodha:   { pre: 64.25, post: 95.35 },
          },
        },
        {
          skill: 'Asking & Sharing Information',
          overallPre: 52.3, overallPost: 87.7,
          divisions: {
            Faisalabad: { pre: 37.15, post: 77.19 }, Gujranwala: { pre: 39.91, post: 83.91 },
            Gujrat:     { pre: 49.26, post: 86.65 }, Lahore:     { pre: 53.47, post: 88.84 },
            Rawalpindi: { pre: 63.64, post: 93.64 }, Sargodha:   { pre: 70.18, post: 96.16 },
          },
        },
        {
          skill: 'Describing & Explaining',
          overallPre: 42.8, overallPost: 80.3,
          divisions: {
            Faisalabad: { pre: 22.01, post: 65.48 }, Gujranwala: { pre: 32.56, post: 73.84 },
            Gujrat:     { pre: 42.08, post: 78.37 }, Lahore:     { pre: 42.86, post: 81.28 },
            Rawalpindi: { pre: 55.87, post: 89.21 }, Sargodha:   { pre: 61.68, post: 93.69 },
          },
        },
        {
          skill: 'Expressing Thoughts & Feelings',
          overallPre: 40.8, overallPost: 77.5,
          divisions: {
            Faisalabad: { pre: 24.05, post: 64.91 }, Gujranwala: { pre: 31.01, post: 67.55 },
            Gujrat:     { pre: 40.33, post: 73.95 }, Lahore:     { pre: 40.93, post: 78.79 },
            Rawalpindi: { pre: 50.95, post: 85.48 }, Sargodha:   { pre: 56.83, post: 91.89 },
          },
        },
        {
          skill: 'Speaking for an Audience',
          overallPre: 43.6, overallPost: 80.0,
          divisions: {
            Faisalabad: { pre: 23.15, post: 64.89 }, Gujranwala: { pre: 32.77, post: 74.29 },
            Gujrat:     { pre: 41.89, post: 76.93 }, Lahore:     { pre: 43.61, post: 83.49 },
            Rawalpindi: { pre: 54.15, post: 87.51 }, Sargodha:   { pre: 60.80, post: 92.75 },
          },
        },
      ],
      female: [
        {
          skill: 'Fluency',
          overallPre: 53.7, overallPost: 88.8,
          divisions: {
            Faisalabad: { pre: 39.30, post: 78.97 }, Gujranwala: { pre: 40.94, post: 83.20 },
            Gujrat:     { pre: 52.17, post: 86.34 }, Lahore:     { pre: 57.00, post: 92.39 },
            Rawalpindi: { pre: 65.74, post: 94.99 }, Sargodha:   { pre: 68.82, post: 96.09 },
          },
        },
        {
          skill: 'Speaking in Complete Sentences',
          overallPre: 48.0, overallPost: 86.6,
          divisions: {
            Faisalabad: { pre: 30.19, post: 76.97 }, Gujranwala: { pre: 37.99, post: 80.87 },
            Gujrat:     { pre: 43.13, post: 84.68 }, Lahore:     { pre: 49.16, post: 87.67 },
            Rawalpindi: { pre: 59.97, post: 94.58 }, Sargodha:   { pre: 67.72, post: 93.24 },
          },
        },
        {
          skill: 'Accuracy',
          overallPre: 52.5, overallPost: 88.5,
          divisions: {
            Faisalabad: { pre: 38.83, post: 79.58 }, Gujranwala: { pre: 41.50, post: 81.34 },
            Gujrat:     { pre: 46.09, post: 87.79 }, Lahore:     { pre: 56.43, post: 90.70 },
            Rawalpindi: { pre: 63.97, post: 96.68 }, Sargodha:   { pre: 67.75, post: 94.81 },
          },
        },
        {
          skill: 'Pronunciation',
          overallPre: 54.9, overallPost: 90.4,
          divisions: {
            Faisalabad: { pre: 36.75, post: 80.57 }, Gujranwala: { pre: 41.47, post: 83.78 },
            Gujrat:     { pre: 55.13, post: 87.65 }, Lahore:     { pre: 57.75, post: 93.42 },
            Rawalpindi: { pre: 64.48, post: 96.57 }, Sargodha:   { pre: 74.09, post: 96.30 },
          },
        },
        {
          skill: 'Vocabulary',
          overallPre: 57.6, overallPost: 92.2,
          divisions: {
            Faisalabad: { pre: 39.27, post: 84.33 }, Gujranwala: { pre: 41.45, post: 85.90 },
            Gujrat:     { pre: 58.42, post: 91.69 }, Lahore:     { pre: 60.29, post: 95.95 },
            Rawalpindi: { pre: 66.33, post: 97.27 }, Sargodha:   { pre: 80.21, post: 95.78 },
          },
        },
        {
          skill: 'Confidence',
          overallPre: 46.3, overallPost: 82.5,
          divisions: {
            Faisalabad: { pre: 26.56, post: 72.20 }, Gujranwala: { pre: 39.34, post: 75.19 },
            Gujrat:     { pre: 43.86, post: 80.06 }, Lahore:     { pre: 46.92, post: 84.03 },
            Rawalpindi: { pre: 57.29, post: 93.65 }, Sargodha:   { pre: 64.13, post: 90.03 },
          },
        },
        {
          skill: 'Asking Questions',
          overallPre: 47.3, overallPost: 84.3,
          divisions: {
            Faisalabad: { pre: 33.08, post: 71.25 }, Gujranwala: { pre: 38.85, post: 79.62 },
            Gujrat:     { pre: 40.75, post: 82.07 }, Lahore:     { pre: 51.51, post: 87.87 },
            Rawalpindi: { pre: 57.75, post: 93.19 }, Sargodha:   { pre: 62.01, post: 91.90 },
          },
        },
        {
          skill: 'Answering Questions',
          overallPre: 50.4, overallPost: 87.0,
          divisions: {
            Faisalabad: { pre: 32.73, post: 75.76 }, Gujranwala: { pre: 39.64, post: 81.65 },
            Gujrat:     { pre: 47.09, post: 83.75 }, Lahore:     { pre: 54.34, post: 90.14 },
            Rawalpindi: { pre: 60.56, post: 95.60 }, Sargodha:   { pre: 67.96, post: 92.83 },
          },
        },
        {
          skill: 'Asking & Sharing Information',
          overallPre: 53.9, overallPost: 89.7,
          divisions: {
            Faisalabad: { pre: 38.79, post: 81.31 }, Gujranwala: { pre: 40.49, post: 86.36 },
            Gujrat:     { pre: 51.27, post: 88.31 }, Lahore:     { pre: 55.52, post: 91.61 },
            Rawalpindi: { pre: 65.92, post: 96.60 }, Sargodha:   { pre: 75.41, post: 94.12 },
          },
        },
        {
          skill: 'Describing & Explaining',
          overallPre: 44.7, overallPost: 82.5,
          divisions: {
            Faisalabad: { pre: 23.25, post: 69.78 }, Gujranwala: { pre: 35.20, post: 77.20 },
            Gujrat:     { pre: 42.94, post: 80.83 }, Lahore:     { pre: 43.77, post: 84.57 },
            Rawalpindi: { pre: 58.39, post: 93.03 }, Sargodha:   { pre: 64.72, post: 90.90 },
          },
        },
        {
          skill: 'Expressing Thoughts & Feelings',
          overallPre: 42.8, overallPost: 80.1,
          divisions: {
            Faisalabad: { pre: 25.94, post: 69.27 }, Gujranwala: { pre: 34.03, post: 70.73 },
            Gujrat:     { pre: 40.91, post: 78.57 }, Lahore:     { pre: 41.26, post: 82.58 },
            Rawalpindi: { pre: 54.10, post: 90.27 }, Sargodha:   { pre: 60.41, post: 89.41 },
          },
        },
        {
          skill: 'Speaking for an Audience',
          overallPre: 45.0, overallPost: 82.5,
          divisions: {
            Faisalabad: { pre: 24.78, post: 69.29 }, Gujranwala: { pre: 35.42, post: 77.54 },
            Gujrat:     { pre: 42.76, post: 79.36 }, Lahore:     { pre: 44.73, post: 86.67 },
            Rawalpindi: { pre: 57.18, post: 91.88 }, Sargodha:   { pre: 63.84, post: 89.96 },
          },
        },
      ],
      male: [
        {
          skill: 'Fluency',
          overallPre: 48.7, overallPost: 79.8,
          divisions: {
            Faisalabad: { pre: 37.24, post: 69.42 }, Gujranwala: { pre: 39.20, post: 75.36 },
            Gujrat:     { pre: 45.00, post: 78.28 }, Lahore:     { pre: 50.32, post: 82.05 },
            Rawalpindi: { pre: 59.90, post: 85.25 }, Sargodha:   { pre: 60.38, post: 98.30 },
          },
        },
        {
          skill: 'Speaking in Complete Sentences',
          overallPre: 42.4, overallPost: 78.2,
          divisions: {
            Faisalabad: { pre: 24.96, post: 67.55 }, Gujranwala: { pre: 32.36, post: 71.10 },
            Gujrat:     { pre: 39.72, post: 76.28 }, Lahore:     { pre: 42.76, post: 76.31 },
            Rawalpindi: { pre: 54.95, post: 82.68 }, Sargodha:   { pre: 59.34, post: 97.30 },
          },
        },
        {
          skill: 'Accuracy',
          overallPre: 46.7, overallPost: 81.7,
          divisions: {
            Faisalabad: { pre: 36.29, post: 70.20 }, Gujranwala: { pre: 34.33, post: 72.29 },
            Gujrat:     { pre: 40.44, post: 80.00 }, Lahore:     { pre: 50.32, post: 80.24 },
            Rawalpindi: { pre: 59.65, post: 88.43 }, Sargodha:   { pre: 59.79, post: 98.53 },
          },
        },
        {
          skill: 'Pronunciation',
          overallPre: 47.3, overallPost: 83.0,
          divisions: {
            Faisalabad: { pre: 32.15, post: 71.27 }, Gujranwala: { pre: 39.62, post: 76.16 },
            Gujrat:     { pre: 45.61, post: 79.89 }, Lahore:     { pre: 51.30, post: 83.56 },
            Rawalpindi: { pre: 59.39, post: 87.98 }, Sargodha:   { pre: 63.49, post: 98.64 },
          },
        },
        {
          skill: 'Vocabulary',
          overallPre: 51.2, overallPost: 86.0,
          divisions: {
            Faisalabad: { pre: 37.42, post: 75.89 }, Gujranwala: { pre: 39.58, post: 78.15 },
            Gujrat:     { pre: 49.33, post: 85.22 }, Lahore:     { pre: 57.51, post: 87.88 },
            Rawalpindi: { pre: 60.45, post: 89.49 }, Sargodha:   { pre: 68.97, post: 99.57 },
          },
        },
        {
          skill: 'Confidence',
          overallPre: 40.8, overallPost: 75.3,
          divisions: {
            Faisalabad: { pre: 21.97, post: 62.26 }, Gujranwala: { pre: 36.47, post: 65.03 },
            Gujrat:     { pre: 40.11, post: 69.83 }, Lahore:     { pre: 41.33, post: 76.44 },
            Rawalpindi: { pre: 49.65, post: 82.02 }, Sargodha:   { pre: 57.52, post: 96.46 },
          },
        },
        {
          skill: 'Asking Questions',
          overallPre: 42.0, overallPost: 75.7,
          divisions: {
            Faisalabad: { pre: 28.60, post: 61.93 }, Gujranwala: { pre: 34.24, post: 69.84 },
            Gujrat:     { pre: 38.72, post: 72.50 }, Lahore:     { pre: 44.38, post: 76.15 },
            Rawalpindi: { pre: 50.35, post: 81.01 }, Sargodha:   { pre: 55.90, post: 97.52 },
          },
        },
        {
          skill: 'Answering Questions',
          overallPre: 44.6, overallPost: 79.5,
          divisions: {
            Faisalabad: { pre: 27.37, post: 66.53 }, Gujranwala: { pre: 36.60, post: 72.50 },
            Gujrat:     { pre: 41.67, post: 75.22 }, Lahore:     { pre: 47.30, post: 72.53 },
            Rawalpindi: { pre: 56.72, post: 85.56 }, Sargodha:   { pre: 58.99, post: 98.99 },
          },
        },
        {
          skill: 'Asking & Sharing Information',
          overallPre: 48.3, overallPost: 83.6,
          divisions: {
            Faisalabad: { pre: 35.39, post: 72.76 }, Gujranwala: { pre: 38.67, post: 78.71 },
            Gujrat:     { pre: 43.50, post: 81.89 }, Lahore:     { pre: 48.01, post: 81.47 },
            Rawalpindi: { pre: 60.61, post: 88.08 }, Sargodha:   { pre: 63.87, post: 98.63 },
          },
        },
        {
          skill: 'Describing & Explaining',
          overallPre: 39.7, overallPost: 75.2,
          divisions: {
            Faisalabad: { pre: 20.69, post: 60.85 }, Gujranwala: { pre: 26.98, post: 66.74 },
            Gujrat:     { pre: 39.61, post: 71.28 }, Lahore:     { pre: 42.76, post: 72.53 },
            Rawalpindi: { pre: 51.11, post: 82.02 }, Sargodha:   { pre: 58.01, post: 97.05 },
          },
        },
        {
          skill: 'Expressing Thoughts & Feelings',
          overallPre: 37.3, overallPost: 71.5,
          divisions: {
            Faisalabad: { pre: 22.03, post: 60.22 }, Gujranwala: { pre: 24.61, post: 60.80 },
            Gujrat:     { pre: 38.67, post: 68.94 }, Lahore:     { pre: 40.04, post: 68.70 },
            Rawalpindi: { pre: 45.00, post: 76.46 }, Sargodha:   { pre: 52.52, post: 94.87 },
          },
        },
        {
          skill: 'Speaking for an Audience',
          overallPre: 39.0, overallPost: 74.7,
          divisions: {
            Faisalabad: { pre: 21.40, post: 60.15 }, Gujranwala: { pre: 27.10, post: 67.40 },
            Gujrat:     { pre: 39.33, post: 69.94 }, Lahore:     { pre: 40.63, post: 75.02 },
            Rawalpindi: { pre: 48.43, post: 79.25 }, Sargodha:   { pre: 57.14, post: 96.12 },
          },
        },
      ],
    },
    teachers: { overall: [] },
  },
  meta: {
    generatedAt: '2025-12-12T00:00:00.000Z',
    studentMaxScore: 60,
    teacherMaxScore: 70,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => `${v.toFixed(1)}%`;

const ImprovementBadge = ({ value }: { value: number }) => (
  <Badge className={value >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}>
    {value >= 0 ? '+' : ''}{value.toFixed(1)}%
  </Badge>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-64 rounded-lg bg-muted" />
      <div className="h-64 rounded-lg bg-muted" />
    </div>
    <div className="h-80 rounded-lg bg-muted" />
    <div className="h-64 rounded-lg bg-muted" />
  </div>
);

// ─── Widget 1: KPI Hero ───────────────────────────────────────────────────────
const KpiSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const kpi = data.kpi[tab];

  const cards = [
    {
      label: 'Total Active Assessed',
      value: kpi.totalActiveAssessed.toLocaleString(),
      icon: Users,
      color: 'text-primary',
      bg: 'bg-blue-50',
    },
    {
      label: 'Star Performers',
      value: `${kpi.totalStarPerformers.toLocaleString()} (${kpi.starPercent}%)`,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pre-Assessment Avg',
      value: fmt(kpi.preAvgPercent),
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Post-Assessment Avg',
      value: fmt(kpi.postAvgPercent),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Programme Overview</CardTitle>
            <CardDescription>Key performance indicators for completed assessments</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-lg p-3 sm:p-4 ${c.bg}`}>
              <c.icon className={`h-5 w-5 mb-2 ${c.color}`} />
              <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight break-words">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 2: Division-wise Performance ──────────────────────────────────────
const DivisionPerformanceSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const isMobile = useIsMobile();
  const rows = data.divisionPerformance[tab];

  const chartData = rows.map((r) => ({
    division: isMobile && r.division.length > 8 ? r.division.substring(0, 7) + '…' : r.division,
    'Pre (%)': r.preAvgPercent,
    'Post (%)': r.postAvgPercent,
  }));

  // On mobile: fixed 520px so all 6 divisions always render; desktop: responsive
  const chartMinWidth = 520;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Division-wise Performance</CardTitle>
            <CardDescription>Pre vs Post assessment scores across all 6 divisions</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div style={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="division" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={42} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="Pre (%)"  fill="hsl(217 91% 35%)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Post (%)" fill="hsl(142 76% 36%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 3: Gender-Based Analysis ─────────────────────────────────────────
const GenderAnalysisSection = ({ data }: { data: ReportData }) => {
  const { female, male } = data.genderAnalysis;

  const GenderCard = ({
    label, entry, accent,
  }: { label: string; entry: GenderEntry; accent: string }) => (
    <Card className={`border-l-4 ${accent}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label} Students</CardTitle>
        <p className="text-sm text-muted-foreground">{entry.count.toLocaleString()} assessed</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pre-Assessment Avg</span>
          <span className="font-semibold">{fmt(entry.preAvgPercent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Post-Assessment Avg</span>
          <span className="font-semibold text-emerald-700">{fmt(entry.postAvgPercent)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">Overall Improvement</span>
          <ImprovementBadge value={entry.improvement} />
        </div>
        {entry.byDivision.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">By Division (Post %)</p>
            <div className="space-y-1">
              {entry.byDivision.map((d) => (
                <div key={d.divisionId} className="flex justify-between text-xs gap-2">
                  <span className="text-muted-foreground truncate">{d.division}</span>
                  <span className="font-medium shrink-0">{fmt(d.postAvgPercent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Gender-Based Analysis</CardTitle>
        <CardDescription>Pre & Post score comparison by gender (students only)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <GenderCard label="Female" entry={female} accent="border-l-pink-500" />
          <GenderCard label="Male"   entry={male}   accent="border-l-blue-500" />
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 4: Skill-wise Shift ───────────────────────────────────────────────
const SkillShiftSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const isMobile = useIsMobile();
  const skills = data.skillShift[tab];

  // On mobile: shorten labels to fit; on desktop: full labels
  const chartData = skills.map((s) => ({
    skill: isMobile
      ? (s.skill.length > 18 ? `${s.skill.substring(0, 16)}…` : s.skill)
      : s.skill,
    'Pre (%)':  s.prePercent,
    'Post (%)': s.postPercent,
  }));

  const yAxisWidth  = isMobile ? 130 : 210;
  const labelMaxLen = isMobile ? 18 : 28;
  const rowHeight   = isMobile ? 30 : 36;
  // minimum chart width so bars always get enough space on mobile
  const minChartWidth = isMobile ? 320 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Skill-wise Improvement</CardTitle>
            <CardDescription>Pre vs Post scores across all assessed skill competencies</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students (12)</TabsTrigger>
              <TabsTrigger value="teachers">Teachers (14)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div style={minChartWidth ? { minWidth: minChartWidth } : undefined}>
            <ResponsiveContainer width="100%" height={skills.length * rowHeight + 40}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: isMobile ? 24 : 40, left: 4, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="skill"
                  width={yAxisWidth}
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  tickFormatter={(v: string) => v.length > labelMaxLen ? `${v.substring(0, labelMaxLen - 1)}…` : v}
                />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="Pre (%)"  fill="hsl(217 91% 35%)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Post (%)" fill="hsl(142 76% 36%)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 5: Star Performers Table ─────────────────────────────────────────
const StarPerformersSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const rows = data.starPerformers[tab];

  const totalCount = rows.reduce((s, r) => s + (r.totalStudents ?? r.totalTeachers ?? 0), 0);
  const totalStar  = rows.reduce((s, r) => s + r.starPerformers, 0);
  const totalPct   = totalCount ? ((totalStar / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Star Performers
            </CardTitle>
            <CardDescription>
              Participants marked as star performers (same definition as Leaderboard).
            </CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <Table className="min-w-[340px]">
            <TableHeader>
              <TableRow>
                <TableHead>Division</TableHead>
                <TableHead className="text-right">
                  <span className="hidden sm:inline">{tab === 'students' ? 'Total Students' : 'Total Teachers'}</span>
                  <span className="sm:hidden">Total</span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="hidden sm:inline">Star Performers</span>
                  <span className="sm:hidden">Stars</span>
                </TableHead>
                <TableHead className="text-right">Star %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.divisionId}>
                  <TableCell className="font-medium text-xs sm:text-sm">{r.division}</TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">{(r.totalStudents ?? r.totalTeachers ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">{r.starPerformers.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <ImprovementBadge value={r.starPercent} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableBody>
              <TableRow className="border-t-2 font-semibold bg-muted/40">
                <TableCell className="text-xs sm:text-sm">Total</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{totalCount.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{totalStar.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <ImprovementBadge value={parseFloat(totalPct)} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 6: Assessment-wise Progress Tables ────────────────────────────────
const ProgressTablesSection = ({ data }: { data: ReportData }) => {
  const [entityTab, setEntityTab]  = useState<'students' | 'teachers'>('students');
  const [genderTab, setGenderTab]  = useState<'overall' | 'female' | 'male'>('overall');

  const handleEntityChange = (v: string) => {
    setEntityTab(v as any);
    if (v === 'teachers') setGenderTab('overall');
  };

  const rows: ProgressRow[] = entityTab === 'students'
    ? data.progressTables.students[genderTab]
    : data.progressTables.teachers.overall;

  // Collect all division names from first row (if available)
  const divisions = rows.length > 0 ? Object.keys(rows[0].divisions) : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Assessment-wise Progress</CardTitle>
            <CardDescription>Skill-level Pre → Post percentage shift by division</CardDescription>
          </div>
          <Tabs value={entityTab} onValueChange={handleEntityChange}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {entityTab === 'students' && (
          <Tabs value={genderTab} onValueChange={(v) => setGenderTab(v as any)} className="mt-2">
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="female">Female</TabsTrigger>
              <TabsTrigger value="male">Male</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No completed assessment data available.</p>
        ) : (
          <Table className="min-w-[900px] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Skill</TableHead>
                <TableHead className="text-center" colSpan={2}>Overall</TableHead>
                {divisions.map((d) => (
                  <TableHead key={d} className="text-center" colSpan={2}>{d}</TableHead>
                ))}
              </TableRow>
              <TableRow className="text-[11px]">
                <TableHead />
                <TableHead className="text-center text-blue-700">Pre</TableHead>
                <TableHead className="text-center text-emerald-700">Post</TableHead>
                {divisions.map((d) => (
                  <>
                    <TableHead key={`${d}-pre`}  className="text-center text-blue-700">Pre</TableHead>
                    <TableHead key={`${d}-post`} className="text-center text-emerald-700">Post</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.skill}>
                  <TableCell className="font-medium">{row.skill}</TableCell>
                  <TableCell className="text-center text-blue-700">{fmt(row.overallPre)}</TableCell>
                  <TableCell className="text-center text-emerald-700 font-semibold">{fmt(row.overallPost)}</TableCell>
                  {divisions.map((d) => (
                    <>
                      <TableCell key={`${d}-pre`}  className="text-center text-blue-700">{fmt(row.divisions[d]?.pre ?? 0)}</TableCell>
                      <TableCell key={`${d}-post`} className="text-center text-emerald-700">{fmt(row.divisions[d]?.post ?? 0)}</TableCell>
                    </>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PrePostAssessmentReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const res = await getPrePostAssessmentReport();
        setReport(res.data ?? PDF_FALLBACK_DATA);
      } catch (err) {
        console.error('Failed to load Pre & Post Assessment Report – using PDF data', err);
        setReport(PDF_FALLBACK_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports/pre-post-assessment')} className="mt-1 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pre & Post Assessment Final Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive analysis of student and teacher spoken English assessment outcomes across all divisions of Punjab.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !report ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No report data available. Ensure assessments have been completed.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <KpiSection data={report} />
          <DivisionPerformanceSection data={report} />
          <GenderAnalysisSection data={report} />
          <SkillShiftSection data={report} />
          <StarPerformersSection data={report} />
          <ProgressTablesSection data={report} />

          {/* Meta footer */}
          <p className="text-xs text-muted-foreground text-right">
            Report generated: {new Date(report.meta.generatedAt).toLocaleString()} ·
            Max score: {report.meta.studentMaxScore} (students), {report.meta.teacherMaxScore} (teachers)
          </p>
        </div>
      )}
    </div>
  );
};

export default PrePostAssessmentReport;
