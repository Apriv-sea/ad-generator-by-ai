
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          ← Retour
        </Button>

        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Règles de confidentialité</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour: {currentDate}</p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="prose max-w-none text-left">
              <h2 className="text-xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                Ad Content Generator ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons et 
                protégeons vos données personnelles lorsque vous utilisez notre application.
              </p>

              <h2 className="text-xl font-semibold mb-4 mt-8">Données que nous collectons</h2>
              <p className="mb-2">Nous pouvons collecter les types d'informations suivants:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Informations de compte:</strong> Lorsque vous vous inscrivez, nous 
                  collectons votre adresse e-mail et les informations de base de votre profil.
                </li>
                <li>
                  <strong>Données d'authentification Google:</strong> Si vous vous connectez via Google, 
                  nous recevons les informations de base de votre profil Google (nom, email, photo de profil).
                </li>
                <li>
                  <strong>Données des documents Google Drive:</strong> Nous accédons uniquement aux 
                  documents Google Sheets que vous nous autorisez explicitement à lire ou à modifier.
                </li>
                <li>
                  <strong>Informations sur les clients et campagnes:</strong> Les données que vous 
                  saisissez concernant vos clients et campagnes publicitaires.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 mt-8">Comment nous utilisons vos données</h2>
              <p className="mb-2">Nous utilisons vos données pour les finalités suivantes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Fournir et améliorer notre service de génération de contenu publicitaire</li>
                <li>Permettre l'intégration avec Google Sheets pour importer et exporter des données</li>
                <li>Authentifier votre identité et maintenir votre session</li>
                <li>Vous contacter concernant votre compte ou nos services</li>
                <li>Analyser l'utilisation de notre application pour l'améliorer</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 mt-8">Partage des données</h2>
              <p className="mb-4">
                Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos données avec:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Fournisseurs de services:</strong> Nous utilisons des services tiers comme 
                  Supabase pour l'authentification et le stockage, et des API d'IA pour la génération de contenu.
                </li>
                <li>
                  <strong>Autorités légales:</strong> Si nous sommes légalement tenus de le faire.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 mt-8">Sécurité des données</h2>
              <p className="mb-4">
                Nous prenons la sécurité de vos données très au sérieux et mettons en œuvre des 
                mesures techniques et organisationnelles appropriées pour protéger vos informations 
                personnelles contre tout accès, modification, divulgation ou destruction non autorisés.
              </p>

              <h2 className="text-xl font-semibold mb-4 mt-8">Vos droits</h2>
              <p className="mb-2">Vous avez les droits suivants concernant vos données:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification des données inexactes</li>
                <li>Droit à l'effacement de vos données (droit à l'oubli)</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d'opposition</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 mt-8">Modifications de cette politique</h2>
              <p className="mb-4">
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. 
                La version la plus récente sera toujours disponible sur cette page, avec la date 
                de dernière mise à jour indiquée en haut.
              </p>

              <h2 className="text-xl font-semibold mb-4 mt-8">Nous contacter</h2>
              <p className="mb-4">
                Si vous avez des questions concernant cette politique de confidentialité ou nos 
                pratiques en matière de données, veuillez nous contacter à:
                <br />
                <a href="mailto:contact@adcontentgenerator.com" className="text-primary hover:underline">
                  contact@adcontentgenerator.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            Retour à la page d'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
