import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { X, Plus, AlertTriangle, CheckCircle, FileUp, Download } from "lucide-react";
import { EditorialConstraintsService, EditorialConstraints, ConstraintValidationResult } from "@/services/content/editorialConstraintsService";
import { toast } from "@/hooks/use-toast";

interface EditorialConstraintsFormProps {
  initialConstraints?: Partial<EditorialConstraints>;
  onConstraintsChange: (constraints: EditorialConstraints) => void;
  industry?: string;
  editorialGuidelines?: string;
  className?: string;
}

export const EditorialConstraintsForm: React.FC<EditorialConstraintsFormProps> = ({
  initialConstraints,
  onConstraintsChange,
  industry,
  editorialGuidelines,
  className
}) => {
  const [constraints, setConstraints] = useState<EditorialConstraints>({
    forbiddenTerms: [],
    forbiddenPhrases: [],
    forbiddenTones: [],
    mandatoryTerms: [],
    constraintPriority: 'high',
    ...initialConstraints
  });

  const [newTerm, setNewTerm] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [newTone, setNewTone] = useState('');
  const [newMandatory, setNewMandatory] = useState('');
  const [validation, setValidation] = useState<ConstraintValidationResult | null>(null);
  const [autoParseText, setAutoParseText] = useState('');

  const constraintsService = EditorialConstraintsService.getInstance();

  useEffect(() => {
    onConstraintsChange(constraints);
    
    // Validate constraints when they change
    if (industry) {
      // Mock industry config for validation
      const mockIndustryConfig = { keywords: [], tone: 'professionnel' };
      const validationResult = constraintsService.validateConstraints(
        constraints, 
        mockIndustryConfig, 
        ''
      );
      setValidation(validationResult);
    }
  }, [constraints, onConstraintsChange, industry]);

  // Auto-parse editorial guidelines on component mount
  useEffect(() => {
    if (editorialGuidelines && (!initialConstraints || Object.keys(initialConstraints).length === 0)) {
      handleAutoParse(editorialGuidelines);
    }
  }, [editorialGuidelines]);

  const handleAutoParse = (text: string) => {
    const parsed = constraintsService.parseEditorialGuidelines(text);
    setConstraints(prev => ({
      ...prev,
      forbiddenTerms: [...prev.forbiddenTerms, ...(parsed.forbiddenTerms || [])],
      forbiddenPhrases: [...prev.forbiddenPhrases, ...(parsed.forbiddenPhrases || [])],
      forbiddenTones: [...prev.forbiddenTones, ...(parsed.forbiddenTones || [])],
      mandatoryTerms: [...prev.mandatoryTerms, ...(parsed.mandatoryTerms || [])],
    }));
    
    toast({
      title: "Contraintes extraites",
      description: `${(parsed.forbiddenTerms?.length || 0) + (parsed.forbiddenPhrases?.length || 0)} éléments détectés automatiquement`
    });
  };

  const addItem = (type: keyof EditorialConstraints, value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    
    const currentArray = constraints[type] as string[];
    if (currentArray.includes(value.trim())) {
      toast({
        title: "Élément déjà présent",
        description: `"${value}" est déjà dans la liste`,
        variant: "destructive"
      });
      return;
    }

    setConstraints(prev => ({
      ...prev,
      [type]: [...currentArray, value.trim()]
    }));
    setter('');
  };

  const removeItem = (type: keyof EditorialConstraints, index: number) => {
    const currentArray = constraints[type] as string[];
    setConstraints(prev => ({
      ...prev,
      [type]: currentArray.filter((_, i) => i !== index)
    }));
  };

  const loadSuggestions = () => {
    if (!industry) return;
    
    const suggestions = constraintsService.getSuggestedForbiddenTerms(industry);
    setConstraints(prev => ({
      ...prev,
      forbiddenTerms: [...new Set([...prev.forbiddenTerms, ...suggestions])]
    }));
    
    toast({
      title: "Suggestions chargées",
      description: `${suggestions.length} termes ajoutés pour le secteur ${industry}`
    });
  };

  const exportConstraints = () => {
    const exported = constraintsService.exportConstraints(constraints);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contraintes-editoriales-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConstraints = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const imported = constraintsService.importConstraints(content);
      if (imported) {
        setConstraints(imported);
        toast({
          title: "Import réussi",
          description: "Contraintes importées avec succès"
        });
      }
    };
    reader.readAsText(file);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const totalConstraints = constraints.forbiddenTerms.length + 
                         constraints.forbiddenPhrases.length + 
                         constraints.forbiddenTones.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Contraintes Éditoriales
              <Badge variant="outline">{totalConstraints} contraintes</Badge>
            </CardTitle>
            <CardDescription>
              Définissez les termes, expressions et tons à éviter ou privilégier
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportConstraints}
              disabled={totalConstraints === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importConstraints}
              style={{ display: 'none' }}
              id="import-constraints"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-constraints')?.click()}
            >
              <FileUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Priority Setting */}
        <div className="space-y-2">
          <Label>Niveau de priorité des contraintes</Label>
          <Select
            value={constraints.constraintPriority}
            onValueChange={(value: any) => 
              setConstraints(prev => ({ ...prev, constraintPriority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible - Suggestions</SelectItem>
              <SelectItem value="medium">Moyen - Préférences</SelectItem>
              <SelectItem value="high">Élevé - Contraintes strictes</SelectItem>
              <SelectItem value="critical">Critique - Zéro tolérance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Validation Alert */}
        {validation && validation.conflicts.length > 0 && (
          <Alert variant={getSeverityColor(validation.severity) as any}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  {validation.conflicts.length} conflit(s) détecté(s) - Niveau: {validation.severity}
                </p>
                {validation.conflicts.slice(0, 2).map((conflict, index) => (
                  <p key={index} className="text-sm opacity-90">
                    • {conflict.suggestion}
                  </p>
                ))}
                {validation.conflicts.length > 2 && (
                  <p className="text-sm opacity-75">
                    ... et {validation.conflicts.length - 2} autre(s)
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="forbidden" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forbidden">Interdictions</TabsTrigger>
            <TabsTrigger value="mandatory">Préférences</TabsTrigger>
            <TabsTrigger value="autoparse">Auto-analyse</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="forbidden" className="space-y-4">
            {/* Forbidden Terms */}
            <div className="space-y-3">
              <div>
                <Label>Mots interdits</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ajouter un mot interdit..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('forbiddenTerms', newTerm, setNewTerm);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => addItem('forbiddenTerms', newTerm, setNewTerm)}
                    disabled={!newTerm.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {constraints.forbiddenTerms.map((term, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {term}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeItem('forbiddenTerms', index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Forbidden Phrases */}
              <div>
                <Label>Expressions interdites</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ajouter une expression interdite..."
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('forbiddenPhrases', newPhrase, setNewPhrase);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => addItem('forbiddenPhrases', newPhrase, setNewPhrase)}
                    disabled={!newPhrase.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {constraints.forbiddenPhrases.map((phrase, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {phrase}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeItem('forbiddenPhrases', index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Forbidden Tones */}
              <div>
                <Label>Tons proscrits</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ajouter un ton à éviter..."
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('forbiddenTones', newTone, setNewTone);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => addItem('forbiddenTones', newTone, setNewTone)}
                    disabled={!newTone.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {constraints.forbiddenTones.map((tone, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tone}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeItem('forbiddenTones', index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mandatory" className="space-y-4">
            <div>
              <Label>Termes à privilégier</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Ajouter un terme à privilégier..."
                  value={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addItem('mandatoryTerms', newMandatory, setNewMandatory);
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={() => addItem('mandatoryTerms', newMandatory, setNewMandatory)}
                  disabled={!newMandatory.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {constraints.mandatoryTerms.map((term, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {term}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeItem('mandatoryTerms', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="autoparse" className="space-y-4">
            <div>
              <Label>Analyse automatique des guidelines</Label>
              <Textarea
                placeholder="Collez ici vos guidelines éditoriales pour extraction automatique..."
                value={autoParseText}
                onChange={(e) => setAutoParseText(e.target.value)}
                rows={6}
              />
              <Button 
                onClick={() => handleAutoParse(autoParseText)}
                disabled={!autoParseText.trim()}
                className="mt-2"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Extraire les contraintes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Suggestions basées sur votre secteur d'activité ({industry || 'non défini'})
              </p>
              <Button 
                onClick={loadSuggestions}
                disabled={!industry}
                variant="outline"
              >
                Charger les suggestions sectorielles
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};