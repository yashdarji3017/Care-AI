import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Send,
  Check,
  Activity,
} from 'lucide-react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: string;
  type?: 'general' | 'visit' | 'reminder' | 'followup';
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const s = status ? status.toLowerCase() : '';

  let label: React.ReactNode = status;
  let icon: React.ReactElement | undefined = undefined;
  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';

  if (s === 'due_today' || s === 'due today') {
    label = 'Due Today';
    icon = <Clock size={12} />;
    bg = '#fef3c7';
    color = '#92400e';
    border = '#fde68a';
  } else if (s === 'overdue') {
    label = 'Overdue';
    icon = <AlertTriangle size={12} />;
    bg = '#fee2e2';
    color = '#991b1b';
    border = '#fca5a5';
  } else if (s === 'due_this_week' || s === 'due this week') {
    label = 'Due This Week';
    icon = <Clock size={12} />;
    bg = '#e0f2fe';
    color = '#0369a1';
    border = '#bae6fd';
  } else if (s === 'completed') {
    label = 'Completed';
    icon = <CheckCircle size={12} />;
    bg = '#ecfdf5';
    color = '#065f46';
    border = '#a7f3d0';
  } else if (s === 'scheduled') {
    label = 'Scheduled';
    icon = <Clock size={12} />;
    bg = '#e0f2fe';
    color = '#0284c7';
    border = '#bae6fd';
  } else if (s === 'cancelled' || s === 'no_show') {
    label = s === 'no_show' ? 'No Show' : 'Cancelled';
    icon = <XCircle size={12} />;
    bg = '#f1f5f9';
    color = '#64748b';
    border = '#e2e8f0';
  } else if (s === 'sent' || s === 'delivered') {
    label = 'Delivered';
    icon = <Check size={12} />;
    bg = '#ecfdf5';
    color = '#047857';
    border = '#6ee7b7';
  } else if (s === 'pending') {
    label = 'Pending';
    icon = <Clock size={12} />;
    bg = '#fef3c7';
    color = '#b45309';
    border = '#fde68a';
  } else if (s === 'processing') {
    label = 'Dispatching...';
    icon = <Send size={12} />;
    bg = '#e0f2fe';
    color = '#0369a1';
    border = '#93c5fd';
  } else if (s === 'failed') {
    label = 'Delivery Failed';
    icon = <XCircle size={12} />;
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  } else if (s === 'active') {
    label = 'Active';
    icon = <CheckCircle size={12} />;
    bg = '#ecfdf5';
    color = '#047857';
    border = '#a7f3d0';
  } else if (s === 'inactive') {
    label = 'Inactive';
    icon = <XCircle size={12} />;
    bg = '#f1f5f9';
    color = '#64748b';
    border = '#e2e8f0';
  } else if (s === 'follow_up' || s === 'followup') {
    label = 'Follow Up';
    icon = <Activity size={12} />;
    bg = '#f0fdf4';
    color = '#15803d';
    border = '#bbf7d0';
  } else if (s === 'new') {
    label = 'New Visit';
    icon = <Activity size={12} />;
    bg = '#eff6ff';
    color = '#1d4ed8';
    border = '#bfdbfe';
  }

  return (
    <Chip
      size={size}
      icon={icon}
      label={label}
      sx={{
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        fontWeight: 700,
        fontSize: '0.73rem',
        height: size === 'small' ? '22px' : '26px',
        '& .MuiChip-icon': {
          color: color,
          marginLeft: '6px',
        },
      }}
    />
  );
};
