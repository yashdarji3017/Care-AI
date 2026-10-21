import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Users,
  Calendar,
  FileText,
  Bell,
  Database,
  BarChart2,
  Search,
  ChevronDown,
  LogOut,
  Heart,
  Activity,
  X,
  Phone,
  Mail,
  User as UserIcon,
  Menu as MenuIcon,
} from 'lucide-react';
import {
  Tooltip,
  Menu,
  Chip,
  IconButton,
  Popover,
  Box,
  Typography,
  Avatar,
  Button,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  // Mobile Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Menu state
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(profileAnchorEl);

  // Notification Popover state
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const openNotifPopover = Boolean(notifAnchorEl);

  // Search input state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'follow-ups', label: 'Follow-Up Schedule', icon: Calendar },
    { id: 'visits', label: 'Visits & Notes', icon: FileText },
    { id: 'reminders', label: 'WhatsApp Reminders', icon: Bell, hasBadgeDot: true },
    { id: 'catalogs', label: 'Diseases & Medicines', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <div style={{
      position: 'sticky',
      top: '0.65rem',
      zIndex: 1000,
      width: '100%',
      maxWidth: '1440px',
      margin: '0.5rem auto 0.5rem',
      padding: '0 0.75rem',
    }}>
      <header style={{
        background: '#ffffff',
        borderRadius: '999px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
        padding: '0.35rem 0.85rem 0.35rem 0.65rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: '56px',
        gap: '0.5rem',
      }}>
        {/* Left Section: Brand / Logo (Without 'Clinical Management System' subtitle) */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {/* Teal Circular Icon with Heart & Pulse */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
              flexShrink: 0,
            }}>
              <Heart size={21} color="#ffffff" strokeWidth={2.2} fill="transparent" />
              <Activity
                size={12}
                color="#ffffff"
                strokeWidth={2.5}
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            </div>

            {/* Clean Brand Title */}
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#1e293b',
              letterSpacing: '-0.025em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              PatientCare <span style={{ color: '#2563eb' }}>AI</span>
            </div>
          </div>

          {/* Thin Vertical Separator */}
          <div style={{
            width: '1px',
            height: '26px',
            background: '#e2e8f0',
            margin: '0 0.5rem 0 0.75rem',
          }} />
        </div>

        {/* Center Section: Navigation Tabs (All 7 fully displayed without cut-off) */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem',
            flexWrap: 'nowrap',
            overflowX: 'visible',
            flexShrink: 1,
            justifyContent: 'center',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: isActive ? '0.38rem 0.75rem' : '0.38rem 0.55rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#64748b',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#1e293b';
                      e.currentTarget.style.background = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#64748b';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Icon with optional notification dot */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon
                      size={15}
                      color={isActive ? '#2563eb' : '#64748b'}
                      fill={isActive && item.id === 'dashboard' ? '#2563eb' : 'none'}
                    />
                    {item.hasBadgeDot && (
                      <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-3px',
                        width: '6.5px',
                        height: '6.5px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        border: '1.5px solid #ffffff',
                      }} />
                    )}
                  </div>

                  <span>{item.label}</span>
                </button>

                {/* Underline Indicator for Active Tab */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    width: '32px',
                    height: '2.5px',
                    background: '#2563eb',
                    borderRadius: '999px',
                  }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Section: Search, Notifications & Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Quick Search */}
          <div style={{ position: 'relative' }}>
            <Tooltip title="Quick Search" arrow>
              <IconButton
                onClick={() => setSearchOpen(!searchOpen)}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: searchOpen ? '#e0f2fe' : '#f8fafc',
                  border: '1px solid #f1f5f9',
                  color: searchOpen ? '#0284c7' : '#64748b',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
                }}
              >
                <Search size={16} />
              </IconButton>
            </Tooltip>

            {searchOpen && (
              <div style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                width: '270px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 100,
              }}>
                <Search size={15} color="#94a3b8" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setActiveTab('patients');
                      setSearchOpen(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                  }}
                />
                <IconButton size="small" onClick={() => setSearchOpen(false)}>
                  <X size={14} color="#94a3b8" />
                </IconButton>
              </div>
            )}
          </div>

          {/* Improved Notification Bell with Red Badge */}
          <div style={{ position: 'relative' }}>
            <Tooltip title="Notifications (3 Alerts)" arrow>
              <IconButton
                onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  color: '#64748b',
                  position: 'relative',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
                }}
              >
                <Bell size={17} />
                <span style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.35)',
                }}>
                  3
                </span>
              </IconButton>
            </Tooltip>

            {/* Notification Popover */}
            <Popover
              open={openNotifPopover}
              anchorEl={notifAnchorEl}
              onClose={() => setNotifAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: { width: 310, p: 2, borderRadius: 3, boxShadow: '0 12px 30px rgba(0,0,0,0.1)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  Clinical Alerts
                </Typography>
                <Chip label="3 New" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 800, height: 20, fontSize: '0.68rem' }} />
              </Box>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div
                  onClick={() => { setActiveTab('reminders'); setNotifAnchorEl(null); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '10px', cursor: 'pointer' }}
                >
                  <Phone size={15} color="#0d9488" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>WhatsApp Reminder Queue</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>1 scheduled message pending dispatch.</div>
                  </div>
                </div>
                <div
                  onClick={() => { setActiveTab('follow-ups'); setNotifAnchorEl(null); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '10px', cursor: 'pointer' }}
                >
                  <Calendar size={15} color="#0284c7" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>Upcoming Follow-ups</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>2 patient follow-ups scheduled for this week.</div>
                  </div>
                </div>
              </div>
            </Popover>
          </div>

          {/* Profile Mint Avatar + Chevron Dropdown */}
          <div
            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              padding: '0.15rem 0.25rem 0.15rem 0.15rem',
              borderRadius: '999px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#ccfbf1',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #a7f3d0',
              flexShrink: 0,
            }}>
              <Users size={17} color="#0d9488" strokeWidth={2.2} />
            </div>
            <ChevronDown size={15} color="#64748b" />
          </div>

          {/* Profile Dropdown: Displays ONLY the Logged-In User's Data */}
          <Menu
            anchorEl={profileAnchorEl}
            open={openProfileMenu}
            onClose={() => setProfileAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: 280,
                  borderRadius: 3.5,
                  p: 0,
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                },
              },
            }}
          >
            {user ? (
              <Box sx={{ p: 2 }}>
                {/* User Identity Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: '#ccfbf1',
                      color: '#0d9488',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      border: '1.5px solid #a7f3d0',
                    }}
                  >
                    {user.full_name ? user.full_name[0] : 'U'}
                  </Avatar>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.full_name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mt: '2px' }}>
                      @{user.username}
                    </Typography>
                  </Box>
                </Box>

                {/* Logged-In User Details Card */}
                <Box sx={{
                  p: 1.25,
                  bgcolor: '#f8fafc',
                  borderRadius: 2.5,
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.85,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active Role</Typography>
                    <Chip
                      label={user.role.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        height: 20,
                        bgcolor: user.role === 'admin' ? '#f3e8ff' : user.role === 'doctor' ? '#e0f2fe' : '#ecfdf5',
                        color: user.role === 'admin' ? '#7e22ce' : user.role === 'doctor' ? '#0369a1' : '#047857',
                      }}
                    />
                  </Box>

                  {user.email && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Email</Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 600, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Session</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      <Typography sx={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Authenticated</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Sign Out Action */}
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  size="small"
                  startIcon={<LogOut size={15} />}
                  onClick={() => {
                    setProfileAnchorEl(null);
                    logout();
                  }}
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    borderColor: '#fecaca',
                    color: '#ef4444',
                    '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>No active session found.</Typography>
              </Box>
            )}
          </Menu>

          {/* Mobile Menu Toggle Button (Visible only on tablets & mobile screens) */}
          <div className="mobile-nav-toggle" style={{ display: 'none' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="small"
              sx={{
                width: 36,
                height: 36,
                backgroundColor: mobileMenuOpen ? '#eff6ff' : '#f8fafc',
                border: '1px solid #e2e8f0',
                color: mobileMenuOpen ? '#2563eb' : '#64748b',
                '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            marginTop: '0.5rem',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 30px -10px rgba(15, 23, 42, 0.18)',
            padding: '0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#334155',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? '#2563eb' : '#64748b'} />
                  <span>{item.label}</span>
                </div>
                {item.hasBadgeDot && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    Alert
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
