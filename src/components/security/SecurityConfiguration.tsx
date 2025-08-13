/**
 * Security Configuration Component
 * Displays security settings and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Lock, Database, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurityConfigurationProps {
  className?: string;
}

export function SecurityConfiguration({ className }: SecurityConfigurationProps) {
  const securityItems = [
    {
      title: "Protection contre les mots de passe compromis",
      description: "Empêche l'utilisation de mots de passe connus comme compromis",
      status: "requires_manual_setup",
      icon: Lock,
      action: {
        text: "Configurer dans Supabase",
        url: "https://supabase.com/dashboard/project/lbmfkppvzimklebisefm/auth/providers"
      },
      details: "Cette fonctionnalité doit être activée manuellement dans les paramètres d'authentification Supabase."
    },
    {
      title: "Politiques RLS renforcées",
      description: "Row Level Security configuré pour toutes les tables sensibles",
      status: "configured",
      icon: Database,
      details: "✅ API Keys, Sessions utilisateur, Profils et Données d'audit sécurisés"
    },
    {
      title: "Chiffrement des clés API",
      description: "Toutes les clés API sont chiffrées en base de données",
      status: "configured",
      icon: Key,
      details: "✅ Chiffrement AES avec salage unique par utilisateur"
    },
    {
      title: "Monitoring de sécurité",
      description: "Surveillance des activités suspectes et tentatives d'intrusion",
      status: "configured",
      icon: Shield,
      details: "✅ Journalisation des événements de sécurité et détection d'anomalies"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "configured":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Configuré</Badge>;
      case "requires_manual_setup":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Action requise</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configuration de sécurité
          </CardTitle>
          <CardDescription>
            État actuel des mesures de sécurité implémentées dans votre application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Status Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Action requise :</strong> La protection contre les mots de passe compromis doit être activée manuellement 
              dans les paramètres Supabase pour une sécurité optimale.
            </AlertDescription>
          </Alert>

          {/* Security Items */}
          <div className="space-y-4">
            {securityItems.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <item.icon className="w-5 h-5 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.title}</h4>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.details}
                  </p>
                  {item.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(item.action!.url, '_blank')}
                    >
                      {item.action.text}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Security Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Résumé des améliorations de sécurité</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Politiques RLS strictes pour l'isolation des données utilisateur</li>
              <li>• Chiffrement des clés API avec gestion sécurisée des secrets</li>
              <li>• Validation renforcée des mots de passe (8+ caractères, complexité)</li>
              <li>• Limitation du nombre de sessions simultanées (max 5)</li>
              <li>• Journalisation complète des événements de sécurité</li>
              <li>• Fonctions de base de données sécurisées avec search_path</li>
              <li>• Surveillance automatique des activités suspectes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}