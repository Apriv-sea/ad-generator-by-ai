import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Key, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureSession } from '@/hooks/useSecureSession';
import { SessionSecurityService } from '@/services/security/sessionSecurityService';

interface SecurityStats {
  activeSessions: number;
  apiKeyCount: number;
  recentSuspiciousActivities: number;
  lastPasswordChange: string | null;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  event_data: any;
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    apiKeyCount: 0,
    recentSuspiciousActivities: 0,
    lastPasswordChange: null
  });
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { suspiciousActivity, invalidateAllSessions } = useSecureSession();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get active sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('count')
        .eq('user_id', user.user.id)
        .eq('is_active', true);

      // Get API keys count
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('count')
        .eq('user_id', user.user.id);

      // Get recent security events
      const { data: events } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.user.id)
        .in('event_type', ['suspicious_activity', 'failed_login', 'api_key_access'])
        .order('created_at', { ascending: false })
        .limit(10);

      // Count suspicious activities in last 24 hours
      const { data: suspiciousCount } = await supabase
        .from('user_analytics')
        .select('count')
        .eq('user_id', user.user.id)
        .eq('event_type', 'suspicious_activity')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setStats({
        activeSessions: sessions?.[0]?.count || 0,
        apiKeyCount: apiKeys?.[0]?.count || 0,
        recentSuspiciousActivities: suspiciousCount?.[0]?.count || 0,
        lastPasswordChange: null // Would need to track this separately
      });

      setRecentEvents(events || []);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateAllSessions = async () => {
    try {
      await invalidateAllSessions();
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to invalidate sessions:', error);
    }
  };

  const handleCleanupExpiredSessions = async () => {
    try {
      await SessionSecurityService.cleanupExpiredSessions();
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading security dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
      </div>

      {suspiciousActivity && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Suspicious activity detected on your account. Consider reviewing your active sessions.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiKeyCount}</div>
            <p className="text-xs text-muted-foreground">
              Stored encrypted API keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.recentSuspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="outline">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Session status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Manage your active sessions and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleInvalidateAllSessions}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Invalidate All Sessions
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCleanupExpiredSessions}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              Cleanup Expired Sessions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>
              Latest security-related activities on your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent security events</p>
              ) : (
                recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">{event.event_type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={event.event_type.includes('suspicious') ? 'destructive' : 'default'}>
                      {event.event_type.includes('suspicious') ? 'Warning' : 'Info'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}