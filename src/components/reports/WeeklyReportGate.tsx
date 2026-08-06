import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import WeeklyReportModal from '@/components/reports/WeeklyReportModal';
import {
  fetchLatestWeeklyReport,
  markWeeklyReportSeen,
  type WeeklyReport,
} from '@/utils/weeklyReport';

const WeeklyReportGate = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { report: latest, unseen } = await fetchLatestWeeklyReport();
        if (cancelled || !latest) return;

        setReport(latest);
        if (unseen) {
          setOpen(true);
        }
      } catch (err) {
        console.error('Weekly report check failed:', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleDismiss = async () => {
    if (report?._id) {
      await markWeeklyReportSeen(report._id).catch(() => undefined);
    }
    setOpen(false);
  };

  return (
    <WeeklyReportModal
      report={report}
      open={open}
      onOpenChange={(next) => {
        if (!next) handleDismiss();
        else setOpen(true);
      }}
      onDismiss={handleDismiss}
    />
  );
};

export default WeeklyReportGate;
