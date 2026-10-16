import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Send, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'general' | 'visit' | 'reminder' | 'followup';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();

  if (s === 'due_today' || s === 'due today') {
    return (
      <span className="badge badge-warning">
        <Clock size={12} /> Due Today
      </span>
    );
  }

  if (s === 'overdue') {
    return (
      <span className="badge badge-danger">
        <AlertTriangle size={12} /> Overdue
      </span>
    );
  }

  if (s === 'due_this_week' || s === 'due this week') {
    return (
      <span className="badge badge-info">
        <Clock size={12} /> Due This Week
      </span>
    );
  }

  if (s === 'completed') {
    return (
      <span className="badge badge-success">
        <CheckCircle size={12} /> Completed
      </span>
    );
  }

  if (s === 'scheduled') {
    return (
      <span className="badge badge-info">
        <Clock size={12} /> Scheduled
      </span>
    );
  }

  if (s === 'cancelled' || s === 'no_show') {
    return (
      <span className="badge badge-neutral">
        <XCircle size={12} /> {s === 'no_show' ? 'No Show' : 'Cancelled'}
      </span>
    );
  }

  if (s === 'sent' || s === 'delivered') {
    return (
      <span className="badge badge-success">
        <Check size={12} /> Sent & Delivered
      </span>
    );
  }

  if (s === 'pending') {
    return (
      <span className="badge badge-warning">
        <Clock size={12} /> Pending
      </span>
    );
  }

  if (s === 'processing') {
    return (
      <span className="badge badge-info">
        <Send size={12} /> Dispatching...
      </span>
    );
  }

  if (s === 'failed') {
    return (
      <span className="badge badge-danger">
        <XCircle size={12} /> Delivery Failed
      </span>
    );
  }

  if (s === 'active') {
    return (
      <span className="badge badge-success">
        <CheckCircle size={12} /> Active
      </span>
    );
  }

  if (s === 'inactive') {
    return (
      <span className="badge badge-neutral">
        <XCircle size={12} /> Inactive
      </span>
    );
  }

  return <span className="badge badge-neutral">{status}</span>;
};
