import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import WeeklyReportModal from '@/components/reports/WeeklyReportModal';
import {
  fetchMondayModalReport,
  markWeeklyReportSeen,
  type WeeklyReport,
} from '@/utils/weeklyReport';

/**
 * Shows the finalized PREVIOUS-week report only on Monday at/after 8:00 AM,
 * and only until the user dismisses it (seenAt).
 */
const WeeklyReportGate = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchMondayModalReport();
        if (cancelled || !data.show || !data.report) return;
        setReport(data.report);
        setOpen(true);
      } catch (err) {
        console.error('Monday weekly report check failed:', err);
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
      variant="last-week"
    />
  );
};

export default WeeklyReportGate;
